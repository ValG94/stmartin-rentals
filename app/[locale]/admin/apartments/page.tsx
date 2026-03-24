'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { MOCK_APARTMENTS as apartments } from '@/lib/mock-data';
import { Eye, Edit, Bed, Bath, Users, Star } from 'lucide-react';

export default function AdminApartmentsPage() {
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {locale === 'fr' ? 'Gestion des appartements' : 'Manage Apartments'}
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {apartments.map((apt) => {
          const name = locale === 'fr' ? apt.title_fr : apt.title_en;
          return (
            <div key={apt.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="relative h-48">
                <Image src={apt.images[0]?.url || "/images/villa-azur/piscine-terrasse.jpg"} alt={name} fill className="object-cover" />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold
                    ${apt.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {apt.is_active ? (locale === 'fr' ? 'Disponible' : 'Available') : (locale === 'fr' ? 'Indisponible' : 'Unavailable')}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{name}</h3>
                    <div className="flex items-center gap-1 text-yellow-500 text-sm mt-1">
                      <Star size={14} className="fill-yellow-400" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary-600 text-lg">{apt.price_per_night}€</div>
                    <div className="text-gray-400 text-xs">{locale === 'fr' ? '/nuit' : '/night'}</div>
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Bed size={14} /> {apt.bedrooms}</span>
                  <span className="flex items-center gap-1"><Bath size={14} /> {apt.bathrooms}</span>
                  <span className="flex items-center gap-1"><Users size={14} /> {apt.max_guests}</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/${locale}/apartments/${apt.slug}`} target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2 rounded-xl transition-colors">
                    <Eye size={15} />
                    {locale === 'fr' ? 'Voir' : 'View'}
                  </Link>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-primary-50 text-primary-700 hover:bg-primary-100 text-sm font-medium py-2 rounded-xl transition-colors">
                    <Edit size={15} />
                    {locale === 'fr' ? 'Modifier' : 'Edit'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
