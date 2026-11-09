import { getLocale } from 'next-intl/server';
import BrandLogo from '@/components/layout/BrandLogo';
import PrivacyContentFR from './PrivacyContentFR';
import PrivacyContentEN from './PrivacyContentEN';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return locale === 'fr'
    ? pageMetadata(locale, '/privacy', 'Politique de confidentialité', 'Comment Island Living SXM collecte, utilise et protège vos données personnelles lors d’une réservation de villa à Saint-Martin.')
    : pageMetadata(locale, '/privacy', 'Privacy policy', 'How Island Living SXM collects, uses and protects your personal data when you book a villa in Sint Maarten.');
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const isFr = locale === 'fr';

  return (
    <div className="bg-cream-100 min-h-screen">
      {/* En-tête avec logo */}
      <header className="bg-cream-100 border-b border-bronze-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10 flex items-center justify-center">
          <BrandLogo variant="light" forceTagline />
        </div>
      </header>

      {/* Bandeau titre */}
      <section className="border-b border-bronze-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12 text-center">
          <p className="section-label mb-3">
            {isFr ? 'Vie privée' : 'Privacy'}
          </p>
          <h1
            className="font-serif font-light text-night-600 leading-tight"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.01em' }}
          >
            {isFr
              ? 'Politique de confidentialité'
              : 'Privacy Policy'}
          </h1>
          <div className="divider-bronze mx-auto mt-6" />
          <p className="text-xs text-night-400 mt-6 uppercase font-medium" style={{ letterSpacing: '0.15em' }}>
            {isFr ? 'Dernière mise à jour : mai 2026' : 'Last updated: May 2026'}
          </p>
        </div>
      </section>

      {/* Contenu */}
      <article className="max-w-4xl mx-auto px-6 lg:px-10 py-16">
        <div className="legal-content">
          {isFr ? <PrivacyContentFR /> : <PrivacyContentEN />}
        </div>
      </article>
    </div>
  );
}
