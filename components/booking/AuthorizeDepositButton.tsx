'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface Props {
  bookingId: string;
  label: string;
  loadingLabel: string;
  errorPrefix: string;
}

/**
 * Bouton client qui déclenche la création d'un lien Fygaro pour la caution
 * (mode=deposit, Payment Button avec Manual Capture) et redirige l'utilisateur
 * vers la page de paiement Fygaro.
 *
 * Utilisé sur /booking/fygaro-success après un paiement séjour réussi, pour
 * enchaîner sur la pré-autorisation de la caution.
 */
export default function AuthorizeDepositButton({ bookingId, label, loadingLabel, errorPrefix }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout/fygaro/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'deposit', bookingId }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirectUrl) {
        throw new Error(data.error || 'Failed to create deposit link');
      }
      window.location.href = data.redirectUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-bronze-500 hover:bg-bronze-600 text-cream-100 transition-all duration-300 text-xs font-medium uppercase rounded-md disabled:opacity-60 disabled:cursor-wait"
        style={{ letterSpacing: '0.15em' }}
      >
        <ShieldCheck size={16} strokeWidth={1.5} />
        {loading ? loadingLabel : label}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-3 text-center font-light">
          {errorPrefix} {error}
        </p>
      )}
    </div>
  );
}
