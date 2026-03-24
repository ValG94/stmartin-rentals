import { getTranslations, getLocale } from 'next-intl/server';
import { getApartments } from '@/lib/api';
import ApartmentCard from '@/components/apartments/ApartmentCard';
import Image from 'next/image';

export default async function ApartmentsPage() {
  const locale = await getLocale();
  const t = await getTranslations('apartments');
  const res = await getApartments();
  const apartments = res.data ?? [];

  return (
    <div>
      {/* Hero */}
      <section className="relative h-64 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/villa-azur/piscine-terrasse.jpg"
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
