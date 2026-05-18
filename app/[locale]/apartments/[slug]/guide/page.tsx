import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getApartmentBySlug } from '@/lib/api';
import { getFullGuide, getApartmentKeyInfo } from '@/lib/api-guide';
import { ChevronLeft } from 'lucide-react';
import QuickAccessCards from '@/components/guide/QuickAccessCards';
import GuideSectionBlock from '@/components/guide/GuideSectionBlock';

// ── Phrases d'accroche statiques (fallback si rien en BDD) ──
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

  // Tagline : priorité à la BDD, fallback sur les constantes statiques
  const dbTagline = isFr ? keyInfo?.hero_tagline_fr : keyInfo?.hero_tagline_en;
  const staticTagline = VILLA_TAGLINES[slug]?.[isFr ? 'fr' : 'en'] ?? null;
  const tagline = dbTagline || staticTagline;
  const taglineColor = keyInfo?.hero_tagline_color ?? '#6B7280';
  const taglineItalic = keyInfo?.hero_tagline_italic ?? false;
  const heroImageUrl = keyInfo?.hero_image_url ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div
        className="pt-20 border-b border-stone-100 relative overflow-hidden"
        style={{ backgroundColor: heroImageUrl ? undefined : '#FFFFFF' }}
      >
        {/* Photo de fond si définie */}
        {heroImageUrl && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImageUrl}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(13,27,42,0.55) 0%, rgba(13,27,42,0.35) 60%, rgba(250,250,248,1) 100%)',
              }}
            />
          </>
        )}

        <div
          className={`relative max-w-3xl mx-auto px-6 sm:px-10 pt-10 pb-12 ${
            heroImageUrl ? 'text-white' : ''
          }`}
        >
          {/* Breadcrumb */}
          <Link
            href={`/${locale}/apartments/${slug}`}
            className={`inline-flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase transition-colors mb-10 ${
              heroImageUrl
                ? 'text-white/70 hover:text-white'
                : 'text-stone-400 hover:text-[#B08B52]'
            }`}
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
            {isFr ? 'Retour à la villa' : 'Back to villa'}
          </Link>

          {/* Eyebrow */}
          <p className="text-[#B08B52] text-[10px] font-semibold tracking-[0.35em] uppercase mb-4">
            {isFr ? 'Guide de la villa' : 'Villa Guide'}
          </p>

          {/* Villa name */}
          <h1
            className={`font-serif text-4xl sm:text-5xl font-light leading-tight mb-5 ${
              heroImageUrl ? 'text-white' : 'text-[#0D1B2A]'
            }`}
          >
            {name}
          </h1>

          {/* Tagline */}
          {tagline && (
            <p
              style={{ color: taglineColor }}
              className={`text-base sm:text-lg font-light leading-relaxed max-w-xl ${
                taglineItalic ? 'italic font-serif' : ''
              }`}
            >
              {tagline}
            </p>
          )}

          {/* Separator */}
          <div className="mt-10 flex items-center gap-4">
            <div
              className={`h-px flex-1 ${
                heroImageUrl ? 'bg-white/20' : 'bg-stone-100'
              }`}
            />
            <div className="w-1.5 h-1.5 rounded-full bg-[#B08B52]/60" />
            <div
              className={`h-px w-12 ${
                heroImageUrl ? 'bg-white/20' : 'bg-stone-100'
              }`}
            />
          </div>
        </div>
      </div>

      {/* ── CONTENU ──────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-14 space-y-16">

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
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0D1B2A 0%, #1a2e42 100%)',
          }}
        >
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
