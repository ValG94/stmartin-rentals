'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';

export default function NewApartmentPage() {
  const { isAuthenticated, isLoading, authHeaders } = useAdminAuth();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title_fr: '',
    title_en: '',
    slug: '',
    location: '',
    price_per_night: 200,
    bedrooms: 2,
    bathrooms: 2,
    max_guests: 4,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/fr/admin-login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Auto-générer le slug depuis le titre FR
  useEffect(() => {
    const slug = form.title_fr
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setForm((f) => ({ ...f, slug }));
  }, [form.title_fr]);

  async function handleCreate() {
    if (!form.title_fr || !form.slug) {
      setError('Le titre est obligatoire');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/apartments', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          title_en: form.title_en || form.title_fr,
          short_description_fr: '',
          short_description_en: '',
          description_fr: '',
          description_en: '',
          amenities: [],
          is_active: false,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur de création');
      }
      const apt = await res.json();
      router.push(`/fr/admin/apartments/${apt.id}/edit`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/fr/admin/apartments')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle villa</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la villa (FR) *
            </label>
            <input
              type="text"
              value={form.title_fr}
              onChange={(e) => setForm((f) => ({ ...f, title_fr: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: Villa Azur"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Villa name (EN)
            </label>
            <input
              type="text"
              value={form.title_en}
              onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: Villa Azur"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug URL (auto-généré)
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="villa-azur"
          />
          <p className="text-xs text-gray-500 mt-1">
            URL : /fr/apartments/{form.slug || 'villa-azur'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ex: Terres Basses, Saint-Martin"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix / nuit (€)
            </label>
            <input
              type="number"
              value={form.price_per_night}
              onChange={(e) =>
                setForm((f) => ({ ...f, price_per_night: Number(e.target.value) }))
              }
              min={0}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voyageurs max
            </label>
            <input
              type="number"
              value={form.max_guests}
              onChange={(e) => setForm((f) => ({ ...f, max_guests: Number(e.target.value) }))}
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chambres</label>
            <input
              type="number"
              value={form.bedrooms}
              onChange={(e) => setForm((f) => ({ ...f, bedrooms: Number(e.target.value) }))}
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salles de bain
            </label>
            <input
              type="number"
              value={form.bathrooms}
              onChange={(e) => setForm((f) => ({ ...f, bathrooms: Number(e.target.value) }))}
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          La villa sera créée en mode <strong>inactif</strong>. Vous pourrez ajouter les photos,
          la description et le guide digital avant de la publier.
        </p>

        <button
          onClick={handleCreate}
          disabled={creating || !form.title_fr}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          {creating ? 'Création...' : 'Créer la villa'}
        </button>
      </div>
    </div>
  );
}
