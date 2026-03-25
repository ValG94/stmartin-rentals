'use client';

import { useState, useEffect } from 'react';

const FALLBACK_RATE = 0.92;

/**
 * Hook pour récupérer le taux USD→EUR côté client.
 * Utilise l'API /api/currency avec un cache localStorage de 1h.
 */
export function useCurrencyRate() {
  const [rate, setRate] = useState<number>(FALLBACK_RATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const CACHE_KEY = 'usd_eur_rate';
    const CACHE_TS_KEY = 'usd_eur_rate_ts';
    const CACHE_DURATION = 60 * 60 * 1000; // 1h

    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTs = localStorage.getItem(CACHE_TS_KEY);

    if (cached && cachedTs && Date.now() - parseInt(cachedTs) < CACHE_DURATION) {
      setRate(parseFloat(cached));
      setLoading(false);
      return;
    }

    fetch('/api/currency')
      .then((r) => r.json())
      .then((data) => {
        const r = data?.usdToEur;
        if (r && typeof r === 'number') {
          setRate(r);
          localStorage.setItem(CACHE_KEY, r.toString());
          localStorage.setItem(CACHE_TS_KEY, Date.now().toString());
        }
      })
      .catch(() => {
        // Garder le fallback
      })
      .finally(() => setLoading(false));
  }, []);

  return { rate, loading };
}

/**
 * Formate un prix USD selon la locale.
 */
export function formatPriceWithRate(
  amountUsd: number,
  locale: string,
  rate: number
): string {
  if (locale === 'fr') {
    const eur = Math.round(amountUsd * rate);
    return `${eur.toLocaleString('fr-FR')} €`;
  }
  return `$${amountUsd.toLocaleString('en-US')}`;
}
