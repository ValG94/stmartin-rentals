import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Bed, Bath, Users, MapPin, BookOpen } from 'lucide-react';
import { getApartmentBySlug, getApartments, getMinPrice } from '@/lib/api';
import { getUsdToEurRate } from '@/lib/currency';
import ImageGallery from '@/components/apartments/ImageGallery';
import BookingForm from '@/components/booking/BookingForm';
import { AMENITIES_MAP } from '@/components/apartments/AmenityIcon';

export async function generateStaticParams() {
  const res = await getApartments();
  const apartments = res.data ?? [];
  return apartments.flatMap((apt) => [
    { locale: 'fr', slug: apt.slug },
    { locale: 'en', slug: apt.slug },
  ]);
}

export default async function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('apartment_detail');
  const tApt = await getTranslations('apartments');

  const res = await getApartmentBySlug(slug);
  if (!res.data) notFound();
  const apartment = res.data;

  // Taux de change USD→EUR en temps réel (avec fallback 0.92)
  let eurRate = 0.92;
  try {
    eurRate = await getUsdToEurRate();
  } catch {
    // fallback silencieux
  }

  const isFr = locale === 'fr';

  // Prix actif et prix minimum
  const activePriceUsd = apartment.current_price ?? apartment.price_per_night;
  const minPriceUsd = getMinPrice(apartment.price_per_night, apartment.seasonal_prices ?? []);

  const name = locale === 'fr' ? apartment.title_fr : apartment.title_en;
  const description = locale === 'fr' ? apartment.description_fr : apartment.description_en;

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href={`/${locale}`} className="hover:text-primary-600">
            {locale === 'fr' ? 'Accueil' : 'Home'}
          </Link>
          <span className="mx-2">›</span>
          <Link href={`/${locale}/apartments`} className="hover:text-primary-600">
            {tApt('page_title')}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{name}</h1>
            <div className="flex items-center gap-1 text-gray-500">
              <MapPin size={16} />
              <span>{apartment.location}</span>
            </div>
          </div>
          <Link
            href={`/${locale}/apartments/${slug}/guide`}
            className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-100 transition-colors"
          >
            <BookOpen size={18} />
            {t('view_guide')}
          </Link>
        </div>

        {/* Gallery */}
        <div className="mb-10">
          <ImageGallery images={apartment.images.map(img => img.url)} alt={name} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Specs */}
            <div className="flex flex-wrap gap-6 p-6 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-2 text-gray-700">
                <Bed size={20} className="text-primary-600" />
                <span><strong>{apartment.bedrooms}</strong> {t('bedrooms')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Bath size={20} className="text-primary-600" />
                <span><strong>{apartment.bathrooms}</strong> {t('bathrooms')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Users size={20} className="text-primary-600" />
                <span><strong>{apartment.max_guests}</strong> {t('guests')}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('description')}</h2>
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('amenities')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {apartment.amenities.map((amenityKey, i) => {
                  const def = AMENITIES_MAP[amenityKey];
                  const label = def
                    ? (isFr ? def.label_fr : def.label_en)
                    : amenityKey;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                      <span className="text-primary-600 flex-shrink-0">{def?.icon ?? '✓'}</span>
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Booking sidebar */}
          <div className="lg:col-span-1">
            <BookingForm
              apartmentName={name}
              pricePerNight={activePriceUsd}
              basePrice={apartment.price_per_night}
              minPrice={minPriceUsd}
              slug={slug}
              locale={locale}
              eurRate={eurRate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
