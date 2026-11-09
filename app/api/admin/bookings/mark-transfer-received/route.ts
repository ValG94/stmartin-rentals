import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmationEmail, roomTaxEmailFields } from '@/lib/services/email';
import { toEmailAttachments, tryIssueDocumentsForPayment } from '@/lib/documents/issue';
import { getGuestWifi } from '@/lib/services/guest-access';
import { verifyAdminTokenAsync } from '@/lib/auth-admin';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const isAuth = await verifyAdminTokenAsync(req);
    if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId, receivedDate } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });
    // Date réelle de réception du virement (YYYY-MM-DD), saisie par l'admin.
    // Elle date le reçu et donc le mois de déclaration de la taxe de séjour.
    if (receivedDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(receivedDate))) {
      return NextResponse.json({ error: 'receivedDate must be YYYY-MM-DD' }, { status: 400 });
    }
    // Midi UTC = même jour calendaire à Sint Maarten (UTC-4)
    const paidAt = receivedDate ? new Date(`${receivedDate}T12:00:00Z`) : new Date();

    // Récupérer la réservation
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`*, apartments:apartment_id (title_en, title_fr, slug)`)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.booking_status === 'confirmed') {
      return NextResponse.json({ error: 'Booking already confirmed' }, { status: 400 });
    }

    // Confirmer la réservation
    const paymentStatus = booking.payment_option === 'deposit_40' ? 'partially_paid' : 'paid';
    await supabase
      .from('bookings')
      .update({
        booking_status: 'confirmed',
        payment_status: paymentStatus,
        paid_at: paidAt.toISOString(),
      })
      .eq('id', bookingId);

    // Bloquer les dates
    await supabase.from('availability_blocks').insert({
      apartment_id: booking.apartment_id,
      start_date: booking.check_in,
      end_date: booking.check_out,
      reason: `Bank transfer confirmed — Booking #${bookingId}`,
    });

    // Facture + reçu R1, datés du jour de réception du virement
    const docs = await tryIssueDocumentsForPayment(supabase, bookingId, {
      kind: booking.payment_option === 'deposit_40' ? 'deposit' : 'full',
      method: 'bank_transfer',
      paidAt,
    });

    // Envoyer l'email de confirmation au voyageur — dans sa langue
    const locale: 'fr' | 'en' = booking.locale === 'fr' ? 'fr' : 'en';
    const villaName = locale === 'fr'
      ? (booking.apartments?.title_fr || booking.apartments?.title_en || 'Villa')
      : (booking.apartments?.title_en || 'Villa');
    await sendBookingConfirmationEmail({
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      villaName,
      wifi: await getGuestWifi(supabase, booking.apartment_id),
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      nights: booking.nights || 0,
      accommodationAmount: booking.accommodation_amount,
      cleaningFee: booking.cleaning_fee,
      bookingTotal: booking.booking_total,
      ...roomTaxEmailFields(booking),
      paymentOption: booking.payment_option,
      depositAmount: booking.deposit_amount,
      remainingBalance: booking.remaining_balance,
      securityDepositAmount: booking.security_deposit_amount,
      paymentMethod: 'bank_transfer',
      bookingId,
      invoiceNumber: docs?.invoice?.number,
      attachments: toEmailAttachments(docs),
      locale,
    });

    return NextResponse.json({ success: true, bookingId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[mark-transfer-received]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
