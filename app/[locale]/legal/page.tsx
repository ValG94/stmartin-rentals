import { getLocale } from 'next-intl/server';
import BrandLogo from '@/components/layout/BrandLogo';
import LegalContentFR from './LegalContentFR';
import LegalContentEN from './LegalContentEN';

// Page statique — revalide rarement, contenu juridique stable.
export const revalidate = 3600;

export default async function LegalPage() {
  const locale = await getLocale();
  const isFr = locale === 'fr';

  return (
    <div className="bg-cream-100 min-h-screen">
      {/* En-tête avec logo Island Living SXM */}
      <header className="bg-cream-100 border-b border-bronze-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10 flex items-center justify-center">
          <BrandLogo variant="light" forceTagline />
        </div>
      </header>

      {/* Bandeau titre */}
      <section className="border-b border-bronze-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12 text-center">
          <p className="section-label mb-3">
            {isFr ? 'Mentions légales' : 'Legal'}
          </p>
          <h1
            className="font-serif font-light text-night-600 leading-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.01em' }}
          >
            {isFr
              ? 'Conditions Générales de Réservation et de Paiement'
              : 'Booking, Payment, Cancellation and Security Deposit Terms'}
          </h1>
          <div className="divider-bronze mx-auto mt-6" />
        </div>
      </section>

      {/* Contenu */}
      <article className="max-w-4xl mx-auto px-6 lg:px-10 py-16">
        <div className="legal-content">
          {isFr ? <LegalContentFR /> : <LegalContentEN />}
        </div>
      </article>
    </div>
  );
}
