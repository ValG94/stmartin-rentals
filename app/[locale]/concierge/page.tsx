import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ShoppingBasket, ChefHat, Car, Sparkles, Sailboat, Flower2, MessageCircle, Mail, ArrowRight } from 'lucide-react';
import { CONCIERGE_SERVICES, type ConciergeServiceIcon } from '@/lib/concierge';

const ICONS: Record<ConciergeServiceIcon, React.ComponentType<{ size?: number; className?: string }>> = {
  grocery:  ShoppingBasket,
  chef:     ChefHat,
  transfer: Car,
  cleaning: Sparkles,
  boat:     Sailboat,
  spa:      Flower2,
};

export default async function ConciergePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('concierge');
  const isFr = locale === 'fr';

  return (
    <div className="bg-cream-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <header className="text-center mb-20">
          <p className="section-label mb-6">{isFr ? 'Service inclus' : 'Included service'}</p>
          <h1
            className="font-serif font-light text-night-600 mb-6 leading-[1.05]"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', letterSpacing: '-0.01em' }}
          >
            {t('hero_title')}
          </h1>
          <div className="w-12 h-px bg-bronze-400 mx-auto mb-8" />
          <p className="text-night-400 max-w-2xl mx-auto leading-relaxed font-light text-base md:text-lg">
            {t('hero_subtitle')}
          </p>
        </header>

        {/* ── Services ────────────────────────────────────────── */}
        <div className="space-y-16">
          {CONCIERGE_SERVICES.map((service, i) => {
            const Icon = ICONS[service.icon];
            const title = isFr ? service.title_fr : service.title_en;
            const intro = isFr ? service.intro_fr : service.intro_en;
            const body = isFr ? service.body_fr : service.body_en;
            const pricingNote = isFr ? service.pricing_note_fr : service.pricing_note_en;

            return (
              <section
                key={service.slug}
                id={service.slug}
                className="bg-sand-100 border border-bronze-100 rounded-2xl p-8 md:p-12 scroll-mt-32"
              >
                {/* Numéro + icône */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 border border-bronze-300 rounded-full text-bronze-400">
                    <Icon size={22} />
                  </div>
                  <span
                    className="text-xs uppercase font-medium text-night-400"
                    style={{ letterSpacing: '0.2em' }}
                  >
                    {isFr ? 'Service' : 'Service'} {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Titre */}
                <h2
                  className="font-serif font-light text-night-600 mb-4"
                  style={{ fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', letterSpacing: '-0.005em' }}
                >
                  {title}
                </h2>
                <div className="w-10 h-px bg-bronze-400 mb-6" />

                {/* Intro */}
                <p className="text-night-500 text-base md:text-lg font-light leading-relaxed mb-6 max-w-3xl">
                  {intro}
                </p>

                {/* Body — paragraphes séparés par \n */}
                <div className="space-y-4 text-night-500 font-light leading-relaxed max-w-3xl">
                  {body.split('\n').filter(Boolean).map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>

                {/* Note tarifaire */}
                {pricingNote && (
                  <div className="mt-8 pt-6 border-t border-bronze-100/70">
                    <p className="text-sm text-night-400 italic leading-relaxed">
                      <span className="font-medium text-bronze-500 not-italic mr-2">
                        {isFr ? 'Tarif :' : 'Pricing:'}
                      </span>
                      {pricingNote}
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* ── CTA Contact ─────────────────────────────────────── */}
        <section className="mt-24 border-y border-bronze-100 py-16 text-center">
          <p className="section-label mb-4">{isFr ? 'Une demande particulière ?' : 'A specific request?'}</p>
          <h2
            className="font-serif font-light text-night-600 mb-4"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}
          >
            {t('cta_title')}
          </h2>
          <p className="text-night-400 max-w-xl mx-auto mb-8 font-light leading-relaxed">
            {t('cta_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/15149476100"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 px-7 py-3.5 bg-night-600 text-cream-100 hover:bg-night-500 transition-all duration-500 text-xs font-medium uppercase"
              style={{ letterSpacing: '0.15em' }}
            >
              <MessageCircle size={16} />
              WhatsApp
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <Link
              href={`/${locale}/contact`}
              className="group inline-flex items-center gap-3 px-7 py-3.5 border border-bronze-300 text-bronze-500 hover:bg-bronze-400 hover:text-cream-100 hover:border-bronze-400 transition-all duration-500 text-xs font-medium uppercase"
              style={{ letterSpacing: '0.15em' }}
            >
              <Mail size={16} />
              {isFr ? 'Nous écrire' : 'Email us'}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
