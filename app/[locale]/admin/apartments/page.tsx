'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, Edit, Eye, EyeOff, Home, Image as ImageIcon,
  BedDouble, Bath, Users, MapPin, Euro
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ApartmentRow {
  id: string;
  title_fr: string;
  title_en: string;
  location: string;
  price_per_night: number;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  is_active: boolean;
  slug: string;
  apartment_images: { url: string; is_cover: boolean; position: number }[];
}

export default function AdminApartmentsPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();
  const locale = useLocale();
  const [apartments, setApartments] = useState<ApartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/admin-login`);
    }
  }, [isLoading, isAuthenticated, router, locale]);

  useEffect(() => {
    if (isAuthenticated) fetchApartments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function fetchApartments() {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('apartments')
        .select(`
          id, title_fr, title_en, location, price_per_night,
          bedrooms, bathrooms, max_guests, is_active, slug,
          apartment_images (url, is_cover, position)
        `)
        .order('created_at', { ascending: true });

      if (err) throw err;
      setApartments(data || []);
    } catch (e) {
      console.error(e);
      setError('Impossible de charger les villas. Vérifiez les variables d\'environnement Supabase.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(apt: ApartmentRow) {
    setTogglingId(apt.id);
    try {
      const { error: err } = await supabase
        .from('apartments')
        .update({ is_active: !apt.is_active })
        .eq('id', apt.id);
      if (err) throw err;
      setApartments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, is_active: !a.is_active } : a))
      );
    } catch {
      alert('Erreur lors de la mise à jour');
    } finally {
      setTogglingId(null);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#B08B52] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des villas</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {apartments.length} villa{apartments.length !== 1 ? 's' : ''} enregistrée{apartments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/apartments/new`}
          className="flex items-center gap-2 bg-[#0D1B2A] text-white px-4 py-2.5 rounded-lg hover:bg-[#1a2f45] transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Nouvelle villa
        </Link>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Liste */}
      <div className="space-y-4">
        {apartments.map((apt) => {
          const coverImage =
            apt.apartment_images?.find((img) => img.is_cover)?.url ||
            apt.apartment_images?.sort((a, b) => a.position - b.position)[0]?.url;

          return (
            <div
              key={apt.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-stretch">
                {/* Image */}
                <div className="w-44 flex-shrink-0 bg-gray-100 relative" style={{ minHeight: '140px' }}>
                  {coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImage}
                      alt={apt.title_fr}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center absolute inset-0">
                      <Home size={32} className="text-gray-300" />
                    </div>
                  )}
                  {/* Badge nb photos */}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                    <ImageIcon size={10} />
                    {apt.apartment_images?.length || 0}
                  </div>
                </div>

                {/* Infos */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-gray-900">{apt.title_fr}</h2>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          apt.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {apt.is_active ? 'Publié' : 'Masqué'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                      <MapPin size={13} />
                      <span>{apt.location}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1 font-semibold text-[#B08B52]">
                        <Euro size={14} />
                        {apt.price_per_night}/nuit
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble size={14} />
                        {apt.bedrooms} ch.
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath size={14} />
                        {apt.bathrooms} sdb.
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {apt.max_guests} pers. max
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <Link
                      href={`/${locale}/admin/apartments/${apt.id}/edit`}
                      className="flex items-center gap-2 bg-[#0D1B2A] text-white px-4 py-2 rounded-lg hover:bg-[#1a2f45] transition-colors text-sm font-medium"
                    >
                      <Edit size={15} />
                      Modifier la villa
                    </Link>
                    <button
                      onClick={() => toggleActive(apt)}
                      disabled={togglingId === apt.id}
                      title={apt.is_active ? 'Masquer du site' : 'Publier sur le site'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border ${
                        apt.is_active
                          ? 'border-green-200 text-green-700 hover:bg-green-50'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {togglingId === apt.id ? (
                        <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : apt.is_active ? (
                        <Eye size={15} />
                      ) : (
                        <EyeOff size={15} />
                      )}
                      {apt.is_active ? 'Publié' : 'Masqué'}
                    </button>
                    <Link
                      href={`/${locale}/apartments/${apt.slug}`}
                      target="_blank"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Eye size={15} />
                      Voir la page
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {apartments.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-200">
            <Home size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">Aucune villa enregistrée</p>
            <p className="text-sm mb-6">Commencez par créer votre première villa</p>
            <Link
              href={`/${locale}/admin/apartments/new`}
              className="inline-flex items-center gap-2 bg-[#0D1B2A] text-white px-5 py-2.5 rounded-lg hover:bg-[#1a2f45] transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Créer une villa
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
