import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/services/paypal';
import { computeServerPricing, getServerSupabase } from '@/lib/services/server-pricing';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Le client n'envoie QUE les champs métier — les montants sont recalculés.
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
        payment_method: 'paypal',
        payment_status: 'pending',
        booking_status: 'pending',
        total_amount: pricing.amountDue,
        locale,
      })
      .select('id')
      .single();

    if (error) throw new Error(`DB error: ${error.message}`);

    const bookingId = booking.id;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://islandlivingsxm.com';
    const description = `${pricing.apartmentName} — ${pricing.nights} nights (${checkIn} → ${checkOut}) — ${paymentOption === 'full' ? 'Full payment' : '40% deposit'}`;

    const paypalOrderId = await createPayPalOrder({
      amount: pricing.amountDue,
      currency: 'USD',
      bookingId,
      description,
      returnUrl: `${baseUrl}/en/booking/paypal-success?bookingId=${bookingId}`,
      cancelUrl: `${baseUrl}/en/booking/paypal-cancel?bookingId=${bookingId}`,
    });

    await supabase
      .from('bookings')
      .update({ external_payment_id: paypalOrderId })
      .eq('id', bookingId);

    return NextResponse.json({ orderId: paypalOrderId, bookingId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const code = (err as { code?: string }).code;
    const status = code === 'DATES_UNAVAILABLE' ? 409 : 500;
    console.error('[PayPal create-order]', message);
    return NextResponse.json({ error: message }, { status });
  }
}
