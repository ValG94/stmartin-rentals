import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/lib/services/paypal';
import { sendBookingConfirmationEmail } from '@/lib/services/email';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { orderId, bookingId } = await req.json();

    // Capturer le paiement PayPal
    const capture = await capturePayPalOrder(orderId);

    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Payment not completed', status: capture.status }, { status: 400 });
    }

    // Récupérer la réservation
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        apartments:apartment_id (name_fr, name_en, slug)
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) throw new Error('Booking not found');

    // Mettre à jour le statut
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

    // Bloquer les dates dans availability_blocks
    await supabase.from('availability_blocks').insert({
      apartment_id: booking.apartment_id,
      start_date: booking.check_in,
      end_date: booking.check_out,
      reason: `Booking #${bookingId}`,
    });

    // Envoyer l'email de confirmation
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
