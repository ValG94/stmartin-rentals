import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * robots.txt — indique aux crawlers ce qui est indexable.
 *
 * Bloqués :
 *  - /admin, /admin-login → back-office privé
 *  - /api                 → endpoints serveur (webhooks, checkout, cron)
 *  - /booking/*success*, /booking/*cancel*, /booking/pay-balance
 *                         → pages de retour de paiement, non-canoniques
 *  - /apartments/*\/guide  → guide voyageur (codes Wi-Fi, infos d'arrivée)
 *
 * Autorisés : tout le reste (fiches villa, home, contact, etc.), et
 * /llms.txt, le résumé du site destiné aux assistants IA.
 */
const DISALLOW = [
  '/admin',
  '/admin/*',
  '/admin-login',
  '/api',
  '/api/*',
  ...['en', 'fr'].flatMap((l) => [
    `/${l}/admin`,
    `/${l}/admin/*`,
    `/${l}/admin-login`,
    `/${l}/booking/paypal-success`,
    `/${l}/booking/paypal-cancel`,
    `/${l}/booking/fygaro-success`,
    `/${l}/booking/fygaro-cancel`,
    `/${l}/booking/pay-balance/*`,
    `/${l}/apartments/*/guide`,
  ]),
];

// Robots des moteurs de réponse IA, autorisés explicitement : un robot qui
// a son propre groupe ignore le groupe '*', d'où la même liste DISALLOW.
//  - recherche et citation en direct : OAI-SearchBot, ChatGPT-User,
//    Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User
//  - entraînement des modèles : GPTBot, ClaudeBot, Google-Extended,
//    Applebot-Extended, CCBot, meta-externalagent
const AI_BOTS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'Claude-SearchBot',
  'Claude-User',
  'ClaudeBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'meta-externalagent',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: AI_BOTS, allow: '/', disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
