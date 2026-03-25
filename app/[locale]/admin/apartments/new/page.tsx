'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ArrowLeft, Loader2, Plus, Check } from 'lucide-react';

const AMENITIES_CATALOG = [
  { key: 'pool',            label: 'Piscine' },
  { key: 'jacuzzi',         label: 'Jacuzzi' },
  { key: 'wifi',            label: 'Wi-Fi' },
  { key: 'tv',              label: 'Télévision' },
  { key: 'ac',              label: 'Climatisation' },
  { key: 'kitchen',         label: 'Cuisine équipée' },
  { key: 'bbq',             label: 'Barbecue' },
  { key: 'terrace',         label: 'Terrasse' },
  { key: 'sea_view',        label: 'Vue mer' },
  { key: 'lagoon_view',     label: 'Vue lagon' },
  { key: 'parking',         label: 'Parking' },
  { key: 'washing_machine', label: 'Lave-linge' },
  { key: 'hair_dryer',      label: 'Sèche-cheveux' },
  { key: 'bed_linen',       label: 'Linge de maison' },
  { key: 'beach_towels',    label: 'Serviettes de plage' },
  { key: 'massage_room',    label: 'Salle de massage' },
];

export default function NewApartmentPage() {
  const { isAuthenticated, isLoading, authHeaders } = useAdminAuth();
  const router = useRouter();
  const locale = useLocale();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title_fr: '',
    title_en: '',
    slug: '',
    location: '',
    price_per_night: 500,
    bedrooms: 2,
    bathrooms: 2,
    max_guests: 4,
    amenities: [] as string[],
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/${locale}/admin-login`);
    }
  }, [isLoading, isAuthenticated, router, locale]);

  // Auto-générer le slug depuis le titre FR
  useEffect(() => {
    const slug = form.title_fr
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setForm((f) => ({ ...f, slug }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title_fr]);

  const toggleAmenity = (key: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter((a) => a !== key)
        : [...f.amenities, key],
    }));
  };

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
          currency: 'USD',
          is_active: false,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur de création');
      }
      const apt = await res.json();
      router.push(`/${locale}/admin/apartments/${apt.id}/edit`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#B08B52] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push(`/${locale}/admin/apartments`)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle villa</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Titres */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Titres</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Nom de la villa (FR) *
              </label>
              <input
                type="text"
                value={form.title_fr}
                onChange={(e) => setForm((f) => ({ ...f, title_fr: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
                placeholder="ex: Villa Azur"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Villa name (EN)
              </label>
              <input
                type="text"
                value={form.title_en}
                onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
                placeholder="ex: Villa Azur"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Slug URL (auto-généré)
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52] font-mono"
              placeholder="villa-azur"
            />
            <p className="text-xs text-gray-400 mt-1">
              URL : /{locale}/apartments/{form.slug || 'villa-azur'}
            </p>
          </div>
        </div>

        {/* Localisation & Capacité */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Localisation & Capacité</h3>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Localisation
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
              placeholder="ex: Terres Basses, Saint-Martin"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { field: 'bedrooms' as const, label: 'Chambres', min: 1 },
              { field: 'bathrooms' as const, label: 'Salles de bain', min: 1 },
              { field: 'max_guests' as const, label: 'Capacité max', min: 1 },
              { field: 'price_per_night' as const, label: 'Prix de base / nuit ($)', min: 0 },
            ].map(({ field, label, min }) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {label}
                </label>
                <input
                  type="number"
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: Number(e.target.value) }))}
                  min={min}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Commodités */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Commodités & Équipements</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {form.amenities.length} sélectionné{form.amenities.length > 1 ? 'es' : 'e'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AMENITIES_CATALOG.map(({ key, label }) => {
              const checked = form.amenities.includes(key);
              return (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    checked
                      ? 'border-[#B08B52] bg-[#B08B52]/5 text-[#0D1B2A]'
                      : 'border-gray-100 hover:border-gray-200 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    checked ? 'bg-[#B08B52] border-[#B08B52]' : 'border-gray-300'
                  }`}>
                    {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleAmenity(key)}
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-xl p-4">
          La villa sera créée en mode <strong>inactif</strong>. Vous pourrez ajouter les photos,
          la description complète et les tarifs saisonniers avant de la publier.
        </p>

        <button
          onClick={handleCreate}
          disabled={creating || !form.title_fr}
          className="w-full flex items-center justify-center gap-2 bg-[#0D1B2A] text-white py-3 rounded-xl font-semibold hover:bg-[#1a2f45] transition-colors disabled:opacity-60"
        >
          {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          {creating ? 'Création en cours...' : 'Créer la villa'}
        </button>
      </div>
    </div>
  );
}
