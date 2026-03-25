'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createClient } from '@supabase/supabase-js';
import {
  Save, ArrowLeft, Plus, Trash2, Star, Upload, X,
  ChevronUp, ChevronDown, Play, AlertCircle, Check,
  DollarSign, Calendar, Image as ImageIcon, BookOpen, Info
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ApartmentData {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  short_description_fr: string;
  short_description_en: string;
  description_fr: string;
  description_en: string;
  location: string;
  price_per_night: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  is_active: boolean;
}

interface ApartmentImage {
  id: string;
  apartment_id: string;
  url: string;
  storage_path: string | null;
  alt_fr: string;
  alt_en: string;
  is_cover: boolean;
  position: number;
}

interface SeasonalPrice {
  id?: string;
  apartment_id?: string;
  name_fr: string;
  name_en: string;
  price_per_night: number;
  date_from: string;
  date_to: string;
  is_active: boolean;
  _isNew?: boolean;
  _toDelete?: boolean;
}

interface GuideSection {
  id?: string;
  apartment_id?: string;
  title_fr: string;
  title_en: string;
  content_fr: string;
  content_en: string;
  icon: string;
  position: number;
  _isNew?: boolean;
  _toDelete?: boolean;
}

const TABS = [
  { id: 'info', label: 'Informations', icon: Info },
  { id: 'prices', label: 'Tarifs & Saisons', icon: DollarSign },
  { id: 'photos', label: 'Photos & Vidéos', icon: ImageIcon },
  { id: 'guide', label: 'Guide digital', icon: BookOpen },
];

// Commodités standardisées (clés internes)
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

const GUIDE_ICONS = ['🏠', '🔑', '📶', '🚗', '🏖️', '🍽️', '🛒', '🚑', '📞', '🌊', '⚠️', '✨', '👋', '📋', '🛎️'];

export default function EditApartmentPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const apartmentId = params?.id as string;
  const isNew = apartmentId === 'new';

  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [apt, setApt] = useState<ApartmentData>({
    id: '', slug: '', title_fr: '', title_en: '',
    short_description_fr: '', short_description_en: '',
    description_fr: '', description_en: '',
    location: 'Saint-Martin, Antilles françaises',
    price_per_night: 0, currency: 'USD',
    bedrooms: 1, bathrooms: 1, max_guests: 2,
    amenities: [], is_active: true,
  });

  const [images, setImages] = useState<ApartmentImage[]>([]);
  const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([]);
  const [guideSections, setGuideSections] = useState<GuideSection[]>([]);
  // newAmenity supprimé — commodités gérées via checkboxes
  const [uploadingImages, setUploadingImages] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/${locale}/admin-login`);
    }
  }, [authLoading, isAuthenticated, router, locale]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    if (isNew || !apartmentId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: aptData, error: aptErr } = await supabase
        .from('apartments').select('*').eq('id', apartmentId).single();
      if (aptErr) throw aptErr;
      setApt(aptData);

      const { data: imgData } = await supabase
        .from('apartment_images').select('*')
        .eq('apartment_id', apartmentId).order('position', { ascending: true });
      setImages(imgData || []);

      const { data: spData } = await supabase
        .from('seasonal_prices').select('*')
        .eq('apartment_id', apartmentId).order('date_from', { ascending: true });
      setSeasonalPrices(spData || []);

      const { data: guideData } = await supabase
        .from('apartment_sections').select('*')
        .eq('apartment_id', apartmentId).order('position', { ascending: true });
      setGuideSections(guideData || []);
    } catch (e) {
      console.error('Erreur chargement:', e);
      showMsg('error', 'Impossible de charger la villa. Vérifiez la connexion Supabase.');
    } finally {
      setLoading(false);
    }
  }, [apartmentId, isNew]);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  // ── Sauvegarde infos ──────────────────────────────────────────────────────
  const saveInfo = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const slug = apt.title_fr.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const { data, error } = await supabase
          .from('apartments').insert([{ ...apt, slug }]).select().single();
        if (error) throw error;
        showMsg('success', 'Villa créée avec succès !');
        router.push(`/${locale}/admin/apartments/${data.id}/edit`);
      } else {
        const { error } = await supabase.from('apartments').update({
          title_fr: apt.title_fr, title_en: apt.title_en,
          short_description_fr: apt.short_description_fr,
          short_description_en: apt.short_description_en,
          description_fr: apt.description_fr, description_en: apt.description_en,
          location: apt.location, price_per_night: apt.price_per_night,
          bedrooms: apt.bedrooms, bathrooms: apt.bathrooms,
          max_guests: apt.max_guests, amenities: apt.amenities,
          is_active: apt.is_active,
        }).eq('id', apartmentId);
        if (error) throw error;
        showMsg('success', 'Informations sauvegardées !');
      }
    } catch (e: unknown) {
      showMsg('error', `Erreur : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Sauvegarde tarifs ─────────────────────────────────────────────────────
  const savePrices = async () => {
    setSaving(true);
    try {
      for (const sp of seasonalPrices) {
        if (sp._toDelete && sp.id) {
          await supabase.from('seasonal_prices').delete().eq('id', sp.id);
        } else if (sp._isNew && !sp._toDelete) {
          await supabase.from('seasonal_prices').insert([{
            apartment_id: apartmentId, name_fr: sp.name_fr, name_en: sp.name_en,
            price_per_night: sp.price_per_night, date_from: sp.date_from,
            date_to: sp.date_to, is_active: sp.is_active,
          }]);
        } else if (sp.id && !sp._toDelete) {
          await supabase.from('seasonal_prices').update({
            name_fr: sp.name_fr, name_en: sp.name_en,
            price_per_night: sp.price_per_night, date_from: sp.date_from,
            date_to: sp.date_to, is_active: sp.is_active,
          }).eq('id', sp.id);
        }
      }
      const { data } = await supabase.from('seasonal_prices').select('*')
        .eq('apartment_id', apartmentId).order('date_from', { ascending: true });
      setSeasonalPrices(data || []);
      showMsg('success', 'Tarifs saisonniers sauvegardés !');
    } catch (e: unknown) {
      showMsg('error', `Erreur : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Upload photos ─────────────────────────────────────────────────────────
  const handleFileUpload = async (files: FileList) => {
    if (!files.length || isNew) return;
    setUploadingImages(true);
    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const path = `${apartmentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const maxPos = images.length > 0 ? Math.max(...images.map(i => i.position)) : 0;

        const { error: uploadErr } = await supabase.storage
          .from('apartment-images').upload(path, file, { cacheControl: '3600', upsert: false });

        let publicUrl = '';
        if (!uploadErr) {
          const { data: { publicUrl: url } } = supabase.storage.from('apartment-images').getPublicUrl(path);
          publicUrl = url;
        } else {
          publicUrl = `/images/placeholder.jpg`;
        }

        const { data: imgData } = await supabase.from('apartment_images').insert([{
          apartment_id: apartmentId, url: publicUrl,
          storage_path: uploadErr ? null : path,
          alt_fr: file.name.replace(/\.[^.]+$/, ''),
          alt_en: file.name.replace(/\.[^.]+$/, ''),
          is_cover: images.length === 0 && uploaded === 0,
          position: maxPos + uploaded + 1,
        }]).select().single();
        if (imgData) { setImages(prev => [...prev, imgData]); uploaded++; }
      }
      showMsg('success', `${uploaded} photo(s) ajoutée(s) !`);
    } catch (e: unknown) {
      showMsg('error', `Erreur upload : ${e instanceof Error ? e.message : 'Erreur'}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const addVideo = async () => {
    if (!videoUrl.trim() || isNew) return;
    try {
      const maxPos = images.length > 0 ? Math.max(...images.map(i => i.position)) : 0;
      const { data: imgData } = await supabase.from('apartment_images').insert([{
        apartment_id: apartmentId, url: videoUrl.trim(), storage_path: null,
        alt_fr: 'Vidéo', alt_en: 'Video', is_cover: false, position: maxPos + 1,
      }]).select().single();
      if (imgData) { setImages(prev => [...prev, imgData]); setVideoUrl(''); }
      showMsg('success', 'Vidéo ajoutée !');
    } catch (e: unknown) {
      showMsg('error', `Erreur : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    }
  };

  const setCover = async (imageId: string) => {
    await supabase.from('apartment_images').update({ is_cover: false }).eq('apartment_id', apartmentId);
    await supabase.from('apartment_images').update({ is_cover: true }).eq('id', imageId);
    setImages(prev => prev.map(img => ({ ...img, is_cover: img.id === imageId })));
  };

  const deleteImage = async (img: ApartmentImage) => {
    if (!confirm('Supprimer cette photo/vidéo ?')) return;
    if (img.storage_path) await supabase.storage.from('apartment-images').remove([img.storage_path]);
    await supabase.from('apartment_images').delete().eq('id', img.id);
    setImages(prev => prev.filter(i => i.id !== img.id));
  };

  const moveImage = async (index: number, dir: 'up' | 'down') => {
    const arr = [...images];
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= arr.length) return;
    [arr[index], arr[swap]] = [arr[swap], arr[index]];
    const updated = arr.map((img, i) => ({ ...img, position: i + 1 }));
    setImages(updated);
    for (const img of updated) {
      await supabase.from('apartment_images').update({ position: img.position }).eq('id', img.id);
    }
  };

  // ── Sauvegarde guide ──────────────────────────────────────────────────────
  const saveGuide = async () => {
    setSaving(true);
    try {
      for (const s of guideSections) {
        if (s._toDelete && s.id) {
          await supabase.from('apartment_sections').delete().eq('id', s.id);
        } else if (s._isNew && !s._toDelete) {
          await supabase.from('apartment_sections').insert([{
            apartment_id: apartmentId, title_fr: s.title_fr, title_en: s.title_en,
            content_fr: s.content_fr, content_en: s.content_en, icon: s.icon, position: s.position,
          }]);
        } else if (s.id && !s._toDelete) {
          await supabase.from('apartment_sections').update({
            title_fr: s.title_fr, title_en: s.title_en,
            content_fr: s.content_fr, content_en: s.content_en, icon: s.icon, position: s.position,
          }).eq('id', s.id);
        }
      }
      const { data } = await supabase.from('apartment_sections').select('*')
        .eq('apartment_id', apartmentId).order('position', { ascending: true });
      setGuideSections(data || []);
      showMsg('success', 'Guide digital sauvegardé !');
    } catch (e: unknown) {
      showMsg('error', `Erreur : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    } finally {
      setSaving(false);
    }
  };

  const isVideo = (url: string) => url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo');
  const getYTThumb = (url: string) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : '';
  };

  const updateSP = (sp: SeasonalPrice, field: keyof SeasonalPrice, value: unknown) => {
    setSeasonalPrices(prev => prev.map(p => p === sp ? { ...p, [field]: value } : p));
  };
  const updateGS = (gs: GuideSection, field: keyof GuideSection, value: unknown) => {
    setGuideSections(prev => prev.map(s => s === gs ? { ...s, [field]: value } : s));
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#B08B52] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activePrices = seasonalPrices.filter(s => !s._toDelete);
  const activeSections = guideSections.filter(s => !s._toDelete);

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/${locale}/admin/apartments`}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'Nouvelle villa' : apt.title_fr || 'Modifier la villa'}
          </h1>
          {!isNew && <p className="text-xs text-gray-400 mt-0.5">ID : {apartmentId}</p>}
        </div>
        {!isNew && apt.slug && (
          <Link href={`/${locale}/apartments/${apt.slug}`} target="_blank"
            className="text-sm text-[#B08B52] hover:underline">
            Voir la page →
          </Link>
        )}
      </div>

      {/* Message */}
      {saveMessage && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm font-medium ${
          saveMessage.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {saveMessage.text}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const badge = tab.id === 'photos' ? images.length
            : tab.id === 'prices' ? activePrices.length
            : tab.id === 'guide' ? activeSections.length : 0;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
                activeTab === tab.id ? 'bg-white text-[#0D1B2A] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={15} />
              {tab.label}
              {badge > 0 && (
                <span className="bg-[#B08B52] text-white text-xs px-1.5 py-0.5 rounded-full">{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── ONGLET INFORMATIONS ──────────────────────────────────────────────── */}
      {activeTab === 'info' && (
        <div className="space-y-5">
          {/* Statut */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Statut de publication</h3>
            <label className="flex items-center gap-3 cursor-pointer" onClick={() => setApt(p => ({ ...p, is_active: !p.is_active }))}>
              <div className={`relative w-12 h-6 rounded-full transition-colors ${apt.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${apt.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {apt.is_active ? 'Villa active (visible sur le site)' : 'Villa masquée (non visible)'}
              </span>
            </label>
          </div>

          {/* Titres */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Titres</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['title_fr', 'title_en'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {field === 'title_fr' ? 'Titre (FR)' : 'Title (EN)'}
                  </label>
                  <input type="text" value={apt[field]}
                    onChange={e => setApt(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
                    placeholder={field === 'title_fr' ? 'La Villa Vanille' : 'La Villa Vanille'} />
                </div>
              ))}
            </div>
          </div>

          {/* Descriptions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              Description courte <span className="text-xs text-gray-400 font-normal">(affichée sur la carte)</span>
            </h3>
            <div className="space-y-3">
              {(['short_description_fr', 'short_description_en'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {field.endsWith('_fr') ? 'FR' : 'EN'}
                  </label>
                  <input type="text" value={apt[field]}
                    onChange={e => setApt(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Description complète</h3>
            <div className="space-y-3">
              {(['description_fr', 'description_en'] as const).map(field => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {field.endsWith('_fr') ? 'FR' : 'EN'}
                  </label>
                  <textarea value={apt[field]} rows={5}
                    onChange={e => setApt(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52] resize-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Localisation & Capacité */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Localisation & Capacité</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 md:col-span-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Localisation</label>
                <input type="text" value={apt.location}
                  onChange={e => setApt(p => ({ ...p, location: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]" />
              </div>
              {[
                { field: 'bedrooms' as const, label: 'Chambres' },
                { field: 'bathrooms' as const, label: 'Salles de bain' },
                { field: 'max_guests' as const, label: 'Capacité max' },
                { field: 'price_per_night' as const, label: 'Prix de base / nuit ($)' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
                  <input type="number" min="0" value={apt[field]}
                    onChange={e => setApt(p => ({ ...p, [field]: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]" />
                </div>
              ))}
            </div>
          </div>

          {/* Commodités — Checkboxes */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Commodités & Équipements</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {apt.amenities.length} sélectionné{apt.amenities.length > 1 ? 'es' : 'e'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AMENITIES_CATALOG.map(({ key, label }) => {
                const checked = apt.amenities.includes(key);
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
                      onChange={() => {
                        setApt(p => ({
                          ...p,
                          amenities: checked
                            ? p.amenities.filter(a => a !== key)
                            : [...p.amenities, key],
                        }));
                      }}
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button onClick={saveInfo} disabled={saving}
            className="w-full bg-[#0D1B2A] text-white py-3 rounded-xl font-semibold hover:bg-[#1a2f45] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
            Sauvegarder les informations
          </button>
        </div>
      )}

      {/* ── ONGLET TARIFS & SAISONS ──────────────────────────────────────────── */}
      {activeTab === 'prices' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <strong>Prix de base :</strong> ${apt.price_per_night.toLocaleString('en-US')}/nuit.
              Les tarifs saisonniers s&apos;appliquent en priorité sur les périodes définies.
            </div>
          </div>

          {activePrices.map((sp, i) => (
            <div key={sp.id || i} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#B08B52]" />
                  <h4 className="font-semibold text-gray-900">{sp.name_fr || `Tarif saisonnier ${i + 1}`}</h4>
                  {sp.is_active && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Actif</span>}
                </div>
                <button onClick={() => updateSP(sp, '_toDelete', true)}
                  className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nom (FR)</label>
                  <input type="text" value={sp.name_fr}
                    onChange={e => updateSP(sp, 'name_fr', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
                    placeholder="Ex: Haute saison" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Name (EN)</label>
                  <input type="text" value={sp.name_en}
                    onChange={e => updateSP(sp, 'name_en', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
                    placeholder="Ex: High season" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Prix / nuit ($)</label>
                  <input type="number" min="0" value={sp.price_per_night}
                    onChange={e => updateSP(sp, 'price_per_night', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Statut</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={sp.is_active}
                      onChange={e => updateSP(sp, 'is_active', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 accent-[#B08B52]" />
                    <span className="text-sm text-gray-600">Appliquer ce tarif</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date de début</label>
                  <input type="date" value={sp.date_from}
                    onChange={e => updateSP(sp, 'date_from', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date de fin</label>
                  <input type="date" value={sp.date_to}
                    onChange={e => updateSP(sp, 'date_to', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]" />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => setSeasonalPrices(prev => [...prev, {
              name_fr: '', name_en: '', price_per_night: apt.price_per_night,
              date_from: '', date_to: '', is_active: true, _isNew: true,
            }])}
            className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#B08B52] hover:text-[#B08B52] py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium">
            <Plus size={16} />Ajouter un tarif saisonnier
          </button>

          <button onClick={savePrices} disabled={saving || isNew}
            className="w-full bg-[#0D1B2A] text-white py-3 rounded-xl font-semibold hover:bg-[#1a2f45] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
            Sauvegarder les tarifs
          </button>
        </div>
      )}

      {/* ── ONGLET PHOTOS & VIDÉOS ───────────────────────────────────────────── */}
      {activeTab === 'photos' && (
        <div className="space-y-5">
          {isNew && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
              Sauvegardez d&apos;abord les informations de base pour pouvoir ajouter des photos.
            </div>
          )}

          {/* Zone d'upload */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isNew ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-[#B08B52] cursor-pointer'
            }`}
            onClick={() => !isNew && fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              if (!isNew && e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files);
            }}>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => e.target.files && handleFileUpload(e.target.files)} />
            {uploadingImages ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#B08B52] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Upload en cours...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload size={32} className="text-gray-300" />
                <div>
                  <p className="font-medium text-gray-700">Glissez vos photos ici</p>
                  <p className="text-sm text-gray-400 mt-1">ou cliquez pour sélectionner (JPG, PNG, WebP)</p>
                </div>
              </div>
            )}
          </div>

          {/* Ajouter vidéo */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Play size={16} className="text-[#B08B52]" />
              Ajouter une vidéo YouTube ou Vimeo
            </h3>
            <div className="flex gap-2">
              <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..." disabled={isNew}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52] disabled:opacity-50" />
              <button onClick={addVideo} disabled={isNew || !videoUrl.trim()}
                className="bg-[#0D1B2A] text-white px-4 py-2.5 rounded-lg text-sm hover:bg-[#1a2f45] transition-colors disabled:opacity-50 flex items-center gap-2">
                <Plus size={16} />Ajouter
              </button>
            </div>
          </div>

          {/* Liste des médias */}
          {images.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Médias ({images.length})</h3>
                <p className="text-xs text-gray-400">⭐ couverture · ↑↓ réordonner</p>
              </div>
              <div className="space-y-2">
                {images.map((img, i) => {
                  const video = isVideo(img.url);
                  const thumb = video ? getYTThumb(img.url) : img.url;
                  return (
                    <div key={img.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      img.is_cover ? 'border-[#B08B52] bg-[#B08B52]/5' : 'border-gray-100 hover:border-gray-200'
                    }`}>
                      <div className="w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play size={16} className="text-gray-400" />
                          </div>
                        )}
                        {video && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play size={12} className="text-white" fill="white" />
                          </div>
                        )}
                        {img.is_cover && (
                          <div className="absolute top-0.5 left-0.5 bg-[#B08B52] rounded-full p-0.5">
                            <Star size={7} className="text-white" fill="white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700">
                          {video ? '🎬 Vidéo' : `📷 Photo ${i + 1}`}
                          {img.is_cover && <span className="ml-2 text-[#B08B52] text-xs font-semibold">Couverture</span>}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{img.alt_fr}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => moveImage(i, 'up')} disabled={i === 0}
                          className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 hover:bg-gray-100 rounded">
                          <ChevronUp size={14} />
                        </button>
                        <button onClick={() => moveImage(i, 'down')} disabled={i === images.length - 1}
                          className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 hover:bg-gray-100 rounded">
                          <ChevronDown size={14} />
                        </button>
                        {!video && (
                          <button onClick={() => setCover(img.id)} disabled={img.is_cover}
                            className={`p-1.5 rounded transition-colors ${img.is_cover ? 'text-[#B08B52] cursor-default' : 'text-gray-400 hover:text-[#B08B52] hover:bg-[#B08B52]/10'}`}
                            title="Définir comme couverture">
                            <Star size={14} fill={img.is_cover ? 'currentColor' : 'none'} />
                          </button>
                        )}
                        <button onClick={() => deleteImage(img)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ONGLET GUIDE DIGITAL ─────────────────────────────────────────────── */}
      {activeTab === 'guide' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Le guide digital est accessible aux voyageurs depuis la page de la villa.
          </p>

          {activeSections.map((section, i) => (
            <div key={section.id || i} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <select value={section.icon}
                    onChange={e => updateGS(section, 'icon', e.target.value)}
                    className="text-xl border border-gray-200 rounded-lg px-2 py-1 focus:outline-none bg-white">
                    {GUIDE_ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                  <h4 className="font-semibold text-gray-900">Section {i + 1}</h4>
                </div>
                <button onClick={() => updateGS(section, '_toDelete', true)}
                  className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Titre (FR)</label>
                  <input type="text" value={section.title_fr}
                    onChange={e => updateGS(section, 'title_fr', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
                    placeholder="Ex: Bienvenue" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title (EN)</label>
                  <input type="text" value={section.title_en}
                    onChange={e => updateGS(section, 'title_en', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
                    placeholder="Ex: Welcome" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Contenu (FR)</label>
                  <textarea value={section.content_fr} rows={3}
                    onChange={e => updateGS(section, 'content_fr', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52] resize-none"
                    placeholder="Contenu en français..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Content (EN)</label>
                  <textarea value={section.content_en} rows={3}
                    onChange={e => updateGS(section, 'content_en', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52] resize-none"
                    placeholder="Content in English..." />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => setGuideSections(prev => [...prev, {
              title_fr: '', title_en: '', content_fr: '', content_en: '',
              icon: '🏠', position: prev.filter(s => !s._toDelete).length + 1, _isNew: true,
            }])}
            disabled={isNew}
            className="w-full border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#B08B52] hover:text-[#B08B52] py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50">
            <Plus size={16} />Ajouter une section
          </button>

          <button onClick={saveGuide} disabled={saving || isNew}
            className="w-full bg-[#0D1B2A] text-white py-3 rounded-xl font-semibold hover:bg-[#1a2f45] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
            Sauvegarder le guide
          </button>
        </div>
      )}
    </div>
  );
}
