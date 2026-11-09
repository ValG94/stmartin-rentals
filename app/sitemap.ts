import type { MetadataRoute } from 'next';
import { getApartments } from '@/lib/api';
import { localeAlternates, SITE_URL } from '@/lib/seo';

const LOCALES = ['en', 'fr'] as const;

/**
 * Sitemap dynamique — inclut les pages statiques + toutes les fiches villa
 * en base, déclinées en EN et FR. Next.js expose automatiquement le
 * résultat sur /sitemap.xml.
 *
 * Le crawler prend en priorité :
 *  - / (home)                     priority 1.0
 *  - /apartments                  priority 0.9
 *  - /apartments/[slug]           priority 0.9 (pages de conversion)
 *  - /contact, /concierge         priority 0.6
 *  - /privacy, /legal             priority 0.3
 *
 * Pas d'entrées pour /admin, /admin-login, /booking/* (bloqués côté robots).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: Array<{ path: string; priority: number; changeFrequency: 'yearly' | 'monthly' | 'weekly' | 'daily' }> = [
    { path: '',            priority: 1.0, changeFrequency: 'weekly' },
    { path: '/apartments', priority: 0.9, changeFrequency: 'daily'  },
    { path: '/contact',    priority: 0.6, changeFrequency: 'monthly' },
    { path: '/concierge',  priority: 0.6, changeFrequency: 'monthly' },
    { path: '/privacy',    priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal',      priority: 0.3, changeFrequency: 'yearly' },
  ];

  // Fiche villa par slug — tirée de la DB. Si la requête échoue, on
  // n'ajoute simplement pas les URLs villa (le sitemap statique reste valide).
  const { data: apartments } = await getApartments();
  const villaEntries: MetadataRoute.Sitemap = [];
  for (const apt of apartments ?? []) {
    if (!apt.slug) continue;
    for (const locale of LOCALES) {
      villaEntries.push({
        url: `${SITE_URL}/${locale}/apartments/${apt.slug}`,
        lastModified: apt.updated_at ? new Date(apt.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: { languages: localeAlternates(locale, `/apartments/${apt.slug}`)?.languages as Record<string, string> },
      });
    }
  }

  const staticEntries: MetadataRoute.Sitemap = [];
  for (const page of staticPages) {
    for (const locale of LOCALES) {
      staticEntries.push({
        url: `${SITE_URL}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: { languages: localeAlternates(locale, page.path)?.languages as Record<string, string> },
      });
    }
  }

  return [...staticEntries, ...villaEntries];
}
