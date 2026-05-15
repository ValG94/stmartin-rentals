import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/services/paypal';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      apartmentSlug,
      apartmentId,
      checkIn,
      checkOut,
      guests,
      guestName,
      guestEmail,
      nightlyRate,
      accommodationAmount,
      cleaningFee,
      bookingTotal,
      paymentOption,
      depositAmount,
      remainingBalance,
      securityDepositAmount,
      nights,
    } = body;

    // Créer la réservation en base avec statut pending
    const amountDue = paymentOption === 'full' ? bookingTotal : depositAmount;
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        apartment_id: apartmentId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        guest_name: guestName,
        guest_email: guestEmail,
        currency: 'USD',
        accommodation_amount: accommodationAmount,
        cleaning_fee: cleaningFee,
        booking_total: bookingTotal,
        payment_option: paymentOption,
        deposit_amount: depositAmount,
        remaining_balance: remainingBalance,
        security_deposit_due_on_arrival: true,
        security_deposit_amount: securityDepositAmount,
        payment_method: 'paypal',
        payment_status: 'pending',
        booking_status: 'pending',
        total_amount: amountDue,
      })
      .select('id')
      .single();

    if (error) throw new Error(`DB error: ${error.message}`);

    const bookingId = booking.id;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stmartin-rentals-seven.vercel.app';

    const villaName = apartmentSlug === 'villa-vanille' ? 'La Villa Vanille' : 'Maison Blanche';
    const description = `${villaName} — ${nights} nights (${checkIn} → ${checkOut}) — ${paymentOption === 'full' ? 'Full payment' : '40% deposit'}`;

    const paypalOrderId = await createPayPalOrder({
      amount: amountDue,
      currency: 'USD',
      bookingId,
      description,
      returnUrl: `${baseUrl}/en/booking/paypal-success?bookingId=${bookingId}`,
      cancelUrl: `${baseUrl}/en/booking/paypal-cancel?bookingId=${bookingId}`,
    });

    // Stocker l'ID PayPal dans la réservation
    await supabase
      .from('bookings')
      .update({ external_payment_id: paypalOrderId })
      .eq('id', bookingId);

    return NextResponse.json({ orderId: paypalOrderId, bookingId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[PayPal create-order]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
