import type { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://islandlivingsxm.com').replace(/\/+$/, '');

/**
 * robots.txt — indique aux crawlers ce qui est indexable.
 *
 * Bloqués :
 *  - /admin, /admin-login → back-office privé
 *  - /api                 → endpoints serveur (webhooks, checkout, cron)
 *  - /booking/*success*, /booking/*cancel*, /booking/pay-balance
 *                         → pages de retour de paiement, non-canoniques
 *
 * Autorisés : tout le reste (fiches villa, home, contact, etc.).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/admin-login',
          '/api',
          '/api/*',
          '/en/admin',
          '/en/admin/*',
          '/en/admin-login',
          '/fr/admin',
          '/fr/admin/*',
          '/fr/admin-login',
          '/en/booking/paypal-success',
          '/en/booking/paypal-cancel',
          '/en/booking/fygaro-success',
          '/en/booking/fygaro-cancel',
          '/en/booking/pay-balance/*',
          '/fr/booking/paypal-success',
          '/fr/booking/paypal-cancel',
          '/fr/booking/fygaro-success',
          '/fr/booking/fygaro-cancel',
          '/fr/booking/pay-balance/*',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
