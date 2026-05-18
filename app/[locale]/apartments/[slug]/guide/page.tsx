import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getApartmentBySlug } from '@/lib/api';
import { getFullGuide, getApartmentKeyInfo } from '@/lib/api-guide';
import { ChevronLeft, BookOpen } from 'lucide-react';
import QuickAccessCards from '@/components/guide/QuickAccessCards';
import GuideSectionBlock from '@/components/guide/GuideSectionBlock';

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

  // Charger les données depuis les nouvelles tables
  const [sections, keyInfo] = await Promise.all([
    getFullGuide(apartment.id),
    getApartmentKeyInfo(apartment.id),
  ]);

  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Bandeau guide sous le header blanc ──────────────────── */}
      <div className="pt-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          <Link
            href={`/${locale}/apartments/${slug}`}
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-[#B08B52] font-medium mb-4 transition-colors text-sm"
          >
            <ChevronLeft size={15} />
            {isFr ? 'Retour à la villa' : 'Back to villa'}
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#B08B52]/10 border border-[#B08B52]/20 flex items-center justify-center flex-shrink-0">
              <BookOpen size={20} className="text-[#B08B52]" />
            </div>
            <div>
              <p className="text-[#B08B52] text-[10px] font-semibold tracking-[0.3em] uppercase mb-0.5">
                {isFr ? 'Guide de la villa' : 'Villa Guide'}
              </p>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#0D1B2A]">{name}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenu principal ────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Quick access cards (infos clés) */}
        {keyInfo && (
          <QuickAccessCards keyInfo={keyInfo} locale={locale} />
        )}

        {/* Sections dynamiques depuis BDD */}
        {sections.length > 0 ? (
          sections.map(section => (
            <GuideSectionBlock
              key={section.id}
              section={section}
              locale={locale}
            />
          ))
        ) : (
          /* Fallback si aucune section en BDD */
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {isFr
                ? 'Le guide de cette villa est en cours de préparation.'
                : 'The guide for this villa is being prepared.'}
            </p>
          </div>
        )}

        {/* Footer contact */}
        <div className="mt-6 bg-[#0D1B2A] rounded-2xl p-6 text-center">
          <p className="text-[#B08B52] text-[10px] font-semibold tracking-[0.25em] uppercase mb-2">
            {isFr ? 'Une question ?' : 'Need help?'}
          </p>
          <p className="text-white/60 text-sm mb-4">
            {isFr
              ? 'Nous sommes disponibles pour vous aider à tout moment.'
              : 'We are available to help you at any time.'}
          </p>
          {keyInfo?.whatsapp ? (
            <a
              href={`https://wa.me/${keyInfo.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B08B52] text-white rounded-xl text-sm font-medium hover:bg-[#8C6A38] transition-colors"
            >
              {isFr ? 'Nous contacter' : 'Contact us'}
            </a>
          ) : keyInfo?.host_phone ? (
            <a
              href={`tel:${keyInfo.host_phone}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B08B52] text-white rounded-xl text-sm font-medium hover:bg-[#8C6A38] transition-colors"
            >
              {keyInfo.host_phone}
            </a>
          ) : (
            <p className="text-white/40 text-sm">+1 (514) 947-6100</p>
          )}
        </div>

      </div>
    </div>
  );
}
