/**
 * Server Component — lit les données du dashboard directement depuis Supabase
 * avec le client service_role (bypass RLS, pas de vérification de token client).
 */
import { createClient } from '@supabase/supabase-js';
import DashboardClient from './DashboardClient';

interface BookingRow {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  booking_status: string;
  created_at: string;
  apartment_id: string;
  apartments?: { title_fr: string; title_en: string; slug: string } | null;
}

async function getStats() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { count: apartmentsCount } = await supabaseAdmin
    .from('apartments')
    .select('id', { count: 'exact', head: true });

  const { data: rawBookings } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, booking_status, total_amount, guest_name, guest_email, check_in, check_out, created_at, apartment_id, apartments(title_fr, title_en, slug)'
    )
    .order('created_at', { ascending: false });

  // Normaliser le champ apartments (Supabase retourne un tableau pour les relations)
  const bookings: BookingRow[] = (rawBookings ?? []).map((b: Record<string, unknown>) => {
    const apt = b.apartments;
    let apartments: { title_fr: string; title_en: string; slug: string } | null = null;
    if (Array.isArray(apt) && apt.length > 0) {
      apartments = apt[0] as { title_fr: string; title_en: string; slug: string };
    } else if (apt && !Array.isArray(apt)) {
      apartments = apt as { title_fr: string; title_en: string; slug: string };
    }
    return {
      id: b.id as string,
      guest_name: b.guest_name as string,
      guest_email: b.guest_email as string,
      check_in: b.check_in as string,
      check_out: b.check_out as string,
      total_amount: Number(b.total_amount) || 0,
      booking_status: b.booking_status as string,
      created_at: b.created_at as string,
      apartment_id: b.apartment_id as string,
      apartments,
    };
  });

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.booking_status === 'confirmed').length;
  const pendingBookings = bookings.filter((b) => b.booking_status === 'pending').length;
  const cancelledBookings = bookings.filter((b) => b.booking_status === 'cancelled').length;
  const totalRevenue = bookings
    .filter((b) => b.booking_status === 'confirmed')
    .reduce((sum, b) => sum + b.total_amount, 0);

  return {
    stats: {
      apartments: apartmentsCount ?? 0,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,
    },
    recentBookings: bookings.slice(0, 10),
  };
}

export default async function DashboardData({ locale }: { locale: string }) {
  const { stats, recentBookings } = await getStats();
  return <DashboardClient stats={stats} recentBookings={recentBookings} locale={locale} />;
}
