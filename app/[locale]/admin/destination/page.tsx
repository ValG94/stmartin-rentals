'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  Upload, Film, Image as ImageIcon, Plus, Trash2, GripVertical,
  Eye, EyeOff, ExternalLink, Loader2, Check, AlertCircle, X,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  DndContext, type DragEndEvent,
  KeyboardSensor, PointerSensor, closestCenter,
  useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DestinationMedia } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDestinationPage() {
  const { isAuthenticated, isLoading: authLoading, authHeaders } = useAdminAuth();
  const locale = useLocale();
  const isFr = locale === 'fr';

  const [media, setMedia] = useState<DestinationMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState('');
  const [previewItem, setPreviewItem] = useState<DestinationMedia | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showMsg = useCallback((type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }, []);

  // Chargement initial
  const loadMedia = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/homepage-destination-media', {
        credentials: 'include',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMedia(data);
    } catch (e) {
      console.error(e);
      showMsg('error', isFr ? 'Erreur de chargement' : 'Load error');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, isFr, showMsg]);

  useEffect(() => {
    if (isAuthenticated) loadMedia();
  }, [isAuthenticated, loadMedia]);

  // ── Upload image direct ──────────────────────────────────────────────────
  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('media_type', 'image');
        fd.append('alt_fr', file.name.replace(/\.[^.]+$/, ''));
        fd.append('alt_en', file.name.replace(/\.[^.]+$/, ''));
        fd.append('is_published', 'true');

        const res = await fetch('/api/admin/homepage-destination-media', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Upload ${res.status}`);
        }
        const created = await res.json();
        setMedia((prev) => [...prev, created]);
        uploaded++;
      }
      showMsg('success', `${uploaded} ${isFr ? 'média(s) ajouté(s)' : 'media added'}`);
    } catch (e: unknown) {
      showMsg('error', e instanceof Error ? e.message : 'Erreur');
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // ── Upload vidéo via signed URL (contourne 4.5MB Vercel) ─────────────────
  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      showMsg('error', isFr ? 'Format non supporté' : 'Unsupported format');
      return;
    }
    setUploadingVideo(true);
    setVideoProgress(isFr ? 'Préparation...' : 'Preparing...');
    try {
      // 1. Sign upload URL
      const signRes = await fetch('/api/admin/homepage-destination-media/videos/sign-upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size, fileType: file.type }),
      });
      if (!signRes.ok) {
        const err = await signRes.json().catch(() => ({}));
        throw new Error(err.error || `Sign ${signRes.status}`);
      }
      const { token, storage_path, public_url } = await signRes.json();

      // 2. Upload direct vers Supabase
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      setVideoProgress(isFr ? `Envoi (${sizeMB} MB)...` : `Uploading (${sizeMB} MB)...`);
      const { error: uploadErr } = await supabase.storage
        .from('apartment-videos')
        .uploadToSignedUrl(storage_path, token, file, { contentType: file.type });
      if (uploadErr) throw new Error(`Upload: ${uploadErr.message}`);

      // 3. Enregistrer la row
      setVideoProgress(isFr ? 'Enregistrement...' : 'Saving...');
      const fd = new FormData();
      fd.append('media_url', public_url);
      fd.append('storage_path', storage_path);
      fd.append('media_type', 'video');
      fd.append('alt_fr', file.name.replace(/\.[^.]+$/, ''));
      fd.append('alt_en', file.name.replace(/\.[^.]+$/, ''));
      fd.append('is_published', 'true');

      const res = await fetch('/api/admin/homepage-destination-media', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Save ${res.status}`);
      }
      const created = await res.json();
      setMedia((prev) => [...prev, created]);
      showMsg('success', `${isFr ? 'Vidéo ajoutée' : 'Video added'} (${sizeMB} MB)`);
    } catch (e: unknown) {
      showMsg('error', e instanceof Error ? e.message : 'Erreur');
    } finally {
      setUploadingVideo(false);
      setVideoProgress('');
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  // ── Update inline (alt, title, caption, publish) ─────────────────────────
  const patchItem = async (id: string, updates: Partial<DestinationMedia>) => {
    try {
      const res = await fetch(`/api/admin/homepage-destination-media/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `PATCH ${res.status}`);
      }
      const updated = await res.json();
      setMedia((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (e: unknown) {
      showMsg('error', e instanceof Error ? e.message : 'Erreur');
    }
  };

  const togglePublish = (item: DestinationMedia) =>
    patchItem(item.id, { is_published: !item.is_published });

  // ── Delete ───────────────────────────────────────────────────────────────
  const deleteItem = async (item: DestinationMedia) => {
    if (!confirm(isFr ? 'Supprimer ce média ?' : 'Delete this media?')) return;
    try {
      const res = await fetch(`/api/admin/homepage-destination-media/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setMedia((prev) => prev.filter((m) => m.id !== item.id));
      showMsg('success', isFr ? 'Supprimé' : 'Deleted');
    } catch (e: unknown) {
      showMsg('error', e instanceof Error ? e.message : 'Erreur');
    }
  };

  // ── Drag-and-drop reorder ────────────────────────────────────────────────
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = media.findIndex((m) => m.id === active.id);
    const newIdx = media.findIndex((m) => m.id === over.id);
    const next = arrayMove(media, oldIdx, newIdx);
    setMedia(next);
    try {
      await fetch('/api/admin/homepage-destination-media/reorder', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((m) => m.id) }),
      });
    } catch {
      showMsg('error', isFr ? 'Réordonnancement échoué' : 'Reorder failed');
      loadMedia();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#B08B52]" size={28} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isFr ? 'Slider Destination' : 'Destination Slider'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isFr
              ? "Pilote la section « The Destination » de la page d'accueil. Ajoute, réorganise et masque les médias affichés."
              : 'Manages the "The Destination" section on the homepage. Add, reorder, and hide displayed media.'}
          </p>
        </div>
        <Link
          href={`/${locale}#destination`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <ExternalLink size={14} />
          {isFr ? 'Voir sur le site' : 'Preview'}
        </Link>
      </div>

      {/* Toast */}
      {msg && (
        <div className={`mb-6 px-4 py-3 rounded-lg flex items-start gap-2 text-sm ${
          msg.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {msg.type === 'success' ? <Check size={16} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Upload zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Image upload */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ImageIcon size={16} className="text-[#B08B52]" />
            {isFr ? 'Ajouter une image' : 'Add an image'}
          </h3>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-200 hover:border-[#B08B52] rounded-lg px-4 py-6 text-sm flex flex-col items-center gap-2 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin text-[#B08B52]" size={20} />
                <span className="text-gray-600">{isFr ? 'Upload en cours...' : 'Uploading...'}</span>
              </>
            ) : (
              <>
                <Upload size={20} className="text-gray-300" />
                <span className="font-medium text-gray-700">{isFr ? 'Glisser ou cliquer' : 'Drop or click'}</span>
                <span className="text-xs text-gray-400">JPG, PNG, WebP — max 10 MB</span>
              </>
            )}
          </button>
        </div>

        {/* Video upload */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Film size={16} className="text-[#B08B52]" />
            {isFr ? 'Ajouter une vidéo' : 'Add a video'}
          </h3>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
          />
          <button
            onClick={() => videoInputRef.current?.click()}
            disabled={uploadingVideo}
            className="w-full border-2 border-dashed border-gray-200 hover:border-[#B08B52] rounded-lg px-4 py-6 text-sm flex flex-col items-center gap-2 transition-colors disabled:opacity-50"
          >
            {uploadingVideo ? (
              <>
                <Loader2 className="animate-spin text-[#B08B52]" size={20} />
                <span className="text-gray-600">{videoProgress}</span>
              </>
            ) : (
              <>
                <Upload size={20} className="text-gray-300" />
                <span className="font-medium text-gray-700">{isFr ? 'Sélectionner une vidéo' : 'Select a video'}</span>
                <span className="text-xs text-gray-400">MP4, WebM, MOV — max 100 MB</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Liste avec DnD */}
      {media.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <ImageIcon size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {isFr ? 'Aucun média pour l\'instant. Ajoute ta première image ou vidéo ci-dessus.' : 'No media yet. Add your first image or video above.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {media.length} {isFr ? 'média(s)' : 'media'}
            </h3>
            <p className="text-xs text-gray-400">≡ {isFr ? 'glisser pour réordonner' : 'drag to reorder'}</p>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={media.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {media.map((item) => (
                  <SortableMediaRow
                    key={item.id}
                    item={item}
                    isFr={isFr}
                    onFieldChange={(field, value) => setMedia((prev) =>
                      prev.map((m) => (m.id === item.id ? { ...m, [field]: value } : m))
                    )}
                    onFieldBlur={(field, value) => patchItem(item.id, { [field]: value || null })}
                    onTogglePublish={() => togglePublish(item)}
                    onDelete={() => deleteItem(item)}
                    onPreview={() => setPreviewItem(item)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Modal preview */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6"
          onClick={() => setPreviewItem(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewItem(null); }}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {previewItem.media_type === 'video' ? (
              <video src={previewItem.media_url} controls autoPlay playsInline className="w-full max-h-[85vh] rounded-xl bg-black" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewItem.media_url} alt="" className="w-full max-h-[85vh] object-contain rounded-xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sous-composant : ligne draggable ─────────────────────────────────────────

function SortableMediaRow({
  item, isFr,
  onFieldChange, onFieldBlur,
  onTogglePublish, onDelete, onPreview,
}: {
  item: DestinationMedia;
  isFr: boolean;
  onFieldChange: (field: keyof DestinationMedia, value: string) => void;
  onFieldBlur: (field: keyof DestinationMedia, value: string) => void;
  onTogglePublish: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const isVideo = item.media_type === 'video';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
        item.is_published
          ? 'border-gray-100 bg-white'
          : 'border-gray-100 bg-gray-50 opacity-70'
      } ${isDragging ? 'shadow-lg ring-2 ring-[#B08B52]/30' : ''}`}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1.5 text-gray-400 hover:text-[#B08B52] cursor-grab active:cursor-grabbing touch-none rounded hover:bg-gray-100 transition-colors flex-shrink-0 mt-1"
        title={isFr ? 'Glisser pour réordonner' : 'Drag to reorder'}
        aria-label="Drag"
      >
        <GripVertical size={16} />
      </button>

      {/* Thumbnail */}
      <button
        type="button"
        onClick={onPreview}
        className="w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative cursor-pointer hover:ring-2 hover:ring-[#B08B52]/50 transition-all"
        title={isFr ? 'Prévisualiser' : 'Preview'}
      >
        {isVideo ? (
          <video
            src={`${item.media_url}#t=0.1`}
            poster={item.thumbnail_url ?? undefined}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.media_url} alt={item.alt_fr ?? ''} className="w-full h-full object-cover" />
        )}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Film size={14} className="text-white" />
          </div>
        )}
      </button>

      {/* Inputs */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">
            {isVideo ? (isFr ? '🎬 Vidéo' : '🎬 Video') : (isFr ? '📷 Image' : '📷 Image')}
          </span>
          {!item.is_published && (
            <span className="text-[10px] uppercase font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              {isFr ? 'Masqué' : 'Hidden'}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            value={item.title_fr ?? ''}
            onChange={(e) => onFieldChange('title_fr', e.target.value)}
            onBlur={(e) => onFieldBlur('title_fr', e.target.value)}
            placeholder={isFr ? 'Titre FR (optionnel)' : 'Title FR (optional)'}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#B08B52] focus:border-[#B08B52] bg-white"
          />
          <input
            type="text"
            value={item.title_en ?? ''}
            onChange={(e) => onFieldChange('title_en', e.target.value)}
            onBlur={(e) => onFieldBlur('title_en', e.target.value)}
            placeholder={isFr ? 'Titre EN (optionnel)' : 'Title EN (optional)'}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#B08B52] focus:border-[#B08B52] bg-white"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            value={item.caption_fr ?? ''}
            onChange={(e) => onFieldChange('caption_fr', e.target.value)}
            onBlur={(e) => onFieldBlur('caption_fr', e.target.value)}
            placeholder={isFr ? 'Légende FR (optionnel)' : 'Caption FR (optional)'}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#B08B52] focus:border-[#B08B52] bg-white"
          />
          <input
            type="text"
            value={item.caption_en ?? ''}
            onChange={(e) => onFieldChange('caption_en', e.target.value)}
            onBlur={(e) => onFieldBlur('caption_en', e.target.value)}
            placeholder={isFr ? 'Légende EN (optionnel)' : 'Caption EN (optional)'}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#B08B52] focus:border-[#B08B52] bg-white"
          />
        </div>
        {!isVideo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              type="text"
              value={item.alt_fr ?? ''}
              onChange={(e) => onFieldChange('alt_fr', e.target.value)}
              onBlur={(e) => onFieldBlur('alt_fr', e.target.value)}
              placeholder={isFr ? 'Alt FR (accessibilité)' : 'Alt FR (accessibility)'}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#B08B52] focus:border-[#B08B52] bg-white"
            />
            <input
              type="text"
              value={item.alt_en ?? ''}
              onChange={(e) => onFieldChange('alt_en', e.target.value)}
              onBlur={(e) => onFieldBlur('alt_en', e.target.value)}
              placeholder={isFr ? 'Alt EN (accessibilité)' : 'Alt EN (accessibility)'}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#B08B52] focus:border-[#B08B52] bg-white"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={onTogglePublish}
          className={`p-1.5 rounded transition-colors ${
            item.is_published
              ? 'text-emerald-600 hover:bg-emerald-50'
              : 'text-gray-400 hover:bg-gray-100'
          }`}
          title={item.is_published ? (isFr ? 'Publié — cliquer pour masquer' : 'Published — click to hide') : (isFr ? 'Masqué — cliquer pour publier' : 'Hidden — click to publish')}
        >
          {item.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title={isFr ? 'Supprimer' : 'Delete'}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
