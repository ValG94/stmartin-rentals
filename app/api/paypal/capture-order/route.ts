import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/services/paypal';
import { sendBookingConfirmationEmail } from '@/lib/services/email';
import { getServerSupabase } from '@/lib/services/server-pricing';

export async function POST(req: NextRequest) {
  try {
    const { orderId, bookingId } = await req.json();

    if (!orderId || !bookingId) {
      return NextResponse.json({ error: 'orderId and bookingId required' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // 1. Charger la réservation avant la capture pour pouvoir valider l'intégrité.
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        apartments:apartment_id (name_fr, name_en, slug)
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 2. La capture qu'on reçoit DOIT correspondre à la commande PayPal créée
    //    pour cette réservation. Sinon, un attaquant peut associer une capture
    //    arbitraire à une autre réservation.
    if (booking.external_payment_id !== orderId) {
      console.warn('[PayPal capture] orderId mismatch', {
        bookingId, expected: booking.external_payment_id, received: orderId,
      });
      return NextResponse.json({ error: 'Order does not match booking' }, { status: 400 });
    }

    // 3. Idempotence : si déjà confirmée, ne pas re-capturer.
    if (booking.booking_status === 'confirmed' || booking.payment_status === 'paid' || booking.payment_status === 'partially_paid') {
      return NextResponse.json({ success: true, bookingId, alreadyCaptured: true });
    }

    // 4. Capturer auprès de PayPal.
    const capture = await capturePayPalOrder(orderId);

    if (capture.status !== 'COMPLETED') {
      await supabase
        .from('bookings')
        .update({ payment_status: 'failed' })
        .eq('id', bookingId);
      return NextResponse.json({ error: 'Payment not completed', status: capture.status }, { status: 400 });
    }

    // 5. Le montant capturé DOIT correspondre au montant attendu (tolérance 0.01 USD).
    const expectedAmount = Number(booking.total_amount);
    const capturedAmount = Number(capture.amount);
    if (!Number.isFinite(capturedAmount) || Math.abs(capturedAmount - expectedAmount) > 0.01) {
      console.error('[PayPal capture] amount mismatch', {
        bookingId, expected: expectedAmount, captured: capturedAmount,
      });
      await supabase
        .from('bookings')
        .update({
          payment_status: 'mismatch',
          booking_status: 'pending', // ne pas confirmer
        })
        .eq('id', bookingId);
      return NextResponse.json({ error: 'Amount mismatch — booking flagged for review' }, { status: 400 });
    }

    // 6. Tout est OK : confirmer.
    const paymentStatus = booking.payment_option === 'deposit_40' ? 'partially_paid' : 'paid';
    await supabase
      .from('bookings')
      .update({
        payment_status: paymentStatus,
        booking_status: 'confirmed',
        external_payment_id: capture.captureId,
        paid_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    // Bloquer les dates
    await supabase.from('availability_blocks').insert({
      apartment_id: booking.apartment_id,
      start_date: booking.check_in,
      end_date: booking.check_out,
      reason: `Booking #${bookingId}`,
    });

    // Email de confirmation
    const villaName = booking.apartments?.name_en || 'Villa';
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
      paymentMethod: 'paypal',
      bookingId,
    });

    return NextResponse.json({ success: true, bookingId, paymentStatus });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[PayPal capture-order]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
