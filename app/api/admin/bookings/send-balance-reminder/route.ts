import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminTokenAsync } from '@/lib/auth-admin';
import { createClient } from '@supabase/supabase-js';
import { sendBalanceReminderEmail } from '@/lib/services/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/bookings/send-balance-reminder
 *
 * Envoie manuellement (depuis le back-office) un email de rappel au client
 * pour qu'il règle le solde de sa réservation. Le mail contient un lien
 * vers /booking/pay-balance/[bookingId] qui redirige vers Fygaro.
 *
 * Timestampe `balance_reminded_at` pour éviter les double-clics accidentels.
 */
export async function POST(req: NextRequest) {
  try {
    const isAuth = await verifyAdminTokenAsync(req);
    if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id, guest_name, guest_email, check_in, check_out, locale,
        booking_total, deposit_amount, remaining_balance,
        payment_status, booking_status, payment_option, payment_method,
        apartments:apartment_id (title_fr, title_en)
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking introuvable' }, { status: 404 });
    }

    if (booking.booking_status === 'cancelled') {
      return NextResponse.json({ error: 'Réservation annulée — pas de rappel à envoyer' }, { status: 400 });
    }
    if (booking.payment_status === 'paid' || Number(booking.remaining_balance) <= 0) {
      return NextResponse.json({ error: 'Solde déjà réglé' }, { status: 400 });
    }
    if (booking.payment_option !== 'deposit_40') {
      return NextResponse.json({ error: "Cette réservation n'est pas en mode acompte 40%" }, { status: 400 });
    }

    const locale: 'fr' | 'en' = booking.locale === 'fr' ? 'fr' : 'en';
    const apartments = Array.isArray(booking.apartments) ? booking.apartments[0] : booking.apartments;
    const villaName = locale === 'fr'
      ? (apartments?.title_fr || apartments?.title_en || 'Villa')
      : (apartments?.title_en || 'Villa');

    // Calcul des jours restants avant l'arrivée (info affichée dans le mail)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(booking.check_in);
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysUntilCheckIn = Math.max(0, Math.round((checkInDate.getTime() - today.getTime()) / msPerDay));

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://islandlivingsxm.com').replace(/\/+$/, '');
    const paymentLink = `${siteUrl}/${locale}/booking/pay-balance/${bookingId}`;

    await sendBalanceReminderEmail({
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      villaName,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      remainingBalance: Number(booking.remaining_balance) || 0,
      bookingTotal: Number(booking.booking_total) || 0,
      depositAmountPaid: Number(booking.deposit_amount) || 0,
      bookingId,
      paymentLink,
      daysUntilCheckIn,
      locale,
    });

    // Marque l'envoi pour éviter le spam si Sonia re-clique
    await supabase
      .from('bookings')
      .update({ balance_reminded_at: new Date().toISOString() })
      .eq('id', bookingId);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[send-balance-reminder]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
