import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getApartmentBySlug } from '@/lib/api';
import { BookOpen, Phone, AlertCircle, ChevronLeft } from 'lucide-react';
import type { GuideSection } from '@/types';

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
    <div className="bg-gray-50 min-h-screen pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          href={`/${locale}/apartments/${slug}`}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-6"
        >
          <ChevronLeft size={18} />
          {t('back')}
        </Link>

        {/* Header */}
        <div className="bg-primary-700 text-white rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen size={28} />
            <h1 className="text-3xl font-bold">{t('title')}</h1>
          </div>
          <p className="text-primary-100 text-lg">{name}</p>
        </div>

        {/* Sections du guide */}
        {sections.length > 0 ? (
          <div className="space-y-6">
            {sections
              .sort((a, b) => a.position - b.position)
              .map((section) => (
                <div key={section.id} className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">{section.icon}</span>
                    {locale === 'fr' ? section.title_fr : section.title_en}
                  </h2>
                  <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {locale === 'fr' ? section.content_fr : section.content_en}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
            {locale === 'fr' ? 'Guide en cours de préparation.' : 'Guide coming soon.'}
          </div>
        )}

        {/* Contact urgence */}
        <div className="mt-8 bg-accent-50 border border-accent-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={20} className="text-accent-600" />
            <h3 className="font-bold text-accent-800 text-lg">
              {locale === 'fr' ? "Contact d'urgence" : 'Emergency contact'}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-accent-700">
            <Phone size={16} />
            <span className="font-semibold">+590 690 XX XX XX</span>
          </div>
        </div>
      </div>
    </div>
  );
}
