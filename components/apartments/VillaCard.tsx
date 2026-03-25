'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { MapPin, ArrowRight } from 'lucide-react';
import { useCurrencyRate, formatPriceWithRate } from '@/hooks/useCurrencyRate';
import type { Apartment } from '@/types';

interface VillaCardProps {
  apartment: Apartment;
  index: number;
}

export default function VillaCard({ apartment, index }: VillaCardProps) {
  const locale = useLocale();
  const { rate } = useCurrencyRate();
  const isFr = locale === 'fr';

  const coverImage =
    apartment.images?.find((img) => img.is_cover)?.url ||
    apartment.images?.[0]?.url ||
    (apartment.slug === 'villa-vanille'
      ? '/images/villa-vanille/piscine-terrasse.jpg'
      : '/images/villa-blanche/piscine.jpg');

  const title = isFr ? apartment.title_fr : apartment.title_en;
  const shortDesc = isFr ? apartment.short_description_fr : apartment.short_description_en;

  // Prix minimum (à partir de) — toujours en USD, converti si FR
  const minPriceUsd = apartment.min_price ?? apartment.price_per_night;
  const displayMinPrice = formatPriceWithRate(minPriceUsd, locale, rate);

  return (
    <Link
      href={`/${locale}/apartments/${apartment.slug}`}
      className="group relative overflow-hidden block"
      style={{ height: '600px' }}
    >
      <Image
        src={coverImage}
        alt={title}
        fill
        className="object-cover transition-transform duration-1000 group-hover:scale-105"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-night-600/90 via-night-600/20 to-transparent transition-all duration-700 group-hover:from-night-600/95 group-hover:via-night-600/30" />

      {/* Numéro décoratif */}
      <div
        className="absolute top-8 right-8 font-serif text-6xl font-light text-white/10"
        style={{ letterSpacing: '-0.02em' }}
      >
        0{index + 1}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-10">
        {/* Localisation */}
        <div className="flex items-center gap-4 mb-3">
          <span
            className="font-sans text-xs text-bronze-300 uppercase"
            style={{ letterSpacing: '0.2em' }}
          >
            <MapPin size={10} className="inline mr-1" />
            {apartment.location}
          </span>
        </div>

        {/* Titre */}
        <h3
          className="font-serif font-light text-cream-100 mb-3 leading-tight"
          style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', letterSpacing: '-0.01em' }}
        >
          {title}
        </h3>

        {/* Description courte */}
        <p className="font-sans text-sm text-white/60 mb-5 line-clamp-2 max-w-sm">
          {shortDesc}
        </p>

        {/* Specs surligné — style Antilles Exception */}
        <div className="inline-flex items-center gap-1 mb-6">
          <span className="bg-bronze-500 text-white font-sans font-bold text-sm px-3 py-1.5 rounded-sm" style={{ letterSpacing: '0.03em' }}>
            {apartment.max_guests} {isFr ? 'pers' : 'guests'}
          </span>
          <span className="text-white/30 mx-1">/</span>
          <span className="bg-bronze-500 text-white font-sans font-bold text-sm px-3 py-1.5 rounded-sm" style={{ letterSpacing: '0.03em' }}>
            {apartment.bedrooms} {isFr ? 'ch' : 'bd'}
          </span>
          <span className="text-white/30 mx-1">/</span>
          <span className="bg-bronze-500 text-white font-sans font-bold text-sm px-3 py-1.5 rounded-sm" style={{ letterSpacing: '0.03em' }}>
            {apartment.bathrooms} {isFr ? 'sdb' : 'bath'}
          </span>
        </div>

        {/* Prix et CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-xs text-white/50 uppercase" style={{ letterSpacing: '0.1em' }}>
              {isFr ? 'à partir de' : 'from'}
            </span>
            <span className="font-serif text-2xl text-cream-100 font-light">
              {displayMinPrice}
            </span>
            <span className="font-sans text-xs text-white/50">
              / {isFr ? 'nuit' : 'night'}
            </span>
          </div>
          <div
            className="flex items-center gap-2 font-sans text-xs text-bronze-300 uppercase group-hover:gap-4 transition-all duration-500"
            style={{ letterSpacing: '0.15em' }}
          >
            {isFr ? 'Découvrir' : 'Discover'}
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
