'use client';

/**
 * BrandLogo — Island Living SXM
 *
 * Reconstruit entièrement en code :
 * - Icône carré SVG inline (fond navy #0D1B2A, filet gold #C8A96B, monogramme "IL", vague gold)
 * - Wordmark "Island Living SXM" en Cormorant Garamond
 * - Tagline "Luxury Vacation Rentals" en Inter uppercase
 *
 * Variantes :
 *   dark  → texte blanc + tagline gold (sur fond sombre / hero)
 *   light → texte navy + tagline gold (sur fond blanc)
 *
 * Responsive :
 *   desktop : icône + nom + tagline
 *   mobile  : icône + nom (tagline masquée)
 */

interface BrandLogoProps {
  variant?: 'dark' | 'light';
  /** Forcer l'affichage de la tagline même sur mobile */
  forceTagline?: boolean;
}

export default function BrandLogo({ variant = 'dark', forceTagline = false }: BrandLogoProps) {
  const isDark = variant === 'dark';

  const nameColor   = isDark ? '#FFFFFF' : '#0D1B2A';
  const taglineColor = '#C8A96B';

  return (
    <div className="flex items-center" style={{ gap: '14px' }}>

      {/* ── Icône carré SVG ─────────────────────────────────────── */}
      {/* Desktop: 44px (dark hero) / 40px (light). Mobile: 32px */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 80 80"
        className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10"
        aria-hidden="true"
      >
        {/* Fond navy */}
        <rect x="0" y="0" width="80" height="80" fill="#0D1B2A" />
        {/* Filet gold intérieur */}
        <rect x="4" y="4" width="72" height="72" fill="none" stroke="#C8A96B" strokeWidth="1.5" />

        {/* Monogramme "IL" — Cormorant Garamond style, tracé SVG */}
        {/* Lettre I */}
        <text
          x="22"
          y="50"
          fontFamily="Cormorant Garamond, Cormorant, Georgia, serif"
          fontSize="36"
          fontWeight="300"
          fill="#FFFFFF"
          letterSpacing="2"
        >IL</text>

        {/* Vague gold */}
        <path
          d="M10 62 Q25 56 40 62 Q55 68 70 62"
          fill="none"
          stroke="#C8A96B"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>

      {/* ── Séparateur vertical ─────────────────────────────────── */}
      <div
        className="hidden sm:block flex-shrink-0 self-stretch"
        style={{
          width: '1px',
          background: isDark ? 'rgba(200,169,107,0.45)' : 'rgba(13,27,42,0.2)',
          margin: '4px 0',
        }}
      />

      {/* ── Bloc texte ──────────────────────────────────────────── */}
      <div className="flex flex-col justify-center" style={{ gap: '3px' }}>
        {/* Nom de marque */}
        <span
          className="font-serif leading-none whitespace-nowrap"
          style={{
            fontFamily: "'Cormorant Garamond', 'Cormorant', Georgia, serif",
            fontSize: 'clamp(16px, 2vw, 26px)',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: nameColor,
            lineHeight: 1,
          }}
        >
          Island Living SXM
        </span>

        {/* Tagline — masquée sur mobile sauf si forceTagline */}
        <span
          className={`leading-none whitespace-nowrap ${forceTagline ? 'block' : 'hidden sm:block'}`}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.24em',
            color: taglineColor,
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          Luxury Vacation Rentals
        </span>
      </div>
    </div>
  );
}
