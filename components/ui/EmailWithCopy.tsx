'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface EmailWithCopyProps {
  email: string;
  locale?: string;
  /** Tailwind classes appliquées au lien mailto */
  linkClassName?: string;
  /** Tailwind classes appliquées au bouton copier (couleur de base + hover) */
  buttonClassName?: string;
  /** Tailwind classes appliquées à la pastille "Copié !" */
  feedbackClassName?: string;
}

/**
 * Affiche un email cliquable (mailto:) avec un petit bouton "copier dans
 * le presse-papier" à côté. Utile pour les utilisateurs qui n'ont pas
 * de client mail par défaut (ex : Gmail web).
 *
 * Toujours utilisé depuis un Server Component → on récupère `locale` en
 * prop plutôt que via useLocale() pour éviter de hisser tout le footer
 * en client.
 */
export default function EmailWithCopy({
  email,
  locale = 'fr',
  linkClassName = '',
  buttonClassName = '',
  feedbackClassName = '',
}: EmailWithCopyProps) {
  const [copied, setCopied] = useState(false);
  const isFr = locale === 'fr';

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API peut échouer en contexte non-sécurisé. On laisse
      // silencieusement — l'utilisateur peut toujours utiliser le lien
      // mailto: ou faire clic-droit > Copier.
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <a href={`mailto:${email}`} className={linkClassName}>
        {email}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center justify-center p-1 -m-1 rounded transition-colors ${buttonClassName}`}
        title={isFr ? (copied ? 'Copié !' : "Copier l'email") : (copied ? 'Copied!' : 'Copy email')}
        aria-label={isFr ? "Copier l'adresse email" : 'Copy email address'}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      <span
        aria-live="polite"
        className={`text-[10px] uppercase font-medium transition-opacity duration-200 ${copied ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${feedbackClassName}`}
        style={{ letterSpacing: '0.15em' }}
      >
        {isFr ? 'Copié' : 'Copied'}
      </span>
    </span>
  );
}
