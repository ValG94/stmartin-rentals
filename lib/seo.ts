import type { Metadata } from 'next';

// URL publique canonique du site. Avec www : l'apex islandlivingsxm.com
// redirige en 308 vers www, et un canonical ou un hreflang qui pointe vers
// une URL redirigée est ignoré par Google et signalé par Lighthouse.
// En dur volontairement : NEXT_PUBLIC_SITE_URL sert aux retours de paiement
// et aux emails et peut viser une preview, alors que canonical, hreflang,
// sitemap et données structurées doivent toujours désigner la prod.
export const SITE_URL = 'https://www.islandlivingsxm.com';

export const SITE_NAME = 'Island Living SXM';
export const CONTACT_PHONE = '+1-514-947-6100';
export const CONTACT_EMAIL = 'contact@islandlivingsxm.com';

/**
 * canonical vers la page elle-même + hreflang fr/en + x-default.
 * `path` est le chemin sans préfixe de langue ('' pour l'accueil,
 * '/contact', '/apartments/villa-vanille'…).
 */
export function localeAlternates(locale: string, path = ''): Metadata['alternates'] {
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages: {
      en: `${SITE_URL}/en${path}`,
      fr: `${SITE_URL}/fr${path}`,
      // Version proposée aux visiteurs dont la langue n'est ni fr ni en
      'x-default': `${SITE_URL}/en${path}`,
    },
  };
}

/** Métadonnées d'une page publique : titre, description, canonical, Open Graph. */
export function pageMetadata(locale: string, path: string, title: string, description: string): Metadata {
  const isFr = locale === 'fr';
  return {
    title,
    description,
    alternates: localeAlternates(locale, path),
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description,
      url: `${SITE_URL}/${locale}${path}`,
      siteName: SITE_NAME,
      type: 'website',
      locale: isFr ? 'fr_FR' : 'en_US',
      alternateLocale: isFr ? 'en_US' : 'fr_FR',
      // openGraph n'est pas fusionné avec celui du layout : on remet l'image
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: SITE_NAME }],
    },
  };
}
