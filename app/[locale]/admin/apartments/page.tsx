'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Apartment } from '@/types';
import { Plus, Edit, Eye, EyeOff, Home } from 'lucide-react';

export default function AdminApartmentsPage() {
  const { isAuthenticated, isLoading, authHeaders } = useAdminAuth();
  const router = useRouter();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/fr/admin-login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function fetchApartments() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/apartments', {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setApartments(data);
    } catch {
      setError('Impossible de charger les villas');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(apt: Apartment) {
    try {
      const res = await fetch(`/api/admin/apartments/${apt.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !apt.is_active }),
      });
      if (!res.ok) throw new Error();
      setApartments((prev) =>
        prev.map((a) => (a.id === apt.id ? { ...a, is_active: !a.is_active } : a))
      );
    } catch {
      alert('Erreur lors de la mise à jour');
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des villas</h1>
          <p className="text-gray-500 mt-1">
            {apartments.length} villa{apartments.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <Link
          href="/fr/admin/apartments/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nouvelle villa
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Liste des villas */}
      <div className="grid gap-4">
        {apartments.map((apt) => {
          const coverImage =
            apt.images?.find((img) => img.is_cover)?.url || apt.images?.[0]?.url;
          return (
            <div
              key={apt.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image de couverture */}
              <div className="w-24 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImage}
                    alt={apt.title_fr}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home size={24} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {apt.title_fr}
                  </h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      apt.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {apt.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{apt.location}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">
                    {apt.price_per_night}€/nuit
                  </span>
                  <span>{apt.bedrooms} ch.</span>
                  <span>{apt.bathrooms} sdb.</span>
                  <span>max {apt.max_guests} pers.</span>
                  <span>
                    {apt.images?.length || 0} photo
                    {(apt.images?.length || 0) > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(apt)}
                  title={apt.is_active ? 'Désactiver' : 'Activer'}
                  className={`p-2 rounded-lg transition-colors ${
                    apt.is_active
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {apt.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <Link
                  href={`/fr/admin/apartments/${apt.id}/edit`}
                  className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Edit size={16} />
                  Modifier
                </Link>
              </div>
            </div>
          );
        })}

        {apartments.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <Home size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Aucune villa pour le moment</p>
            <Link
              href="/fr/admin/apartments/new"
              className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline"
            >
              <Plus size={16} />
              Créer la première villa
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
