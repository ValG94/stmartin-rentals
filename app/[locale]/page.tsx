import { getTranslations } from 'next-intl/server';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { getApartments } from '@/lib/api';
import ApartmentCard from '@/components/apartments/ApartmentCard';
import { MapPin, Star, Shield, Phone } from 'lucide-react';

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations('home');
  const res = await getApartments();
  const apartments = res.data ?? [];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/villa-azur/piscine-terrasse.jpg"
            alt="Villa Saint-Martin"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        </div>

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium mb-6">
            <MapPin size={14} />
            <span>Saint-Martin, Antilles françaises</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {t('hero_title')}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/apartments`}
              className="bg-white text-primary-700 font-bold px-8 py-4 rounded-full hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              {t('cta_discover')}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all text-lg"
            >
              {t('cta_contact')}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/20">
          <div className="max-w-4xl mx-auto px-4 py-5 grid grid-cols-3 gap-4 text-white text-center">
            <div>
              <div className="text-2xl font-bold">2</div>
              <div className="text-sm text-white/80">{t('stat_villas')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">4.9★</div>
              <div className="text-sm text-white/80">{t('stat_rating')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-white/80">{t('stat_satisfaction')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Nos villas */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('apartments_title')}</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">{t('apartments_subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {apartments.map((apt) => (
              <ApartmentCard key={apt.id} apartment={apt} />
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi nous choisir */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('why_title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-primary-50">
              <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">{t('why_1_title')}</h3>
              <p className="text-gray-600">{t('why_1_desc')}</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-accent-50">
              <div className="w-14 h-14 bg-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">{t('why_2_title')}</h3>
              <p className="text-gray-600">{t('why_2_desc')}</p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-primary-50">
              <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">{t('why_3_title')}</h3>
              <p className="text-gray-600">{t('why_3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-4 bg-primary-700 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">{t('cta_title')}</h2>
          <p className="text-primary-100 text-lg mb-8">{t('cta_subtitle')}</p>
          <Link
            href={`/${locale}/apartments`}
            className="bg-white text-primary-700 font-bold px-10 py-4 rounded-full hover:bg-primary-50 transition-all shadow-lg text-lg inline-block"
          >
            {t('cta_book')}
          </Link>
        </div>
      </section>
    </div>
  );
}
