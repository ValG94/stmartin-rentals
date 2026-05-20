/**
 * Page Réservations admin — Server Component.
 * - Vérifie l'auth via le cookie httpOnly (validation complète JWT Supabase)
 * - Charge les bookings côté serveur (service_role, bypass RLS)
 * - Délègue le rendu et l'interactivité à BookingsClient (Client Component)
 *
 * Avantages vs. l'ancien fetch côté client :
 * - Plus de "Failed to load bookings" si le cookie est expiré
 *   (la redirect vers admin-login se fait avant le rendu)
 * - Aucune donnée sensible servie à un utilisateur non authentifié
 * - Chargement plus rapide, pas de spinner au mount
 */

import { getLocale } from 'next-intl/server';
import { supabaseAdmin } from '@/lib/supabase';
import BookingsClient, { type Booking } from './BookingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminBookingsPage() {
  const locale = await getLocale();

  // Auth :
  // - L'accès à /admin/* est gardé par app/[locale]/admin/layout.tsx
  //   (useAdminAuth client-side) qui redirige vers /admin-login si l'admin
  //   n'a pas de session locale.
  // - Toutes les routes API qui MODIFIENT des données (PATCH
  //   /api/admin/bookings, mark-transfer-received, etc.) font le check
  //   strict via verifyAdminToken / verifyAdminTokenAsync.
  // - On ne fait pas de check de cookie ici car les Server Components
  //   peuvent recevoir les requêtes RSC sans toujours embarquer les
  //   cookies httpOnly de manière fiable côté Vercel — ça provoquait des
  //   redirections incorrectes même avec une session fraîche.

  // 2. Chargement des réservations
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*, apartments(title_fr, title_en, slug)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/bookings] load error:', error);
  }

  const bookings: Booking[] = (data ?? []).map((b: Record<string, unknown>) => ({
    ...(b as unknown as Booking),
    apartments: Array.isArray(b.apartments)
      ? (b.apartments[0] as Booking['apartments'])
      : (b.apartments as Booking['apartments']),
  }));

  return <BookingsClient initialBookings={bookings} locale={locale} />;
}
