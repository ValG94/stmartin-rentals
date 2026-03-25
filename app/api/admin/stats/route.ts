import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

/**
 * GET /api/admin/stats
 * Retourne les KPIs du dashboard admin :
 * - Nombre total d'appartements
 * - Nombre total de réservations
 * - Nombre de réservations confirmées
 * - Revenu total (bookings confirmées, en USD)
 * - 10 dernières réservations avec nom de villa
 */
export async function GET(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  // 1. Nombre d'appartements
  const { count: apartmentsCount } = await supabaseAdmin
    .from('apartments')
    .select('id', { count: 'exact', head: true });

  // 2. Toutes les réservations
  const { data: allBookings, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_status, total_amount, guest_name, guest_email, check_in, check_out, created_at, apartment_id, apartments(title_fr, title_en, slug)')
    .order('created_at', { ascending: false });

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  const bookings = allBookings ?? [];

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.booking_status === 'confirmed').length;
  const pendingBookings = bookings.filter((b) => b.booking_status === 'pending').length;
  const cancelledBookings = bookings.filter((b) => b.booking_status === 'cancelled').length;

  // Revenu = somme des réservations confirmées (en USD)
  const totalRevenue = bookings
    .filter((b) => b.booking_status === 'confirmed')
    .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

  // 10 dernières réservations
  const recentBookings = bookings.slice(0, 10);

  return NextResponse.json({
    stats: {
      apartments: apartmentsCount ?? 0,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,
    },
    recentBookings,
  });
}
