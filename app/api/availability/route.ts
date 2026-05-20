import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/availability?apartmentId=xxx
 *
 * Retourne toutes les plages de dates bloquées pour un appartement :
 * - availability_blocks (maintenance, propriétaire, etc.)
 * - bookings 'confirmed' / 'partially_paid' / 'pending_bank_transfer'
 *   (= réservations engagées par le voyageur)
 * - bookings 'pending' UNIQUEMENT si créées il y a moins de 30 min
 *   (au-delà, on considère que le voyageur a abandonné le checkout PayPal
 *   et on libère les dates pour ne pas les bloquer indéfiniment)
 */

const PENDING_TTL_MINUTES = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apartmentId = searchParams.get('apartmentId');

  if (!apartmentId) {
    return NextResponse.json({ error: 'apartmentId requis' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];
  const pendingCutoff = new Date(Date.now() - PENDING_TTL_MINUTES * 60_000).toISOString();

  // 1. Blocs manuels (maintenance, propriétaire)
  const { data: blocks, error: blocksError } = await supabaseAdmin
    .from('availability_blocks')
    .select('start_date, end_date')
    .eq('apartment_id', apartmentId)
    .gte('end_date', today);

  if (blocksError) console.error('[availability] blocks error:', blocksError);

  // 2. Réservations engagées (long-living, pas de TTL)
  const { data: committedBookings, error: committedErr } = await supabaseAdmin
    .from('bookings')
    .select('check_in, check_out, booking_status')
    .eq('apartment_id', apartmentId)
    .in('booking_status', ['confirmed', 'partially_paid', 'pending_bank_transfer'])
    .gte('check_out', today);

  if (committedErr) console.error('[availability] committed bookings error:', committedErr);

  // 3. Réservations 'pending' récentes uniquement (TTL 30 min)
  //    Au-delà on considère le checkout PayPal abandonné et on libère les dates.
  const { data: recentPending, error: pendingErr } = await supabaseAdmin
    .from('bookings')
    .select('check_in, check_out, booking_status')
    .eq('apartment_id', apartmentId)
    .eq('booking_status', 'pending')
    .gte('created_at', pendingCutoff)
    .gte('check_out', today);

  if (pendingErr) console.error('[availability] pending bookings error:', pendingErr);

  // 4. Fusion
  const blockedRanges: { start: string; end: string; type: string }[] = [];

  for (const b of blocks ?? []) {
    blockedRanges.push({ start: b.start_date, end: b.end_date, type: 'block' });
  }
  for (const b of committedBookings ?? []) {
    blockedRanges.push({ start: b.check_in, end: b.check_out, type: b.booking_status });
  }
  for (const b of recentPending ?? []) {
    blockedRanges.push({ start: b.check_in, end: b.check_out, type: b.booking_status });
  }

  return NextResponse.json(
    { blockedRanges },
    {
      headers: {
        // Cache plus court (1 min) pour que les libérations soient visibles vite
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    }
  );
}
