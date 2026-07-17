import { NextRequest, NextResponse } from 'next/server';
import { buildFygaroPaymentUrl } from '@/lib/services/fygaro';
import { computeServerPricing, getServerSupabase } from '@/lib/services/server-pricing';

// Format canonique d'une URL Fygaro Payment Button
// (validation sommaire pour éviter d'accepter n'importe quoi via env)
const FYGARO_URL_RE = /^https:\/\/www\.fygaro\.com\/[a-z]{2}\/pb\/[0-9a-f-]{36}\/?$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/checkout/fygaro/create-link
 *
 * Deux modes :
 *  - mode = 'booking'  → crée une booking + génère l'URL de paiement séjour
 *                        (via le Payment Button "Booking Island Living SXM")
 *  - mode = 'deposit'  → prend un bookingId existant + génère l'URL de
 *                        pré-autorisation caution (via le Payment Button
 *                        "Caution Island Living SXM" avec Manual Capture)
 *
 * Sécurité :
 *  - Le prix est RECALCULÉ côté serveur — le client n'envoie que les champs
 *    métier (dates, apartment, guests), jamais le montant.
 *  - Le JWT signé HMAC-SHA256 empêche toute modification du montant dans
 *    l'URL par le client final.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode: 'booking' | 'deposit' = body.mode === 'deposit' ? 'deposit' : 'booking';

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://islandlivingsxm.com').replace(/\/+$/, '');
    const publicKey = process.env.FYGARO_PUBLIC_KEY;
    const secretKey = process.env.FYGARO_SECRET_KEY;

    if (!publicKey || !secretKey) {
      return NextResponse.json({ error: 'FYGARO non configuré (clés manquantes)' }, { status: 500 });
    }

    // ── Mode test — override du montant pour les tests bout-en-bout ─────────
    // Si FYGARO_TEST_AMOUNT est défini côté Vercel (ex : "1" ou "0.01"), le
    // montant réel de la booking est ignoré et remplacé par cette valeur au
    // moment de signer le JWT Fygaro. La booking est quand même créée avec
    // les vrais montants en DB (pour tester la logique de statut + email).
    // Pour repasser en prod réelle : supprimer l'env var, redéployer.
    const testAmountRaw = process.env.FYGARO_TEST_AMOUNT;
    const testAmount = testAmountRaw ? Number(testAmountRaw) : null;
    const useTestAmount = testAmount !== null && Number.isFinite(testAmount) && testAmount > 0;
    if (useTestAmount) {
      console.warn(`[Fygaro] TEST MODE actif — amount override = $${testAmount}`);
    }

    // ── MODE 1 : paiement séjour ─────────────────────────────────────────────
    if (mode === 'booking') {
      const bookingButton = process.env.FYGARO_PAYMENT_URL_BOOKING;
      if (!bookingButton || !FYGARO_URL_RE.test(bookingButton)) {
        return NextResponse.json(
          { error: 'FYGARO_PAYMENT_URL_BOOKING non configuré ou invalide' },
          { status: 500 }
        );
      }

      const apartmentId: string | undefined = body.apartmentId;
      const checkIn: string | undefined = body.checkIn;
      const checkOut: string | undefined = body.checkOut;
      const guests: number = Number(body.guests);
      const guestName: string = String(body.guestName || '').trim().slice(0, 200);
      const guestEmail: string = String(body.guestEmail || '').trim().slice(0, 200);
      const paymentOption: 'full' | 'deposit_40' =
        body.paymentOption === 'deposit_40' ? 'deposit_40' : 'full';
      const locale: 'fr' | 'en' = body.locale === 'fr' ? 'fr' : 'en';

      if (!apartmentId || !checkIn || !checkOut) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      if (!guestName || !EMAIL_RE.test(guestEmail)) {
        return NextResponse.json({ error: 'Invalid guest info' }, { status: 400 });
      }
      if (!Number.isFinite(guests) || guests < 1 || guests > 20) {
        return NextResponse.json({ error: 'Invalid guest count' }, { status: 400 });
      }

      const pricing = await computeServerPricing({ apartmentId, checkIn, checkOut, paymentOption, guestsCount: guests });
      const supabase = getServerSupabase();

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          apartment_id: apartmentId,
          check_in: checkIn,
          check_out: checkOut,
          guests_count: guests,
          guest_name: guestName,
          guest_email: guestEmail,
          currency: 'USD',
          nights: pricing.nights,
          price_per_night: pricing.effectiveNightlyRate,
          accommodation_amount: pricing.accommodationAmount,
          cleaning_fee: pricing.cleaningFee,
          booking_total: pricing.bookingTotal,
          payment_option: paymentOption,
          deposit_amount: pricing.depositAmount,
          remaining_balance: pricing.remainingBalance,
          security_deposit_due_on_arrival: true,
          security_deposit_amount: pricing.securityDepositAmount,
          payment_method: 'fygaro',
          payment_status: 'pending',
          booking_status: 'pending',
          total_amount: pricing.amountDue,
          locale,
        })
        .select('id, guest_name, guest_email')
        .single();

      if (error) throw new Error(`DB error: ${error.message}`);
      const bookingId = booking.id;

      // Le return_url et les infos client sont configurés côté Payment Button
      // Fygaro (Plugins tab). On n'injecte que amount + currency + reference
      // dans le JWT (les 3 champs override supportés par Fygaro).
      // Fygaro limite custom_reference à 40 chars ; on utilise "b:<uuid>"
      // (38 chars) au lieu de "booking:<uuid>" (44). Cf. parsing symétrique
      // dans webhook + fygaro-success/cancel pages.
      const redirectUrl = buildFygaroPaymentUrl(bookingButton, {
        amount: useTestAmount ? testAmount! : pricing.amountDue,
        currency: 'USD',
        reference: `b:${bookingId}`,
      });

      return NextResponse.json({ redirectUrl, bookingId, testMode: useTestAmount || undefined });
    }

    // ── MODE 2 : empreinte CB caution ────────────────────────────────────────
    const depositButton = process.env.FYGARO_PAYMENT_URL_DEPOSIT;
    if (!depositButton || !FYGARO_URL_RE.test(depositButton)) {
      return NextResponse.json(
        { error: 'FYGARO_PAYMENT_URL_DEPOSIT non configuré ou invalide' },
        { status: 500 }
      );
    }

    const bookingId: string | undefined = body.bookingId;
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId requis pour la caution' }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, guest_name, guest_email, security_deposit_amount, locale')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking introuvable' }, { status: 404 });
    }

    const depositAmount = Number(booking.security_deposit_amount) || 0;
    if (depositAmount <= 0) {
      return NextResponse.json({ error: 'Aucun montant de caution défini pour cette booking' }, { status: 400 });
    }

    // Idem : "d:<uuid>" (38 chars) au lieu de "deposit:<uuid>" (44).
    const redirectUrl = buildFygaroPaymentUrl(depositButton, {
      amount: useTestAmount ? testAmount! : depositAmount,
      currency: 'USD',
      reference: `d:${bookingId}`,
    });

    return NextResponse.json({ redirectUrl, bookingId, testMode: useTestAmount || undefined });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const code = (err as { code?: string }).code;
    const status = code === 'DATES_UNAVAILABLE' ? 409 : 500;
    console.error('[Fygaro create-link]', message);
    return NextResponse.json({ error: message }, { status });
  }
}
