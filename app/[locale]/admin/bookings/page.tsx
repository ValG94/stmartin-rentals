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

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { isAdminTokenValid } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabase';
import BookingsClient, { type Booking } from './BookingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminBookingsPage() {
  const locale = await getLocale();

  // 1. Vérification d'auth côté serveur (cookie httpOnly)
  const cookieStore = await cookies();
  const token =
    cookieStore.get('admin_token')?.value ||
    cookieStore.get('sb-access-token')?.value;

  if (!(await isAdminTokenValid(token))) {
    redirect(`/${locale}/admin-login`);
  }

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
