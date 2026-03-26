import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminTokenAsync } from '@/lib/auth-admin';

/**
 * GET /api/admin/stats
 * Retourne les KPIs du dashboard admin.
 * Authentification : JWT Supabase dans le cookie httpOnly 'admin_token'.
 */
export async function GET(req: NextRequest) {
  // Log de débogage — à retirer une fois stable
  const cookieNames = Array.from(req.cookies.getAll()).map(c => c.name);
  const authHeader = req.headers.get('authorization');
  console.log('[/api/admin/stats] cookies présents:', cookieNames);
  console.log('[/api/admin/stats] Authorization header:', authHeader ? authHeader.slice(0, 30) + '...' : 'absent');

  const isAuth = await verifyAdminTokenAsync(req);
  console.log('[/api/admin/stats] isAuth:', isAuth);

  if (!isAuth) {
    return NextResponse.json(
      { error: 'Non autorisé', debug: { cookies: cookieNames, hasAuthHeader: !!authHeader } },
      { status: 401 }
    );
  }

  // 1. Nombre d'appartements
  const { count: apartmentsCount } = await supabaseAdmin
    .from('apartments')
    .select('id', { count: 'exact', head: true });

  // 2. Toutes les réservations avec nom de villa
  const { data: allBookings, error: bookingsError } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_status, total_amount, guest_name, guest_email, check_in, check_out, created_at, apartment_id, apartments(title_fr, title_en, slug)')
    .order('created_at', { ascending: false });

  if (bookingsError) {
    console.error('[/api/admin/stats] Erreur Supabase:', bookingsError.message);
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  const bookings = allBookings ?? [];

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.booking_status === 'confirmed').length;
  const pendingBookings = bookings.filter((b) => b.booking_status === 'pending').length;
  const cancelledBookings = bookings.filter((b) => b.booking_status === 'cancelled').length;

  const totalRevenue = bookings
    .filter((b) => b.booking_status === 'confirmed')
    .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

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
