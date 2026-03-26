/**
 * Page dashboard admin — Server Component.
 * Lit les données directement depuis Supabase (service_role) côté serveur.
 * Aucun appel API client, aucun problème de cookie/token.
 */
import { getLocale } from 'next-intl/server';
import DashboardData from '@/components/admin/DashboardData';

export default async function AdminDashboardPage() {
  const locale = await getLocale();
  return <DashboardData locale={locale} />;
}
