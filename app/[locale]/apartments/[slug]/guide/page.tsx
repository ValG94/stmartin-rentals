import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getApartmentBySlug } from '@/lib/api';
import { getFullGuide, getApartmentKeyInfo } from '@/lib/api-guide';
import { ChevronLeft } from 'lucide-react';
import QuickAccessCards from '@/components/guide/QuickAccessCards';
import GuideSectionBlock from '@/components/guide/GuideSectionBlock';

// ── Phrases d'accroche par villa (slug-based, data-driven safe) ──
const VILLA_TAGLINES: Record<string, { fr: string; en: string }> = {
  'villa-vanille': {
    fr: "Une parenthèse d'exception face à la mer des Caraïbes, entre lumière, élégance et horizons infinis.",
    en: 'An exceptional escape overlooking the Caribbean Sea, where light, elegance and endless horizons meet.',
  },
  'maison-blanche': {
    fr: "Un refuge paisible côté lagon, entre douceur caribéenne, art de vivre et sérénité.",
    en: 'A peaceful lagoon-side retreat where Caribbean ease, refined living and serenity come together.',
  },
};

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const res = await getApartmentBySlug(slug);
  if (!res.data) notFound();
  const apartment = res.data;

  const name = locale === 'fr' ? apartment.title_fr : apartment.title_en;

  const [sections, keyInfo] = await Promise.all([
    getFullGuide(apartment.id),
    getApartmentKeyInfo(apartment.id),
  ]);

  const isFr = locale === 'fr';
  const tagline = VILLA_TAGLINES[slug]?.[isFr ? 'fr' : 'en'] ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="pt-20 bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-6 sm:px-10 pt-10 pb-12">

          {/* Breadcrumb */}
          <Link
            href={`/${locale}/apartments/${slug}`}
            className="inline-flex items-center gap-1.5 text-stone-400 hover:text-[#B08B52] text-xs font-medium tracking-wide uppercase transition-colors mb-10"
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            {isFr ? 'Retour à la villa' : 'Back to villa'}
          </Link>

          {/* Eyebrow */}
          <p className="text-[#B08B52] text-[10px] font-semibold tracking-[0.35em] uppercase mb-4">
            {isFr ? 'Guide de la villa' : 'Villa Guide'}
          </p>

          {/* Villa name */}
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-[#0D1B2A] leading-tight mb-5">
            {name}
          </h1>

          {/* Tagline */}
          {tagline && (
            <p className="text-stone-500 text-base sm:text-lg font-light leading-relaxed max-w-xl">
              {tagline}
            </p>
          )}

          {/* Separator */}
          <div className="mt-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-stone-100" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#B08B52]/40" />
            <div className="h-px w-12 bg-stone-100" />
          </div>
        </div>
      </div>

      {/* ── CONTENU ──────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-14 space-y-16">

        {/* Quick access cards */}
        {keyInfo && (
          <QuickAccessCards keyInfo={keyInfo} locale={locale} />
        )}

        {/* Sections dynamiques */}
        {sections.length > 0 ? (
          sections.map(section => (
            <GuideSectionBlock
              key={section.id}
              section={section}
              locale={locale}
            />
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-stone-100 p-12 text-center shadow-sm">
            <p className="text-stone-400 text-sm font-light">
              {isFr
                ? 'Le guide de cette villa est en cours de préparation.'
                : 'The guide for this villa is being prepared.'}
            </p>
          </div>
        )}

        {/* Footer concierge */}
        <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1a2e42 100%)' }}>
          <div className="px-8 py-10 text-center">
            <div className="w-10 h-px bg-[#B08B52]/40 mx-auto mb-6" />
            <p className="text-[#B08B52] text-[10px] font-semibold tracking-[0.35em] uppercase mb-3">
              {isFr ? 'Votre conciergerie' : 'Your concierge'}
            </p>
            <p className="text-white/70 text-sm font-light leading-relaxed mb-7 max-w-xs mx-auto">
              {isFr
                ? 'Notre équipe est disponible pour vous accompagner à tout moment de votre séjour.'
                : 'Our team is available to assist you at any time during your stay.'}
            </p>
            {keyInfo?.whatsapp ? (
              <a
                href={`https://wa.me/${keyInfo.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-3 bg-[#B08B52] text-white rounded-full text-sm font-medium tracking-wide hover:bg-[#9a7843] transition-all hover:shadow-lg hover:shadow-[#B08B52]/20"
              >
                {isFr ? 'Nous écrire sur WhatsApp' : 'Message us on WhatsApp'}
              </a>
            ) : keyInfo?.host_phone ? (
              <a
                href={`tel:${keyInfo.host_phone}`}
                className="inline-flex items-center gap-2.5 px-7 py-3 bg-[#B08B52] text-white rounded-full text-sm font-medium tracking-wide hover:bg-[#9a7843] transition-all"
              >
                {keyInfo.host_phone}
              </a>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
