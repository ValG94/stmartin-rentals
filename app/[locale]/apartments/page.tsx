import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { getApartments } from '@/lib/api';
import ApartmentCard from '@/components/apartments/ApartmentCard';
import Image from 'next/image';

// Revalide la liste des villas toutes les 60 s côté CDN.
export const revalidate = 60;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://islandlivingsxm.com').replace(/\/+$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isFr = locale === 'fr';
  const title = isFr ? 'Nos villas de luxe à Saint-Martin' : 'Our luxury villas in Sint Maarten';
  const description = isFr
    ? 'Découvrez nos villas exceptionnelles à Saint-Martin — piscine privée, vue mer, expérience caribéenne premium.'
    : 'Discover our exceptional luxury villas in Sint Maarten — private pool, sea view, premium Caribbean experience.';
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/apartments`,
      languages: {
        en: `${SITE_URL}/en/apartments`,
        fr: `${SITE_URL}/fr/apartments`,
      },
    },
    openGraph: {
      title, description, type: 'website',
      url: `${SITE_URL}/${locale}/apartments`,
      locale: isFr ? 'fr_FR' : 'en_US',
      alternateLocale: isFr ? 'en_US' : 'fr_FR',
      siteName: 'Island Living SXM',
    },
  };
}

export default async function ApartmentsPage() {
  const locale = await getLocale();
  const t = await getTranslations('apartments');
  const res = await getApartments();
  const apartments = res.data ?? [];

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative h-64 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/nosVillas hero.jpeg"
            alt="Nos villas"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">{t('page_title')}</h1>
          <p className="text-white/80 text-lg">{t('page_subtitle')}</p>
        </div>
      </section>

      {/* Liste */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {apartments.map((apt) => (
              <ApartmentCard key={apt.id} apartment={apt} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
