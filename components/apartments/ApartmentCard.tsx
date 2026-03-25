'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Bed, Bath, Users, MapPin } from 'lucide-react';
import type { Apartment } from '@/types';
import { useCurrencyRate, formatPriceWithRate } from '@/hooks/useCurrencyRate';

interface ApartmentCardProps {
  apartment: Apartment;
}

export default function ApartmentCard({ apartment }: ApartmentCardProps) {
  const locale = useLocale();
  const t = useTranslations('apartments');
  const { rate } = useCurrencyRate();

  const name = locale === 'fr' ? apartment.title_fr : apartment.title_en;
  const description = locale === 'fr' ? apartment.short_description_fr : apartment.short_description_en;
  const coverImage = apartment.images.find((img) => img.is_cover) || apartment.images[0];

  // Prix minimum (à partir de) en USD, converti si FR
  const minPriceUsd = apartment.min_price ?? apartment.price_per_night;
  const displayMinPrice = formatPriceWithRate(minPriceUsd, locale, rate);

  return (
    <Link href={`/${locale}/apartments/${apartment.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-64 overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage.url}
              alt={locale === 'fr' ? coverImage.alt_fr : coverImage.alt_en}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-sand-200 flex items-center justify-center">
              <span className="text-gray-400">Photo à venir</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {/* Badge prix */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-primary-700">
            {locale === 'fr' ? 'à partir de' : 'from'} {displayMinPrice} / {t('night')}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{name}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
            <MapPin size={13} />
            <span>{apartment.location}</span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">{description}</p>

          {/* Specs surligné — style Antilles Exception */}
          <div className="inline-flex items-center gap-1 mb-4">
            <span className="bg-bronze-500 text-white font-sans font-bold text-xs px-2.5 py-1 rounded-sm">
              {apartment.max_guests} {locale === 'fr' ? 'pers' : 'guests'}
            </span>
            <span className="text-gray-300 mx-0.5">/</span>
            <span className="bg-bronze-500 text-white font-sans font-bold text-xs px-2.5 py-1 rounded-sm">
              {apartment.bedrooms} {locale === 'fr' ? 'ch' : 'bd'}
            </span>
            <span className="text-gray-300 mx-0.5">/</span>
            <span className="bg-bronze-500 text-white font-sans font-bold text-xs px-2.5 py-1 rounded-sm">
              {apartment.bathrooms} {locale === 'fr' ? 'sdb' : 'bath'}
            </span>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs text-gray-400">{locale === 'fr' ? 'à partir de' : 'from'}</span>
              <span className="text-xl font-bold text-primary-600">{displayMinPrice}</span>
              <span className="text-gray-400 text-sm">/ {t('night')}</span>
            </div>
            <span className="text-sm font-medium text-primary-600 group-hover:underline">
              {t('view_details')} →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
