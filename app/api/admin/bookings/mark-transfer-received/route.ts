import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmationEmail } from '@/lib/services/email';
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

    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

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
        paid_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    // Bloquer les dates
    await supabase.from('availability_blocks').insert({
      apartment_id: booking.apartment_id,
      start_date: booking.check_in,
      end_date: booking.check_out,
      reason: `Bank transfer confirmed — Booking #${bookingId}`,
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
      paymentMethod: 'bank_transfer',
      bookingId,
      locale,
    });

    return NextResponse.json({ success: true, bookingId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[mark-transfer-received]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
