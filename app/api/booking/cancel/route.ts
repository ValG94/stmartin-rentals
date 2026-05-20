import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/services/server-pricing';

/**
 * POST /api/booking/cancel
 *
 * Annule une réservation en attente de paiement PayPal. Appelé quand
 * l'utilisateur ferme la popup PayPal sans payer (callback onCancel
 * du SDK PayPal).
 *
 * Sécurité :
 * - On accepte uniquement le passage de 'pending' → 'cancelled'.
 *   Impossible d'annuler une réservation confirmée via cet endpoint.
 * - Le bookingId est un UUID secret connu uniquement du client qui a
 *   créé la réservation (pas besoin d'auth supplémentaire pour la V1).
 * - Si le paiement PayPal a déjà été capturé, la réservation est en
 *   'confirmed' et l'endpoint refuse l'annulation.
 */
export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId || typeof bookingId !== 'string') {
      return NextResponse.json({ error: 'bookingId required' }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // On update conditionnellement : seules les bookings en 'pending'
    // peuvent être annulées par ce flux. Toute autre status (confirmed,
    // partially_paid, etc.) reste intacte.
    const { data, error } = await supabase
      .from('bookings')
      .update({
        booking_status: 'cancelled',
        payment_status: 'cancelled',
      })
      .eq('id', bookingId)
      .eq('booking_status', 'pending')
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[booking/cancel]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      // Soit booking non trouvée, soit déjà dans un autre état — réponse
      // neutre pour ne pas leaker d'info.
      return NextResponse.json({ success: false, message: 'No pending booking to cancel' });
    }

    return NextResponse.json({ success: true, bookingId: data.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[booking/cancel]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
