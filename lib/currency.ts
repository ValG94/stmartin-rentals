/**
 * Service de conversion de devises USD ↔ EUR
 * Utilise l'API open.er-api.com (gratuite, pas de clé requise)
 * Fallback sur un taux fixe si l'API est indisponible
 */

const FALLBACK_USD_TO_EUR = 0.92; // Taux de secours
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 heure

interface RateCache {
  rate: number;
  timestamp: number;
}

// Cache en mémoire (côté serveur, partagé entre les requêtes dans le même processus)
let rateCache: RateCache | null = null;

/**
 * Récupère le taux de change USD → EUR en temps réel.
 * Met en cache le résultat pendant 1 heure.
 */
export async function getUsdToEurRate(): Promise<number> {
  // Vérifier le cache
  if (rateCache && Date.now() - rateCache.timestamp < CACHE_DURATION_MS) {
    return rateCache.rate;
  }

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 }, // Next.js cache 1h
    });

    if (!response.ok) throw new Error('API indisponible');

    const data = await response.json();
    const rate = data?.rates?.EUR;

    if (!rate || typeof rate !== 'number') throw new Error('Taux invalide');

    // Mettre en cache
    rateCache = { rate, timestamp: Date.now() };
    return rate;
  } catch {
    console.warn('[Currency] Impossible de récupérer le taux USD/EUR, utilisation du taux de secours:', FALLBACK_USD_TO_EUR);
    return FALLBACK_USD_TO_EUR;
  }
}

/**
 * Convertit un montant USD en EUR.
 */
export async function usdToEur(amountUsd: number): Promise<number> {
  const rate = await getUsdToEurRate();
  return Math.round(amountUsd * rate);
}

/**
 * Formate un prix selon la devise et la locale.
 * - locale 'en' → affiche en USD ($)
 * - locale 'fr' → affiche en EUR (€)
 */
export function formatPrice(
  amountUsd: number,
  locale: 'fr' | 'en',
  eurRate?: number
): string {
  if (locale === 'fr' && eurRate) {
    const eur = Math.round(amountUsd * eurRate);
    return `${eur.toLocaleString('fr-FR')} €`;
  }
  return `$${amountUsd.toLocaleString('en-US')}`;
}

/**
 * Retourne le symbole de devise selon la locale.
 */
export function getCurrencySymbol(locale: 'fr' | 'en'): string {
  return locale === 'fr' ? '€' : '$';
}
