/**
 * Server Component — charge toutes les données dashboard depuis Supabase
 * (service_role, bypass RLS). Aucune vérification de token client requise.
 */
import { createClient } from '@supabase/supabase-js';
import DashboardClient from './DashboardClient';

interface BookingRow {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_amount: number;     // ce qui est dû maintenant (acompte ou solde)
  booking_total: number;    // total du séjour (accommodation + ménage)
  booking_status: string;
  payment_status?: string;
  payment_method?: string;
  created_at: string;
  apartment_id: string;
  apartments?: { title_fr: string; title_en: string; slug: string } | null;
}

export interface ApartmentRow {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
}

export interface PlanningBooking {
  id: string;
  apartment_id: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  booking_status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
}

export interface PlanningBlock {
  id: string;
  apartment_id: string;
  start_date: string;
  end_date: string;
  reason?: string | null;
}

async function getDashboardData() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { count: apartmentsCount } = await supabaseAdmin
    .from('apartments')
    .select('id', { count: 'exact', head: true });

  // Pour la liste "Recent bookings" et les stats
  const { data: rawBookings } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, booking_status, payment_status, payment_method, total_amount, booking_total, guest_name, guest_email, check_in, check_out, created_at, apartment_id, apartments(title_fr, title_en, slug)'
    )
    .order('created_at', { ascending: false });

  const bookings: BookingRow[] = (rawBookings ?? []).map((b: Record<string, unknown>) => {
    const apt = b.apartments;
    let apartments: BookingRow['apartments'] = null;
    if (Array.isArray(apt) && apt.length > 0) {
      apartments = apt[0] as BookingRow['apartments'];
    } else if (apt && !Array.isArray(apt)) {
      apartments = apt as BookingRow['apartments'];
    }
    return {
      id: b.id as string,
      guest_name: b.guest_name as string,
      guest_email: b.guest_email as string,
      check_in: b.check_in as string,
      check_out: b.check_out as string,
      total_amount: Number(b.total_amount) || 0,
      booking_total: Number(b.booking_total) || 0,
      booking_status: b.booking_status as string,
      payment_status: b.payment_status as string | undefined,
      payment_method: b.payment_method as string | undefined,
      created_at: b.created_at as string,
      apartment_id: b.apartment_id as string,
      apartments,
    };
  });

  // Stats
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.booking_status === 'confirmed').length;
  const pendingBookings = bookings.filter((b) => b.booking_status === 'pending').length;
  const cancelledBookings = bookings.filter((b) => b.booking_status === 'cancelled').length;
  // CA total des réservations confirmées = somme des booking_total
  // (= prix du séjour + frais de ménage), pas total_amount qui ne reflète
  // que l'acompte payé pour les réservations en deposit_40.
  const totalRevenue = bookings
    .filter((b) => b.booking_status === 'confirmed')
    .reduce((sum, b) => sum + (b.booking_total || b.total_amount || 0), 0);

  // Encaissé = somme des montants effectivement reçus sur le compte
  // (paiements PayPal complets ou acomptes 40% confirmés).
  const totalCollected = bookings
    .filter((b) => b.payment_status === 'paid' || b.payment_status === 'partially_paid')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  // Données pour le planning visuel par villa
  const { data: apartmentsList } = await supabaseAdmin
    .from('apartments')
    .select('id, slug, title_fr, title_en')
    .eq('is_active', true)
    .order('title_en');

  const apartments: ApartmentRow[] = (apartmentsList ?? []) as ApartmentRow[];

  // Bookings actives pour le planning (pas les cancelled/completed obsolètes)
  const today = new Date().toISOString().split('T')[0];
  const planningBookings: PlanningBooking[] = bookings
    .filter((b) =>
      ['confirmed', 'partially_paid', 'pending_bank_transfer', 'pending'].includes(b.booking_status)
      && b.check_out >= today
    )
    .map((b) => ({
      id: b.id,
      apartment_id: b.apartment_id,
      guest_name: b.guest_name,
      check_in: b.check_in,
      check_out: b.check_out,
      booking_status: b.booking_status,
      payment_status: b.payment_status || '',
      payment_method: b.payment_method || '',
      total_amount: b.total_amount,
    }));

  // Blocages manuels (maintenance, propriétaire, etc.)
  const { data: blocksRaw } = await supabaseAdmin
    .from('availability_blocks')
    .select('id, apartment_id, start_date, end_date, reason')
    .gte('end_date', today);

  const planningBlocks: PlanningBlock[] = (blocksRaw ?? []) as PlanningBlock[];

  return {
    stats: {
      apartments: apartmentsCount ?? 0,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue,
      totalCollected,
    },
    recentBookings: bookings.slice(0, 10),
    apartments,
    planningBookings,
    planningBlocks,
  };
}

export default async function DashboardData({ locale }: { locale: string }) {
  const { stats, recentBookings, apartments, planningBookings, planningBlocks } =
    await getDashboardData();
  return (
    <DashboardClient
      stats={stats}
      recentBookings={recentBookings}
      locale={locale}
      apartments={apartments}
      planningBookings={planningBookings}
      planningBlocks={planningBlocks}
    />
  );
}
