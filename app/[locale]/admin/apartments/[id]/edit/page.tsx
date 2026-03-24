'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Apartment, ApartmentImage, GuideSection, GuideSectionType } from '@/types';
import {
  Save, ArrowLeft, Upload, Trash2, Star, StarOff,
  Plus, ChevronUp, ChevronDown, Loader2
} from 'lucide-react';

// ============================================================
// TYPES LOCAUX
// ============================================================
type Tab = 'infos' | 'photos' | 'sections';

const SECTION_TYPES: { value: GuideSectionType; label: string; icon: string }[] = [
  { value: 'welcome', label: 'Bienvenue', icon: '👋' },
  { value: 'access', label: 'Accès', icon: '🔑' },
  { value: 'wifi', label: 'Wi-Fi', icon: '📶' },
  { value: 'rules', label: 'Règlement', icon: '📋' },
  { value: 'services', label: 'Services', icon: '🛎️' },
  { value: 'recommendations', label: 'Recommandations', icon: '⭐' },
  { value: 'emergency', label: 'Urgences', icon: '🚨' },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function EditApartmentPage() {
  const { isAuthenticated, isLoading, authHeaders } = useAdminAuth();
  const router = useRouter();
  const params = useParams();
  const apartmentId = params.id as string;

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('infos');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Infos
  const [form, setForm] = useState({
    title_fr: '', title_en: '',
    short_description_fr: '', short_description_en: '',
    description_fr: '', description_en: '',
    location: '',
    price_per_night: 0,
    bedrooms: 1, bathrooms: 1, max_guests: 2,
    amenities: [] as string[],
    is_active: true,
  });
  const [newAmenity, setNewAmenity] = useState('');

  // Photos
  const [images, setImages] = useState<ApartmentImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sections
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [savingSections, setSavingSections] = useState(false);

  // ============================================================
  // AUTH GUARD
  // ============================================================
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/fr/admin-login');
    }
  }, [isLoading, isAuthenticated, router]);

  // ============================================================
  // CHARGEMENT
  // ============================================================
  useEffect(() => {
    if (isAuthenticated && apartmentId && apartmentId !== 'new') {
      loadApartment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, apartmentId]);

  async function loadApartment() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/apartments/${apartmentId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Introuvable');
      const data: Apartment = await res.json();
      setApartment(data);
      setForm({
        title_fr: data.title_fr,
        title_en: data.title_en,
        short_description_fr: data.short_description_fr,
        short_description_en: data.short_description_en,
        description_fr: data.description_fr,
        description_en: data.description_en,
        location: data.location,
        price_per_night: data.price_per_night,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        max_guests: data.max_guests,
        amenities: data.amenities || [],
        is_active: data.is_active,
      });
      // Trier les images par position
      const sortedImages = [...(data.images || [])].sort((a, b) => a.position - b.position);
      setImages(sortedImages);
      // Trier les sections par position
      const sortedSections = [...(data.sections || [])].sort((a, b) => a.position - b.position);
      setSections(sortedSections);
    } catch {
      setErrorMsg('Impossible de charger la villa');
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // SAUVEGARDE INFOS
  // ============================================================
  async function saveInfos() {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/apartments/${apartmentId}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur de sauvegarde');
      }
      setSuccessMsg('Informations sauvegardées avec succès !');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // UPLOAD PHOTOS
  // ============================================================
  async function handleFileUpload(files: FileList) {
    setUploading(true);
    setErrorMsg('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fd = new FormData();
      fd.append('file', file);
      fd.append('alt_fr', form.title_fr);
      fd.append('alt_en', form.title_en);
      fd.append('is_cover', images.length === 0 && i === 0 ? 'true' : 'false');
      fd.append('position', String(images.length + i));

      try {
        const res = await fetch(`/api/admin/apartments/${apartmentId}/images`, {
          method: 'POST',
          headers: authHeaders(),
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Erreur upload');
        }
        const newImage: ApartmentImage = await res.json();
        setImages((prev) => [...prev, newImage]);
      } catch (e: unknown) {
        setErrorMsg(`Erreur upload ${file.name}: ${e instanceof Error ? e.message : 'Erreur'}`);
      }
    }
    setUploading(false);
  }

  async function deleteImage(imageId: string) {
    if (!confirm('Supprimer cette photo ?')) return;
    try {
      const res = await fetch(
        `/api/admin/apartments/${apartmentId}/images/${imageId}`,
        { method: 'DELETE', headers: authHeaders() }
      );
      if (!res.ok) throw new Error();
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setErrorMsg('Erreur lors de la suppression');
    }
  }

  async function setCover(imageId: string) {
    try {
      const res = await fetch(
        `/api/admin/apartments/${apartmentId}/images/${imageId}`,
        {
          method: 'PATCH',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_cover: true }),
        }
      );
      if (!res.ok) throw new Error();
      setImages((prev) =>
        prev.map((img) => ({ ...img, is_cover: img.id === imageId }))
      );
    } catch {
      setErrorMsg('Erreur lors de la mise à jour');
    }
  }

  async function moveImage(index: number, direction: 'up' | 'down') {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];

    // Mettre à jour les positions
    const updated = newImages.map((img, i) => ({ ...img, position: i }));
    setImages(updated);

    // Sauvegarder les nouvelles positions
    await Promise.all(
      updated.map((img) =>
        fetch(`/api/admin/apartments/${apartmentId}/images/${img.id}`, {
          method: 'PATCH',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: img.position }),
        })
      )
    );
  }

  // ============================================================
  // SECTIONS DU GUIDE
  // ============================================================
  function addSection(type: GuideSectionType) {
    const existing = SECTION_TYPES.find((s) => s.value === type);
    const newSection: GuideSection = {
      id: `new-${Date.now()}`,
      apartment_id: apartmentId,
      type,
      title_fr: existing?.label || type,
      title_en: existing?.label || type,
      content_fr: '',
      content_en: '',
      icon: existing?.icon || '📋',
      position: sections.length,
    };
    setSections((prev) => [...prev, newSection]);
  }

  function updateSection(index: number, field: keyof GuideSection, value: string) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveSections() {
    setSavingSections(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/apartments/${apartmentId}/sections`, {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(
          sections.map((s, i) => ({
            ...s,
            id: s.id.startsWith('new-') ? undefined : s.id,
            position: i,
          }))
        ),
      });
      if (!res.ok) throw new Error('Erreur de sauvegarde');
      const saved: GuideSection[] = await res.json();
      setSections(saved);
      setSuccessMsg('Sections sauvegardées !');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSavingSections(false);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/fr/admin/apartments')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {apartment?.title_fr || 'Modifier la villa'}
          </h1>
          <p className="text-gray-500 text-sm">ID : {apartmentId}</p>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {errorMsg}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {(['infos', 'photos', 'sections'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'infos' && '📝 Informations'}
            {tab === 'photos' && `📷 Photos (${images.length})`}
            {tab === 'sections' && `📖 Guide (${sections.length})`}
          </button>
        ))}
      </div>

      {/* ========== ONGLET INFOS ========== */}
      {activeTab === 'infos' && (
        <div className="space-y-6">
          {/* Statut */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Statut</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  form.is_active ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.is_active ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {form.is_active ? 'Villa active (visible sur le site)' : 'Villa inactive (masquée)'}
              </span>
            </label>
          </div>

          {/* Titres */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Titres</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre (FR)
                </label>
                <input
                  type="text"
                  value={form.title_fr}
                  onChange={(e) => setForm((f) => ({ ...f, title_fr: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title (EN)
                </label>
                <input
                  type="text"
                  value={form.title_en}
                  onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Descriptions courtes */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Description courte</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FR</label>
                <input
                  type="text"
                  value={form.short_description_fr}
                  onChange={(e) => setForm((f) => ({ ...f, short_description_fr: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Accroche affichée sur la carte..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EN</label>
                <input
                  type="text"
                  value={form.short_description_en}
                  onChange={(e) => setForm((f) => ({ ...f, short_description_en: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Short description shown on card..."
                />
              </div>
            </div>
          </div>

          {/* Descriptions longues */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Description complète</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FR</label>
                <textarea
                  value={form.description_fr}
                  onChange={(e) => setForm((f) => ({ ...f, description_fr: e.target.value }))}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Description détaillée de la villa..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">EN</label>
                <textarea
                  value={form.description_en}
                  onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Detailed villa description..."
                />
              </div>
            </div>
          </div>

          {/* Localisation & Prix */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Localisation & Tarif</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localisation
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: Terres Basses, Saint-Martin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix par nuit (€)
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
            </div>
          </div>

          {/* Capacité */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Capacité</h2>
            <div className="grid grid-cols-3 gap-4">
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
          </div>

          {/* Équipements */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Équipements</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.amenities.map((a, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full"
                >
                  {a}
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        amenities: f.amenities.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newAmenity.trim()) {
                    setForm((f) => ({ ...f, amenities: [...f.amenities, newAmenity.trim()] }));
                    setNewAmenity('');
                  }
                }}
                placeholder="Ajouter un équipement (Entrée pour valider)"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  if (newAmenity.trim()) {
                    setForm((f) => ({ ...f, amenities: [...f.amenities, newAmenity.trim()] }));
                    setNewAmenity('');
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Bouton sauvegarder */}
          <button
            onClick={saveInfos}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder les informations'}
          </button>
        </div>
      )}

      {/* ========== ONGLET PHOTOS ========== */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          {/* Zone d'upload */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-blue-600">
                <Loader2 className="animate-spin" size={32} />
                <p>Upload en cours...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Upload size={32} className="text-gray-400" />
                <p className="font-medium">Cliquez ou glissez des photos ici</p>
                <p className="text-sm">JPG, PNG, WebP — max 10 MB par photo</p>
              </div>
            )}
          </div>

          {/* Grille des photos */}
          {images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div
                  key={img.id}
                  className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.alt_fr || 'Photo'}
                    className="w-full h-40 object-cover"
                  />

                  {/* Badge couverture */}
                  {img.is_cover && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                      Couverture
                    </div>
                  )}

                  {/* Actions au survol */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {/* Définir comme couverture */}
                    <button
                      onClick={() => setCover(img.id)}
                      title="Définir comme couverture"
                      className={`p-2 rounded-lg transition-colors ${
                        img.is_cover
                          ? 'bg-yellow-400 text-yellow-900'
                          : 'bg-white/20 text-white hover:bg-yellow-400 hover:text-yellow-900'
                      }`}
                    >
                      {img.is_cover ? <Star size={16} /> : <StarOff size={16} />}
                    </button>

                    {/* Monter */}
                    <button
                      onClick={() => moveImage(index, 'up')}
                      disabled={index === 0}
                      className="p-2 bg-white/20 text-white hover:bg-white/40 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <ChevronUp size={16} />
                    </button>

                    {/* Descendre */}
                    <button
                      onClick={() => moveImage(index, 'down')}
                      disabled={index === images.length - 1}
                      className="p-2 bg-white/20 text-white hover:bg-white/40 rounded-lg transition-colors disabled:opacity-30"
                    >
                      <ChevronDown size={16} />
                    </button>

                    {/* Supprimer */}
                    <button
                      onClick={() => deleteImage(img.id)}
                      className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Position */}
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                    {index + 1}/{images.length}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>Aucune photo pour le moment. Uploadez des photos ci-dessus.</p>
            </div>
          )}

          <p className="text-sm text-gray-500 text-center">
            Survolez une photo pour accéder aux actions. L&apos;étoile définit la photo de couverture.
          </p>
        </div>
      )}

      {/* ========== ONGLET SECTIONS ========== */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          {/* Ajouter une section */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Ajouter une section au guide</h2>
            <div className="flex flex-wrap gap-2">
              {SECTION_TYPES.map((st) => {
                const alreadyAdded = sections.some((s) => s.type === st.value);
                return (
                  <button
                    key={st.value}
                    onClick={() => !alreadyAdded && addSection(st.value)}
                    disabled={alreadyAdded}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      alreadyAdded
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <span>{st.icon}</span>
                    {st.label}
                    {alreadyAdded && ' ✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Liste des sections */}
          {sections.map((section, index) => {
            const sectionType = SECTION_TYPES.find((s) => s.value === section.type);
            return (
              <div
                key={section.id}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span>{section.icon}</span>
                    {sectionType?.label || section.type}
                  </h3>
                  <button
                    onClick={() => removeSection(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Titre (FR)
                    </label>
                    <input
                      type="text"
                      value={section.title_fr}
                      onChange={(e) => updateSection(index, 'title_fr', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Title (EN)
                    </label>
                    <input
                      type="text"
                      value={section.title_en}
                      onChange={(e) => updateSection(index, 'title_en', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Contenu (FR)
                    </label>
                    <textarea
                      value={section.content_fr}
                      onChange={(e) => updateSection(index, 'content_fr', e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      placeholder="Contenu en français..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Content (EN)
                    </label>
                    <textarea
                      value={section.content_en}
                      onChange={(e) => updateSection(index, 'content_en', e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      placeholder="Content in English..."
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {sections.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Aucune section. Ajoutez des sections ci-dessus pour créer le guide digital.</p>
            </div>
          )}

          {sections.length > 0 && (
            <button
              onClick={saveSections}
              disabled={savingSections}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {savingSections ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {savingSections ? 'Sauvegarde...' : 'Sauvegarder le guide'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
