/**
 * Page dashboard admin — Server Component.
 * Lit les données directement depuis Supabase (service_role) côté serveur.
 * Aucun appel API client, aucun problème de cookie/token.
 */
import { getLocale } from 'next-intl/server';
import DashboardData from '@/components/admin/DashboardData';

// Le dashboard doit toujours refléter l'état réel de la DB (compteurs,
// planning, dernières réservations). On désactive le cache pour qu'une
// villa fraîchement créée, une nouvelle réservation, ou un changement
// de statut soit visible immédiatement à chaque ouverture.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  return <DashboardData locale={locale} />;
}
