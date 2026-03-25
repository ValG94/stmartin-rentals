'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { MapPin, ArrowRight } from 'lucide-react';
import { useCurrencyRate, formatPriceWithRate } from '@/hooks/useCurrencyRate';

interface VillaFallback {
  slug: string;
  title: string;
  desc: string;
  img: string;
  price: number; // en USD
  bedrooms: number;
  bathrooms: number;
  guests: number;
  location: string;
}

interface VillaCardFallbackProps {
  villa: VillaFallback;
  index: number;
}

export default function VillaCardFallback({ villa, index }: VillaCardFallbackProps) {
  const locale = useLocale();
  const { rate } = useCurrencyRate();
  const isFr = locale === 'fr';

  const displayPrice = formatPriceWithRate(villa.price, locale, rate);

  return (
    <Link
      href={`/${locale}/apartments/${villa.slug}`}
      className="group relative overflow-hidden block"
      style={{ height: '600px' }}
    >
      <Image
        src={villa.img}
        alt={villa.title}
        fill
        className="object-cover transition-transform duration-1000 group-hover:scale-105"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-night-600/90 via-night-600/20 to-transparent transition-all duration-700 group-hover:from-night-600/95 group-hover:via-night-600/30" />
      <div className="absolute top-8 right-8 font-serif text-6xl font-light text-white/10" style={{ letterSpacing: '-0.02em' }}>
        0{index + 1}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-10">
        <div className="flex items-center gap-4 mb-3">
          <span className="font-sans text-xs text-bronze-300 uppercase" style={{ letterSpacing: '0.2em' }}>
            <MapPin size={10} className="inline mr-1" />{villa.location}
          </span>
        </div>
        <h3 className="font-serif font-light text-cream-100 mb-3 leading-tight" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', letterSpacing: '-0.01em' }}>
          {villa.title}
        </h3>
        <p className="font-sans text-sm text-white/60 mb-5 line-clamp-2 max-w-sm">{villa.desc}</p>

        {/* Specs surligné */}
        <div className="inline-flex items-center gap-1 mb-6">
          <span className="bg-bronze-500 text-white font-sans font-bold text-sm px-3 py-1.5 rounded-sm">
            {villa.guests} {isFr ? 'pers' : 'guests'}
          </span>
          <span className="text-white/30 mx-1">/</span>
          <span className="bg-bronze-500 text-white font-sans font-bold text-sm px-3 py-1.5 rounded-sm">
            {villa.bedrooms} {isFr ? 'ch' : 'bd'}
          </span>
          <span className="text-white/30 mx-1">/</span>
          <span className="bg-bronze-500 text-white font-sans font-bold text-sm px-3 py-1.5 rounded-sm">
            {villa.bathrooms} {isFr ? 'sdb' : 'bath'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-sans text-xs text-white/50 uppercase" style={{ letterSpacing: '0.1em' }}>
              {isFr ? 'à partir de' : 'from'}
            </span>
            <span className="font-serif text-2xl text-cream-100 font-light">{displayPrice}</span>
            <span className="font-sans text-xs text-white/50">/ {isFr ? 'nuit' : 'night'}</span>
          </div>
          <div className="flex items-center gap-2 font-sans text-xs text-bronze-300 uppercase group-hover:gap-4 transition-all duration-500" style={{ letterSpacing: '0.15em' }}>
            {isFr ? 'Découvrir' : 'Discover'}<ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
