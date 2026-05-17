import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getApartmentBySlug } from '@/lib/api';
import { BookOpen, Phone, AlertCircle, ChevronLeft } from 'lucide-react';
import type { GuideSection } from '@/types';
import ExploreSection from '@/components/guide/ExploreSection';

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('guide');
  const res = await getApartmentBySlug(slug);
  if (!res.data) notFound();
  const apartment = res.data;

  const name = locale === 'fr' ? apartment.title_fr : apartment.title_en;
  const sections: GuideSection[] = apartment.sections ?? [];

  return (
    <div className="bg-night-600 min-h-screen pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back */}
        <Link
          href={`/${locale}/apartments/${slug}`}
          className="inline-flex items-center gap-2 text-bronze-400 hover:text-bronze-300 font-medium mb-8 transition-colors duration-200"
        >
          <ChevronLeft size={18} />
          {t('back')}
        </Link>

        {/* Header */}
        <div className="relative rounded-3xl overflow-hidden mb-10">
          <div className="absolute inset-0 bg-gradient-to-br from-night-700 to-night-800" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(176,139,82,0.12),_transparent_60%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bronze-400/50 to-transparent" />
          <div className="relative px-8 py-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-bronze-400/15 border border-bronze-400/25 flex items-center justify-center flex-shrink-0">
              <BookOpen size={22} className="text-bronze-400" />
            </div>
            <div>
              <p className="text-bronze-400 text-xs font-medium tracking-[0.25em] uppercase mb-1">
                {locale === 'fr' ? 'Guide de la villa' : 'Villa Guide'}
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">{name}</h1>
            </div>
          </div>
        </div>

        {/* Villa guide sections */}
        {sections.length > 0 && (
          <div className="space-y-4 mb-10">
            {sections
              .sort((a, b) => a.position - b.position)
              .map((section) => (
                <div
                  key={section.id}
                  className="bg-night-700/60 border border-white/8 rounded-2xl p-6
                             hover:border-white/15 transition-colors duration-300"
                >
                  <h2 className="font-serif text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-xl">{section.icon}</span>
                    {locale === 'fr' ? section.title_fr : section.title_en}
                  </h2>
                  <div className="text-white/55 leading-relaxed whitespace-pre-line text-sm">
                    {locale === 'fr' ? section.content_fr : section.content_en}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ─── EXPLORE SAINT MARTIN ─── */}
        <ExploreSection locale={locale} />

        {/* Emergency contact */}
        <div className="mt-12 bg-night-700/60 border border-bronze-400/20 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-bronze-400" />
            <h3 className="font-semibold text-white text-base">
              {locale === 'fr' ? "Contact d'urgence" : 'Emergency contact'}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <Phone size={15} className="text-bronze-400/70" />
            <span className="font-medium text-white/80">+1 (514) 947-6100</span>
          </div>
        </div>

      </div>
    </div>
  );
}
