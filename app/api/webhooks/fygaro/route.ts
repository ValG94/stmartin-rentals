import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyFygaroWebhookSignature, type FygaroWebhookPayload } from '@/lib/services/fygaro';
import { sendBookingConfirmationEmail, sendDepositAuthorizedEmail, sendBalancePaidEmail } from '@/lib/services/email';
import { getServerSupabase } from '@/lib/services/server-pricing';

// Node runtime nécessaire pour crypto.createHmac
export const runtime = 'nodejs';
// Empêche Next.js de tenter de pré-évaluer la route au build
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/fygaro
 *
 * Endpoint appelé par Fygaro à chaque événement de paiement sur les
 * Payment Buttons "Booking" et "Caution". Vérifie la signature HMAC-SHA256
 * puis met à jour la booking selon le type :
 *  - reference "booking:<id>" → paiement séjour → confirmed + email
 *  - reference "deposit:<id>" → empreinte caution → deposit_authorization_id
 *
 * IMPORTANT : cette route lit le body EN BRUT (raw text) pour pouvoir
 * vérifier le HMAC. Ne JAMAIS parser en JSON avant vérification.
 */
export async function POST(req: NextRequest) {
  // 1. Lecture du body brut (indispensable pour HMAC)
  const rawBody = await req.text();
  const signatureHeader = req.headers.get('fygaro-signature');

  // 2. Vérification de la signature
  const verification = verifyFygaroWebhookSignature(rawBody, signatureHeader);
  if (!verification.valid) {
    console.warn('[Fygaro webhook] signature invalide :', verification.reason);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Parsing du payload (safe : la signature est vérifiée)
  let payload: FygaroWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const reference = payload.customReference || payload.reference || '';
  const [refType, bookingId] = reference.split(':');

  // custom_reference est limité à 40 chars côté Fygaro donc on utilise les
  // préfixes courts "b:" et "d:" (cf. create-link/route.ts). On accepte
  // aussi les anciens "booking:"/"deposit:" pour rétrocompat si un webhook
  // en flight arrive après ce déploiement.
  const isBooking = refType === 'b' || refType === 'booking';
  const isDeposit = refType === 'd' || refType === 'deposit';
  const isBalance = refType === 'bal';
  if (!bookingId || (!isBooking && !isDeposit && !isBalance)) {
    console.warn('[Fygaro webhook] reference inattendue :', reference);
    // On répond 200 pour ne pas déclencher les retries Fygaro sur un
    // webhook qu'on n'attend pas (ex : produit non lié à une booking).
    return NextResponse.json({ ignored: true });
  }

  const supabase = getServerSupabase();

  // ── Type 1 : paiement séjour ────────────────────────────────────────────
  if (isBooking) {
    return await handleBookingPayment(bookingId, payload, supabase);
  }

  // ── Type 3 : paiement du solde restant (booking déjà 40% payée) ─────────
  if (isBalance) {
    return await handleBalancePayment(bookingId, payload, supabase);
  }

  // ── Type 2 : empreinte caution ──────────────────────────────────────────
  return await handleDepositAuthorization(bookingId, payload, supabase);
}

// ── Handlers ────────────────────────────────────────────────────────────────

type SupabaseClient = ReturnType<typeof getServerSupabase>;

async function handleBookingPayment(
  bookingId: string,
  payload: FygaroWebhookPayload,
  supabase: SupabaseClient,
) {
  // Charge la booking pour valider intégrité + idempotence
  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select(`
      *,
      apartments:apartment_id (title_fr, title_en, slug)
    `)
    .eq('id', bookingId)
    .single();

  if (fetchErr || !booking) {
    console.warn('[Fygaro webhook] booking introuvable', bookingId);
    // On répond 200 pour éviter les retries — la booking n'existe pas
    return NextResponse.json({ ignored: true });
  }

  // Idempotence : si déjà confirmée, on ne refait rien
  if (
    booking.booking_status === 'confirmed' ||
    booking.payment_status === 'paid' ||
    booking.payment_status === 'partially_paid'
  ) {
    return NextResponse.json({ success: true, alreadyProcessed: true });
  }

  // Validation du montant (tolérance 0.01 USD). En TEST MODE (env
  // FYGARO_TEST_AMOUNT défini), on skip cette vérif puisque Fygaro reçoit
  // le montant override et le renvoie tel quel — c'est attendu qu'il ne
  // matche pas le vrai booking.total_amount stocké en DB.
  const testAmountRaw = process.env.FYGARO_TEST_AMOUNT;
  const isTestMode = testAmountRaw && Number(testAmountRaw) > 0;
  const expectedAmount = Number(booking.total_amount);
  const capturedAmount = Number(payload.amount);
  if (!isTestMode && (!Number.isFinite(capturedAmount) || Math.abs(capturedAmount - expectedAmount) > 0.01)) {
    console.error('[Fygaro webhook] amount mismatch', {
      bookingId, expected: expectedAmount, received: capturedAmount,
    });
    await supabase
      .from('bookings')
      .update({
        payment_status: 'failed',
        notes: `Fygaro amount mismatch: got ${capturedAmount}, expected ${expectedAmount}. Transaction ${payload.transactionId}. Manual review required.`,
      })
      .eq('id', bookingId);
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
  }
  if (isTestMode) {
    console.warn(`[Fygaro webhook] TEST MODE — skipping amount check (got $${capturedAmount}, real $${expectedAmount})`);
  }

  // Validation devise
  if (payload.currency && payload.currency.toUpperCase() !== 'USD') {
    console.error('[Fygaro webhook] currency mismatch', { bookingId, received: payload.currency });
    return NextResponse.json({ error: 'Currency mismatch' }, { status: 400 });
  }

  // Tout est OK → confirmer
  const paymentStatus = booking.payment_option === 'deposit_40' ? 'partially_paid' : 'paid';
  await supabase
    .from('bookings')
    .update({
      payment_status: paymentStatus,
      booking_status: 'confirmed',
      payment_method: 'fygaro',
      external_payment_id: payload.transactionId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  // Bloquer les dates
  await supabase.from('availability_blocks').insert({
    apartment_id: booking.apartment_id,
    start_date: booking.check_in,
    end_date: booking.check_out,
    label: `Booking #${bookingId} (Fygaro)`,
    block_type: 'booking',
    source: 'manual',
    booking_id: bookingId,
  });

  // Email de confirmation
  const locale: 'fr' | 'en' = booking.locale === 'fr' ? 'fr' : 'en';
  const villaName = locale === 'fr'
    ? (booking.apartments?.title_fr || booking.apartments?.title_en || 'Villa')
    : (booking.apartments?.title_en || 'Villa');

  try {
    await sendBookingConfirmationEmail({
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      villaName,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      nights: booking.nights || 0,
      accommodationAmount: booking.accommodation_amount,
      cleaningFee: booking.cleaning_fee,
      bookingTotal: booking.booking_total,
      paymentOption: booking.payment_option,
      depositAmount: booking.deposit_amount,
      remainingBalance: booking.remaining_balance,
      securityDepositAmount: booking.security_deposit_amount,
      paymentMethod: 'card',
      bookingId,
      locale,
      depositAuthorizationStatus: booking.deposit_authorization_status,
    });
  } catch (emailErr) {
    // Ne pas planter le webhook si l'email échoue — la booking est déjà confirmée
    console.error('[Fygaro webhook] email confirmation failed:', emailErr);
  }

  // Revalide la fiche villa pour propager la nouvelle indisponibilité
  revalidatePath('/[locale]/apartments/[slug]', 'page');

  return NextResponse.json({ success: true, bookingId, paymentStatus });
}

async function handleDepositAuthorization(
  bookingId: string,
  payload: FygaroWebhookPayload,
  supabase: SupabaseClient,
) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, guest_name, guest_email, check_in, check_out, locale,
      security_deposit_amount, deposit_authorization_id,
      apartments:apartment_id (title_fr, title_en)
    `)
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    console.warn('[Fygaro webhook] deposit : booking introuvable', bookingId);
    return NextResponse.json({ ignored: true });
  }

  // Idempotence : ne pas réécrire si déjà autorisé avec cette même transaction
  if (booking.deposit_authorization_id === payload.transactionId) {
    return NextResponse.json({ success: true, alreadyProcessed: true });
  }

  // Validation du montant (tolérance 0.01 USD). Skippée en TEST MODE, cf. handleBookingPayment.
  const testAmountRaw = process.env.FYGARO_TEST_AMOUNT;
  const isTestMode = testAmountRaw && Number(testAmountRaw) > 0;
  const expectedAmount = Number(booking.security_deposit_amount) || 0;
  const authAmount = Number(payload.amount);
  if (!isTestMode && (!Number.isFinite(authAmount) || Math.abs(authAmount - expectedAmount) > 0.01)) {
    console.error('[Fygaro webhook] deposit amount mismatch', {
      bookingId, expected: expectedAmount, received: authAmount,
    });
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
  }

  // Statut : "authorized" par défaut (Manual Capture activé côté bouton).
  // Fygaro peut aussi envoyer "captured"/"voided" plus tard (via son dashboard).
  const status = (payload.status || 'authorized').toLowerCase();
  const validStatuses = ['authorized', 'captured', 'voided', 'expired'];
  const normalizedStatus = validStatuses.includes(status) ? status : 'authorized';

  await supabase
    .from('bookings')
    .update({
      deposit_authorization_id: payload.transactionId,
      deposit_authorization_status: normalizedStatus,
      deposit_authorized_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  // Email de confirmation empreinte au client — uniquement au premier
  // event 'authorized' (les callbacks ultérieurs de capture/void n'envoient
  // pas de nouveau mail, ils sont visibles côté admin dashboard).
  if (normalizedStatus === 'authorized') {
    const locale: 'fr' | 'en' = (booking as { locale?: string }).locale === 'fr' ? 'fr' : 'en';
    type ApartmentInfo = { title_fr?: string; title_en?: string };
    const apartmentsRaw = (booking as { apartments?: ApartmentInfo | ApartmentInfo[] }).apartments;
    const apartments = Array.isArray(apartmentsRaw) ? apartmentsRaw[0] : apartmentsRaw;
    const villaName = locale === 'fr'
      ? (apartments?.title_fr || apartments?.title_en || 'Villa')
      : (apartments?.title_en || 'Villa');

    try {
      await sendDepositAuthorizedEmail({
        guestName: (booking as { guest_name: string }).guest_name,
        guestEmail: (booking as { guest_email: string }).guest_email,
        villaName,
        checkIn: (booking as { check_in: string }).check_in,
        checkOut: (booking as { check_out: string }).check_out,
        securityDepositAmount: Number((booking as { security_deposit_amount: number }).security_deposit_amount) || 0,
        bookingId,
        locale,
      });
    } catch (emailErr) {
      // On ne plante pas le webhook si l'email échoue — la caution est enregistrée
      console.error('[Fygaro webhook] deposit email failed:', emailErr);
    }
  }

  return NextResponse.json({ success: true, bookingId, status: normalizedStatus });
}

async function handleBalancePayment(
  bookingId: string,
  payload: FygaroWebhookPayload,
  supabase: SupabaseClient,
) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, guest_name, guest_email, check_in, check_out, locale,
      remaining_balance, booking_total, payment_status,
      apartments:apartment_id (title_fr, title_en)
    `)
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    console.warn('[Fygaro webhook] balance : booking introuvable', bookingId);
    return NextResponse.json({ ignored: true });
  }

  type BookingRow = {
    id: string; guest_name: string; guest_email: string;
    check_in: string; check_out: string; locale?: string;
    remaining_balance: number; booking_total: number; payment_status: string;
    apartments?: { title_fr?: string; title_en?: string } | { title_fr?: string; title_en?: string }[];
  };
  const b = booking as BookingRow;

  // Idempotence : booking déjà payée en totalité
  if (b.payment_status === 'paid') {
    return NextResponse.json({ success: true, alreadyProcessed: true });
  }

  // Validation du montant (tolérance 0.01). Skippée en TEST MODE.
  const testAmountRaw = process.env.FYGARO_TEST_AMOUNT;
  const isTestMode = testAmountRaw && Number(testAmountRaw) > 0;
  const expectedAmount = Number(b.remaining_balance) || 0;
  const capturedAmount = Number(payload.amount);
  if (!isTestMode && (!Number.isFinite(capturedAmount) || Math.abs(capturedAmount - expectedAmount) > 0.01)) {
    console.error('[Fygaro webhook] balance amount mismatch', {
      bookingId, expected: expectedAmount, received: capturedAmount,
    });
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
  }

  // Booking fully paid : remaining_balance passe à 0 + statut 'paid'
  await supabase
    .from('bookings')
    .update({
      payment_status: 'paid',
      remaining_balance: 0,
      balance_paid_at: new Date().toISOString(),
      balance_transaction_id: payload.transactionId,
    })
    .eq('id', bookingId);

  const locale: 'fr' | 'en' = b.locale === 'fr' ? 'fr' : 'en';
  const apartments = Array.isArray(b.apartments) ? b.apartments[0] : b.apartments;
  const villaName = locale === 'fr'
    ? (apartments?.title_fr || apartments?.title_en || 'Villa')
    : (apartments?.title_en || 'Villa');

  try {
    await sendBalancePaidEmail({
      guestName: b.guest_name,
      guestEmail: b.guest_email,
      villaName,
      checkIn: b.check_in,
      checkOut: b.check_out,
      amountPaid: expectedAmount,
      bookingTotal: Number(b.booking_total) || 0,
      bookingId,
      locale,
    });
  } catch (emailErr) {
    console.error('[Fygaro webhook] balance email failed:', emailErr);
  }

  return NextResponse.json({ success: true, bookingId, paymentStatus: 'paid' });
}
