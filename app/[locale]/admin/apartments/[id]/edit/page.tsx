'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createClient } from '@supabase/supabase-js';
import {
  Save, ArrowLeft, Plus, Trash2, Star, Upload, X,
  Play, AlertCircle, Check,
  DollarSign, Calendar, Image as ImageIcon, BookOpen, Info,
  GripVertical, Film, RefreshCw, Copy, ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { AMENITIES_LIST } from '@/components/apartments/AmenityIcon';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  extra_guests_max: number;
  extra_guest_price_per_night: number;
  airbnb_ical_url: string | null;
  vrbo_ical_url: string | null;
  ical_last_sync_at: string | null;
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

// Catalogue de commodités cochables — dérivé d'AMENITIES_LIST pour garder
// une source de vérité unique (sinon ajouter une nouvelle commodité
// nécessitait deux modifications synchrones, et "drying_machine" est
// resté invisible dans l'admin parce qu'oublié ici).
const AMENITIES_CATALOG = AMENITIES_LIST.map((a) => ({ key: a.key, label: a.label_fr }));

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
    location: 'Saint-Martin, Côté Hollandais',
    price_per_night: 0, currency: 'USD',
    bedrooms: 1, bathrooms: 1, max_guests: 2,
    extra_guests_max: 0, extra_guest_price_per_night: 0,
    airbnb_ical_url: null, vrbo_ical_url: null, ical_last_sync_at: null,
    amenities: [], is_active: true,
  });

  const [images, setImages] = useState<ApartmentImage[]>([]);
  const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([]);
  const [guideSections, setGuideSections] = useState<GuideSection[]>([]);
  // newAmenity supprimé — commodités gérées via checkboxes
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [previewMedia, setPreviewMedia] = useState<ApartmentImage | null>(null);
  const [icalSyncing, setIcalSyncing] = useState(false);
  const [icalCopied, setIcalCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

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
        const res = await fetch('/api/admin/apartments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...apt, slug }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Création échouée (${res.status})`);
        }
        const data = await res.json();
        showMsg('success', 'Villa créée avec succès !');
        router.push(`/${locale}/admin/apartments/${data.id}/edit`);
      } else {
        const res = await fetch(`/api/admin/apartments/${apartmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title_fr: apt.title_fr, title_en: apt.title_en,
            short_description_fr: apt.short_description_fr,
            short_description_en: apt.short_description_en,
            description_fr: apt.description_fr, description_en: apt.description_en,
            location: apt.location, price_per_night: apt.price_per_night,
            bedrooms: apt.bedrooms, bathrooms: apt.bathrooms,
            max_guests: apt.max_guests,
            extra_guests_max: apt.extra_guests_max,
            extra_guest_price_per_night: apt.extra_guest_price_per_night,
            airbnb_ical_url: apt.airbnb_ical_url || null,
            vrbo_ical_url: apt.vrbo_ical_url || null,
            amenities: apt.amenities,
            is_active: apt.is_active,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Sauvegarde échouée (${res.status})`);
        }
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
  // Passe par /api/admin/apartments/[id]/images (service_role) — l'upload
  // direct Supabase + insert apartment_images était bloqué par RLS.
  const handleFileUpload = async (files: FileList) => {
    if (!files.length || isNew) return;
    setUploadingImages(true);
    let uploaded = 0;
    try {
      const maxPos = images.length > 0 ? Math.max(...images.map(i => i.position)) : 0;
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('alt_fr', file.name.replace(/\.[^.]+$/, ''));
        fd.append('alt_en', file.name.replace(/\.[^.]+$/, ''));
        fd.append('is_cover', String(images.length === 0 && uploaded === 0));
        fd.append('position', String(maxPos + uploaded + 1));

        const res = await fetch(`/api/admin/apartments/${apartmentId}/images`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Upload échoué (${res.status})`);
        }
        const imgData = await res.json();
        setImages(prev => [...prev, imgData]);
        uploaded++;
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
      const fd = new FormData();
      fd.append('url', videoUrl.trim());
      fd.append('alt_fr', 'Vidéo');
      fd.append('alt_en', 'Video');
      fd.append('is_cover', 'false');
      fd.append('position', String(maxPos + 1));
      const res = await fetch(`/api/admin/apartments/${apartmentId}/images`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Ajout vidéo échoué (${res.status})`);
      }
      const imgData = await res.json();
      setImages(prev => [...prev, imgData]);
      setVideoUrl('');
      showMsg('success', 'Vidéo ajoutée !');
    } catch (e: unknown) {
      showMsg('error', `Erreur : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    }
  };

  // ── Upload vidéo MP4 (signed URL, contourne la limite 4.5 MB de Vercel) ─
  // Flow :
  // 1. POST /videos/sign-upload → reçoit { signedUrl, token, storage_path, public_url }
  // 2. uploadToSignedUrl(...) → envoi direct browser → Supabase Storage
  // 3. POST /images avec url + storage_path → insertion DB
  const handleVideoFileUpload = async (file: File) => {
    if (!file || isNew) return;
    if (!file.type.startsWith('video/')) {
      showMsg('error', 'Format non supporté (MP4/WebM/MOV uniquement)');
      return;
    }
    setUploadingVideo(true);
    setVideoUploadProgress('Préparation...');
    try {
      // 1. Obtenir une URL signée
      const signRes = await fetch(`/api/admin/apartments/${apartmentId}/videos/sign-upload`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size, fileType: file.type }),
      });
      if (!signRes.ok) {
        const err = await signRes.json().catch(() => ({}));
        throw new Error(err.error || `Échec préparation upload (${signRes.status})`);
      }
      const { signedUrl: _signedUrl, token, storage_path, public_url } = await signRes.json();

      // 2. Upload direct vers Supabase Storage (contourne Vercel)
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      setVideoUploadProgress(`Envoi du fichier (${sizeMB} MB)...`);
      const { error: uploadErr } = await supabase.storage
        .from('apartment-videos')
        .uploadToSignedUrl(storage_path, token, file, { contentType: file.type });
      if (uploadErr) throw new Error(`Upload échoué : ${uploadErr.message}`);

      // 3. Enregistrer la row apartment_images
      setVideoUploadProgress('Enregistrement...');
      const maxPos = images.length > 0 ? Math.max(...images.map(i => i.position)) : 0;
      const fd = new FormData();
      fd.append('url', public_url);
      fd.append('storage_path', storage_path);
      fd.append('alt_fr', file.name.replace(/\.[^.]+$/, ''));
      fd.append('alt_en', file.name.replace(/\.[^.]+$/, ''));
      fd.append('is_cover', 'false');
      fd.append('position', String(maxPos + 1));
      const res = await fetch(`/api/admin/apartments/${apartmentId}/images`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Enregistrement échoué (${res.status})`);
      }
      const imgData = await res.json();
      setImages(prev => [...prev, imgData]);
      showMsg('success', `Vidéo ajoutée ! (${sizeMB} MB)`);
    } catch (e: unknown) {
      showMsg('error', `Erreur : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    } finally {
      setUploadingVideo(false);
      setVideoUploadProgress('');
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  const setCover = async (imageId: string) => {
    // La route PATCH côté API gère le "retire is_cover des autres" automatiquement.
    const res = await fetch(`/api/admin/apartments/${apartmentId}/images/${imageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ is_cover: true }),
    });
    if (!res.ok) {
      showMsg('error', 'Impossible de définir la couverture');
      return;
    }
    setImages(prev => prev.map(img => ({ ...img, is_cover: img.id === imageId })));
  };

  const deleteImage = async (img: ApartmentImage) => {
    if (!confirm('Supprimer cette photo/vidéo ?')) return;
    const res = await fetch(`/api/admin/apartments/${apartmentId}/images/${img.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      showMsg('error', 'Suppression échouée');
      return;
    }
    setImages(prev => prev.filter(i => i.id !== img.id));
  };

  // Drag-and-drop : appelé par dnd-kit quand l'utilisateur lâche une carte
  // après l'avoir déplacée. Met à jour l'ordre local + persiste les nouvelles
  // positions en parallèle via PATCH /images/[imageId].
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((i) => i.id === active.id);
    const newIndex = images.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(images, oldIndex, newIndex).map((img, i) => ({
      ...img,
      position: i + 1,
    }));
    setImages(reordered);

    await Promise.all(
      reordered.map((img) =>
        fetch(`/api/admin/apartments/${apartmentId}/images/${img.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ position: img.position }),
        }),
      ),
    );
  };

  // Sensors dnd-kit : pointer (souris + tactile) + clavier pour l'accessibilité
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Mise à jour de l'intitulé d'une photo (alt_fr / alt_en)
  const updateImageAlt = async (imageId: string, field: 'alt_fr' | 'alt_en', value: string) => {
    setImages(prev => prev.map(img => img.id === imageId ? { ...img, [field]: value } : img));
    await fetch(`/api/admin/apartments/${apartmentId}/images/${imageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ [field]: value }),
    });
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

  // ── Sync iCal manuel (bouton "Synchroniser maintenant") ──────────────────
  const triggerIcalSync = async () => {
    if (isNew || icalSyncing) return;
    setIcalSyncing(true);
    try {
      const res = await fetch(`/api/admin/apartments/${apartmentId}/sync-ical`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Sync échouée (${res.status})`);
      }
      const data = await res.json();
      const s = data.summary || { upserted: 0, deleted: 0, errors: 0 };
      if (s.errors > 0) {
        showMsg('error', `Sync terminée avec ${s.errors} erreur(s). +${s.upserted} / -${s.deleted}`);
      } else {
        showMsg('success', `Sync terminée — ${s.upserted} bloc(s) ajouté(s)/maj, ${s.deleted} supprimé(s)`);
      }
      // Refresh apt pour récupérer ical_last_sync_at à jour
      const { data: refreshed } = await supabase
        .from('apartments').select('*').eq('id', apartmentId).single();
      if (refreshed) setApt(refreshed);
    } catch (e: unknown) {
      showMsg('error', `Erreur : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    } finally {
      setIcalSyncing(false);
    }
  };

  const copyExportUrl = async () => {
    const url = `${window.location.origin}/api/ical/${apt.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setIcalCopied(true);
      setTimeout(() => setIcalCopied(false), 2000);
    } catch {
      showMsg('error', 'Impossible de copier (copie manuelle requise)');
    }
  };

  const isVideo = (url: string) =>
    url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo') ||
    /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('/apartment-videos/');
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
            <p className="text-xs text-gray-400 mb-4">Utilisez la barre d'outils pour mettre en forme le texte — gras, italique, listes, titres…</p>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">FR</label>
                <RichTextEditor
                  value={apt.description_fr}
                  onChange={html => setApt(p => ({ ...p, description_fr: html }))}
                  placeholder="Description en français…"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">EN</label>
                <RichTextEditor
                  value={apt.description_en}
                  onChange={html => setApt(p => ({ ...p, description_en: html }))}
                  placeholder="Description in English…"
                />
              </div>
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
                { field: 'max_guests' as const, label: 'Capacité incluse' },
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

            {/* Voyageurs supplémentaires payants — section dédiée */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Voyageurs supplémentaires payants</h4>
              <p className="text-xs text-gray-500 mb-4">
                Permet d&apos;accueillir des voyageurs au-delà de la capacité incluse, moyennant un surcoût par personne et par nuit (ex : canapé-lit, lit d&apos;appoint). Laissez à 0 pour désactiver.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Voyageurs sup. max</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={apt.extra_guests_max}
                    onChange={e => setApt(p => ({ ...p, extra_guests_max: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Prix par personne / nuit ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={apt.extra_guest_price_per_night}
                    onChange={e => setApt(p => ({ ...p, extra_guest_price_per_night: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
                  />
                </div>
              </div>
              {apt.extra_guests_max > 0 && apt.extra_guest_price_per_night > 0 && (
                <p className="text-xs text-[#B08B52] mt-3 font-medium">
                  Capacité totale acceptée : <strong>{apt.max_guests}</strong> + jusqu&apos;à <strong>{apt.extra_guests_max}</strong> en sup. = <strong>{apt.max_guests + apt.extra_guests_max} voyageurs max</strong>
                </p>
              )}
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

          {/* ── Synchronisation calendriers externes (iCal) ────────────── */}
          {!isNew && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar size={16} className="text-[#B08B52]" />
                  Synchronisation calendriers externes
                </h3>
                {apt.ical_last_sync_at && (
                  <span className="text-xs text-gray-400">
                    Dernière sync : {formatDistanceToNow(new Date(apt.ical_last_sync_at), { addSuffix: true, locale: frLocale })}
                  </span>
                )}
              </div>

              {/* IMPORT */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  ↓ Import — Airbnb / VRBO → ce site
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">URL iCal Airbnb</label>
                    <input
                      type="url"
                      value={apt.airbnb_ical_url || ''}
                      onChange={e => setApt(p => ({ ...p, airbnb_ical_url: e.target.value || null }))}
                      placeholder="https://www.airbnb.fr/calendar/ical/..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">URL iCal VRBO</label>
                    <input
                      type="url"
                      value={apt.vrbo_ical_url || ''}
                      onChange={e => setApt(p => ({ ...p, vrbo_ical_url: e.target.value || null }))}
                      placeholder="https://www.vrbo.com/icalendar/..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Sauvegarde d&apos;abord les infos (bouton ci-dessous), puis lance la sync.
                </p>
                <button
                  type="button"
                  onClick={triggerIcalSync}
                  disabled={icalSyncing || (!apt.airbnb_ical_url && !apt.vrbo_ical_url)}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 border border-[#B08B52] text-[#B08B52] rounded-lg text-sm hover:bg-[#B08B52]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={14} className={icalSyncing ? 'animate-spin' : ''} />
                  {icalSyncing ? 'Synchronisation en cours...' : 'Synchroniser maintenant'}
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  Sync automatique toutes les 30 min via cron. Le bouton ci-dessus force une sync immédiate.
                </p>
              </div>

              <div className="border-t border-gray-100" />

              {/* EXPORT */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  ↑ Export — ce site → Airbnb / VRBO
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  Colle cette URL dans Airbnb (Annonce → Calendrier → Sync calendars → Import calendar) pour que les réservations faites sur ce site bloquent les dates côté Airbnb.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/ical/${apt.slug}` : `/api/ical/${apt.slug}`}
                  </code>
                  <button
                    type="button"
                    onClick={copyExportUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-50 transition-colors flex-shrink-0"
                  >
                    {icalCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {icalCopied ? 'Copié' : 'Copier'}
                  </button>
                  <a
                    href={`/api/ical/${apt.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-50 transition-colors flex-shrink-0"
                    title="Tester le flux iCal"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}

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
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
            <div>
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

            <div className="border-t border-gray-100" />

            {/* Upload vidéo MP4 depuis l'ordinateur */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Film size={16} className="text-[#B08B52]" />
                Téléverser une vidéo MP4 depuis votre ordinateur
              </h3>
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleVideoFileUpload(e.target.files[0])}
              />
              <button
                onClick={() => !isNew && videoFileInputRef.current?.click()}
                disabled={isNew || uploadingVideo}
                className="w-full border-2 border-dashed border-gray-200 hover:border-[#B08B52] rounded-lg px-4 py-6 text-sm flex flex-col items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingVideo ? (
                  <>
                    <div className="w-6 h-6 border-2 border-[#B08B52] border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-600">{videoUploadProgress || 'Upload en cours...'}</span>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="text-gray-300" />
                    <span className="font-medium text-gray-700">Sélectionner un fichier MP4</span>
                    <span className="text-xs text-gray-400">MP4, WebM ou MOV — max 100 MB</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Liste des médias */}
          {images.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Médias ({images.length})</h3>
                <p className="text-xs text-gray-400">⭐ couverture · ≡ glisser pour réordonner</p>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map((img) => img.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {images.map((img, i) => (
                      <SortableImageRow
                        key={img.id}
                        img={img}
                        index={i}
                        videoCheck={isVideo}
                        thumbGetter={getYTThumb}
                        onAltChange={(field, value) => setImages(prev =>
                          prev.map(im => im.id === img.id ? { ...im, [field]: value } : im))}
                        onAltBlur={(field, value) => updateImageAlt(img.id, field, value)}
                        onSetCover={() => setCover(img.id)}
                        onDelete={() => deleteImage(img)}
                        onPreview={() => setPreviewMedia(img)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      )}

      {/* SortableImageRow rendu ci-dessous, à la fin du fichier */}

      {/* Modal de prévisualisation média (image ou vidéo) */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6"
          onClick={() => setPreviewMedia(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewMedia(null); }}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-colors"
            aria-label="Fermer"
          >
            <X size={22} />
          </button>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/\.(mp4|webm|mov)(\?|$)/i.test(previewMedia.url) || previewMedia.url.includes('/apartment-videos/') ? (
              <video src={previewMedia.url} controls autoPlay playsInline className="w-full max-h-[85vh] rounded-xl bg-black" />
            ) : isVideo(previewMedia.url) ? (
              <div className="w-full aspect-video">
                <iframe
                  src={previewMedia.url.includes('youtube') || previewMedia.url.includes('youtu.be')
                    ? `https://www.youtube.com/embed/${(previewMedia.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/) ?? [])[1] ?? ''}?autoplay=1`
                    : `https://player.vimeo.com/video/${(previewMedia.url.match(/vimeo\.com\/(\d+)/) ?? [])[1] ?? ''}?autoplay=1`
                  }
                  className="w-full h-full rounded-xl"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewMedia.url} alt="" className="w-full max-h-[85vh] object-contain rounded-xl" />
            )}
          </div>
        </div>
      )}

      {/* ── ONGLET GUIDE DIGITAL ─────────────────────────────────────────────── */}
      {activeTab === 'guide' && (
        <div className="space-y-4">
          {/* Redirection vers le nouveau CMS Guide */}
          <div className="bg-[#0D1B2A] rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#B08B52]/15 border border-[#B08B52]/25 flex items-center justify-center mx-auto mb-5">
              <BookOpen size={24} className="text-[#B08B52]" />
            </div>
            <h3 className="font-serif text-xl font-semibold text-white mb-2">
              Guide digital — CMS
            </h3>
            <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              Le guide est géré depuis une interface dédiée : sections, items, infos clés (Wi-Fi, codes, horaires) et aperçu mobile.
            </p>
            <Link
              href={`/${locale}/admin/guide`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#B08B52] text-white rounded-xl text-sm font-semibold hover:bg-[#8C6A38] transition-colors"
            >
              <BookOpen size={16} />
              Ouvrir le Guide digital
            </Link>
          </div>

          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <Info size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              L&apos;ancien système de sections simples reste actif comme fallback si le nouveau guide CMS n&apos;est pas encore configuré pour cette villa.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SortableImageRow — une carte image draggable via @dnd-kit
// ─────────────────────────────────────────────────────────────
function SortableImageRow({
  img,
  index,
  videoCheck,
  thumbGetter,
  onAltChange,
  onAltBlur,
  onSetCover,
  onDelete,
  onPreview,
}: {
  img: ApartmentImage;
  index: number;
  videoCheck: (url: string) => boolean;
  thumbGetter: (url: string) => string;
  onAltChange: (field: 'alt_fr' | 'alt_en', value: string) => void;
  onAltBlur: (field: 'alt_fr' | 'alt_en', value: string) => void;
  onSetCover: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: img.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const video = videoCheck(img.url);
  const hostedVideo = /\.(mp4|webm|mov)(\?|$)/i.test(img.url) || img.url.includes('/apartment-videos/');
  const thumb = video ? thumbGetter(img.url) : img.url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        img.is_cover
          ? 'border-[#B08B52] bg-[#B08B52]/5'
          : 'border-gray-100 hover:border-gray-200'
      } ${isDragging ? 'shadow-lg ring-2 ring-[#B08B52]/30' : 'bg-white'}`}
    >
      {/* Poignée drag */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1.5 text-gray-400 hover:text-[#B08B52] cursor-grab active:cursor-grabbing touch-none rounded hover:bg-gray-100 transition-colors flex-shrink-0"
        title="Glisser pour réordonner"
        aria-label="Glisser pour réordonner"
      >
        <GripVertical size={16} />
      </button>

      {/* Thumbnail */}
      <div
        className={`w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative ${video ? 'cursor-pointer hover:ring-2 hover:ring-[#B08B52]/50' : ''}`}
        onClick={video ? onPreview : undefined}
        title={video ? 'Prévisualiser' : undefined}
      >
        {hostedVideo ? (
          <video
            src={`${img.url}#t=0.1`}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : thumb ? (
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

      {/* Inputs alt */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 mb-1.5">
          {video ? '🎬 Vidéo' : `📷 Photo ${index + 1}`}
          {img.is_cover && <span className="ml-2 text-[#B08B52]">Couverture</span>}
        </p>
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={img.alt_fr}
            onChange={(e) => onAltChange('alt_fr', e.target.value)}
            onBlur={(e) => onAltBlur('alt_fr', e.target.value)}
            placeholder="Intitulé FR (ex: Piscine avec vue mer)"
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#B08B52] focus:border-[#B08B52] bg-white placeholder-gray-300"
          />
          <input
            type="text"
            value={img.alt_en}
            onChange={(e) => onAltChange('alt_en', e.target.value)}
            onBlur={(e) => onAltBlur('alt_en', e.target.value)}
            placeholder="Caption EN (e.g. Pool with sea view)"
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#B08B52] focus:border-[#B08B52] bg-white placeholder-gray-300"
          />
        </div>
      </div>

      {/* Actions (cover, delete) */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!video && (
          <button
            type="button"
            onClick={onSetCover}
            disabled={img.is_cover}
            className={`p-1.5 rounded transition-colors ${
              img.is_cover
                ? 'text-[#B08B52] cursor-default'
                : 'text-gray-400 hover:text-[#B08B52] hover:bg-[#B08B52]/10'
            }`}
            title="Définir comme couverture"
          >
            <Star size={14} fill={img.is_cover ? 'currentColor' : 'none'} />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="Supprimer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
