'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Bed, Bath, Users, MapPin } from 'lucide-react';
import type { Apartment } from '@/types';

interface ApartmentCardProps {
  apartment: Apartment;
}

export default function ApartmentCard({ apartment }: ApartmentCardProps) {
  const locale = useLocale();
  const t = useTranslations('apartments');
  const name = locale === 'fr' ? apartment.title_fr : apartment.title_en;
  const description = locale === 'fr' ? apartment.short_description_fr : apartment.short_description_en;
  const coverImage = apartment.images.find((img) => img.is_cover) || apartment.images[0];

  // Utiliser le prix saisonnier actif s'il est disponible, sinon le prix de base
  const displayPrice = apartment.current_price ?? apartment.price_per_night;
  const isSeasonalPrice = apartment.current_price !== undefined && apartment.current_price !== apartment.price_per_night;

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
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold text-primary-700">
            {displayPrice}€ / {t('night')}
          </div>
          {isSeasonalPrice && (
            <div className="absolute top-3 right-3 bg-amber-600/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-semibold text-white">
              {locale === 'fr' ? 'Prix saison' : 'Season price'}
            </div>
          )}
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

          {/* Specs */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Bed size={15} />
              <span>{apartment.bedrooms} {t('bedrooms')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath size={15} />
              <span>{apartment.bathrooms} {t('bathrooms')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={15} />
              <span>{apartment.max_guests} {t('guests')}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary-600">{displayPrice}€</span>
              <span className="text-gray-400 text-sm">/ {t('night')}</span>
              {isSeasonalPrice && (
                <span className="text-xs text-gray-400 line-through">{apartment.price_per_night}€</span>
              )}
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
