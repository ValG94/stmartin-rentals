import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';
import { sendBookingCancellationEmail } from '@/lib/services/email';

/**
 * POST /api/admin/bookings/cancel
 *
 * Annule une réservation depuis le dashboard admin :
 *  1. Passe booking_status = 'cancelled'
 *  2. Libère les dates dans le calendrier (delete availability_blocks liés)
 *  3. Envoie un email au voyageur avec le motif (optionnel)
 *
 * Body : { bookingId: string, reason?: string, skipEmail?: boolean }
 *
 * skipEmail = true est utilisé par le cleanup DB des réservations de test
 * pour éviter de spammer une adresse valide.
 */
export async function POST(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json();
  const bookingId: string | undefined = body.bookingId;
  const reason: string | undefined = body.reason?.trim() || undefined;
  const skipEmail: boolean = body.skipEmail === true;

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId requis' }, { status: 400 });
  }

  // 1. Charger la booking pour l'email + savoir de quels blocs se débarrasser
  const { data: booking, error: fetchErr } = await supabaseAdmin
    .from('bookings')
    .select(`
      id, guest_name, guest_email, check_in, check_out, booking_status, locale,
      apartments:apartment_id (title_fr, title_en)
    `)
    .eq('id', bookingId)
    .single();

  if (fetchErr || !booking) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
  }
  if (booking.booking_status === 'cancelled') {
    return NextResponse.json({ error: 'Déjà annulée' }, { status: 400 });
  }

  // 2. Marquer 'cancelled'
  const { error: updateErr } = await supabaseAdmin
    .from('bookings')
    .update({ booking_status: 'cancelled' })
    .eq('id', bookingId);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // 3. Libérer les dates — supprimer les availability_blocks associés
  //    (via booking_id FK, uniquement les blocs manuels/booking, jamais les
  //    imports Airbnb/VRBO qui ont source différent)
  const { error: delErr } = await supabaseAdmin
    .from('availability_blocks')
    .delete()
    .eq('booking_id', bookingId);
  if (delErr) {
    console.error('[cancel] failed to release availability blocks:', delErr);
    // On continue quand même — la booking est cancelled, c'est le plus important
  }

  // 4. Email au voyageur
  let emailSent = false;
  if (!skipEmail) {
    const apt = Array.isArray(booking.apartments) ? booking.apartments[0] : booking.apartments;
    const locale = booking.locale === 'fr' ? 'fr' : 'en';
    const villaName = locale === 'fr' ? (apt?.title_fr || 'Villa') : (apt?.title_en || 'Villa');
    try {
      await sendBookingCancellationEmail({
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        villaName,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        bookingId,
        reason,
        locale,
      });
      emailSent = true;
    } catch (emailErr) {
      console.error('[cancel] email failed:', emailErr);
    }
  }

  // 5. Revalider la fiche villa pour propager la libération des dates
  revalidatePath('/[locale]/apartments/[slug]', 'page');

  return NextResponse.json({
    success: true,
    bookingId,
    emailSent,
  });
}
