import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/availability?apartmentId=xxx
 *
 * Retourne toutes les plages de dates bloquées pour un appartement :
 * - availability_blocks (maintenance, propriétaire, etc.)
 * - bookings avec statut 'confirmed' ou 'pending'
 *
 * Format de réponse : { blockedRanges: [{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }] }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apartmentId = searchParams.get('apartmentId');

  if (!apartmentId) {
    return NextResponse.json({ error: 'apartmentId requis' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  // 1. Récupérer les blocs de disponibilité (maintenance, owner, etc.)
  const { data: blocks, error: blocksError } = await supabaseAdmin
    .from('availability_blocks')
    .select('start_date, end_date')
    .eq('apartment_id', apartmentId)
    .gte('end_date', today);

  if (blocksError) {
    console.error('[availability] blocks error:', blocksError);
  }

  // 2. Récupérer les réservations confirmées ou en attente
  const { data: bookings, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select('check_in, check_out, booking_status')
    .eq('apartment_id', apartmentId)
    .in('booking_status', ['confirmed', 'pending'])
    .gte('check_out', today);

  if (bookingsError) {
    console.error('[availability] bookings error:', bookingsError);
  }

  // 3. Fusionner les deux sources
  const blockedRanges: { start: string; end: string; type: string }[] = [];

  for (const b of blocks ?? []) {
    blockedRanges.push({ start: b.start_date, end: b.end_date, type: 'block' });
  }

  for (const b of bookings ?? []) {
    blockedRanges.push({
      start: b.check_in,
      end: b.check_out,
      type: b.booking_status,
    });
  }

  return NextResponse.json(
    { blockedRanges },
    {
      headers: {
        // Cache court (5 min) pour éviter les requêtes répétées
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    }
  );
}
