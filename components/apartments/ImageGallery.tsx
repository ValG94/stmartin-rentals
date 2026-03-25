'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Grid, Maximize2, ImageOff } from 'lucide-react';
import type { ApartmentImage } from '@/types';

// ── Helpers vidéo ────────────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return m ? m[1] : null;
}
function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}
function isVideoUrl(url: string): boolean {
  return !!(getYouTubeId(url) || getVimeoId(url));
}
function getVideoThumbnail(url: string): string {
  const ytId = getYouTubeId(url);
  return ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : '';
}
function getVideoEmbedUrl(url: string): string {
  const ytId = getYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
  const vimeoId = getVimeoId(url);
  if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
  return url;
}

// ── Composant image avec gestion d'erreur ────────────────────────────────────

interface SafeImgProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

function SafeImg({ src, alt, className, priority }: SafeImgProps) {
  const [broken, setBroken] = useState(false);

  if (broken || !src) {
    return (
      <div className={`w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-2 ${className ?? ''}`}>
        <ImageOff size={24} className="text-gray-300" />
        <span className="text-xs text-gray-300">Photo indisponible</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${className ?? ''}`}
      onError={() => setBroken(true)}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface ImageGalleryProps {
  /** Objets ApartmentImage complets depuis Supabase */
  mediaItems: ApartmentImage[];
  /** Nom de la villa (fallback alt) */
  alt: string;
  /** Locale pour les légendes */
  locale?: string;
}

// ── Composant principal ──────────────────────────────────────────────────────

export default function ImageGallery({ mediaItems, alt, locale = 'en' }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + mediaItems.length) % mediaItems.length : 0)),
    [mediaItems.length]
  );
  const next = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % mediaItems.length : 0)),
    [mediaItems.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, prev, next, closeLightbox]);

  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxIndex]);

  if (!mediaItems || mediaItems.length === 0) return null;

  // Trier : couverture en premier, puis par position
  const sorted = [...mediaItems].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return (a.position ?? 0) - (b.position ?? 0);
  });

  const displayed = showAll ? sorted : sorted.slice(0, 9);
  const hasMore = sorted.length > 9;
  const current = lightboxIndex !== null ? sorted[lightboxIndex] : null;

  const getAlt = (item: ApartmentImage, i: number) =>
    (locale === 'fr' ? item.alt_fr : item.alt_en) || `${alt} ${i + 1}`;

  return (
    <>
      {/* ── Mosaïque ── */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-2xl overflow-hidden">
          {displayed.map((item, i) => {
            const isFirst = i === 0;
            const isLastVisible = !showAll && i === 8 && hasMore;
            const isVideo = isVideoUrl(item.url);
            const thumbSrc = isVideo ? getVideoThumbnail(item.url) : item.url;
            const caption = getAlt(item, i);

            return (
              <div
                key={item.id}
                className={`relative cursor-pointer overflow-hidden group ${isFirst ? 'col-span-2 row-span-2' : ''}`}
                style={{ height: isFirst ? '420px' : '190px' }}
                onClick={() => !isLastVisible && setLightboxIndex(i)}
              >
                {/* Image / vidéo */}
                <SafeImg
                  src={thumbSrc}
                  alt={caption}
                  priority={isFirst}
                />

                {/* Overlay hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />

                {/* Bouton play pour vidéos */}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play size={22} className="text-gray-900 ml-1" fill="currentColor" />
                    </div>
                  </div>
                )}

                {/* Badge couverture */}
                {item.is_cover && (
                  <div className="absolute top-3 left-3 bg-[#B08B52]/90 text-white text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm pointer-events-none">
                    {locale === 'fr' ? 'Couverture' : 'Cover'}
                  </div>
                )}

                {/* Hint plein écran sur la première photo */}
                {isFirst && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/50 text-white rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 backdrop-blur-sm">
                      <Maximize2 size={12} />
                      {locale === 'fr' ? 'Plein écran' : 'Full screen'}
                    </div>
                  </div>
                )}

                {/* Overlay "+N photos" sur la dernière cellule visible */}
                {isLastVisible && (
                  <div
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2"
                    onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
                  >
                    <Grid size={24} className="text-white" />
                    <span className="text-white font-semibold text-base">
                      +{sorted.length - 9} photos
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Barre inférieure */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{sorted.length} média{sorted.length > 1 ? 's' : ''}</span>
          <div className="flex gap-3">
            {showAll && hasMore && (
              <button onClick={() => setShowAll(false)} className="text-[#B08B52] hover:underline font-medium">
                {locale === 'fr' ? 'Réduire' : 'Show less'}
              </button>
            )}
            {!showAll && hasMore && (
              <button onClick={() => setShowAll(true)} className="text-[#B08B52] hover:underline font-medium">
                {locale === 'fr' ? `Voir les ${sorted.length} médias` : `View all ${sorted.length} media`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && current && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Fermer */}
          <button
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-colors"
            onClick={closeLightbox}
            aria-label="Fermer"
          >
            <X size={22} />
          </button>

          {/* Précédent */}
          {sorted.length > 1 && (
            <button
              className="absolute left-4 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Précédent"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Contenu */}
          <div
            className="relative w-full max-w-5xl mx-20 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideoUrl(current.url) ? (
              <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  src={getVideoEmbedUrl(current.url)}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={getAlt(current, lightboxIndex)}
                />
              </div>
            ) : (
              <div className="relative w-full flex items-center justify-center" style={{ height: '80vh' }}>
                <SafeImg
                  src={current.url}
                  alt={getAlt(current, lightboxIndex)}
                  className="!object-contain !scale-100 max-h-full"
                  priority
                />
              </div>
            )}

            {/* Légende */}
            {(locale === 'fr' ? current.alt_fr : current.alt_en) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white text-sm text-center rounded-b-xl">
                {locale === 'fr' ? current.alt_fr : current.alt_en}
              </div>
            )}
          </div>

          {/* Suivant */}
          {sorted.length > 1 && (
            <button
              className="absolute right-4 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Suivant"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Compteur + miniatures */}
          <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-3">
            <span className="text-white/70 text-sm">{lightboxIndex + 1} / {sorted.length}</span>
            <div className="flex gap-1.5 overflow-x-auto max-w-lg px-4 pb-1">
              {sorted.map((item, i) => {
                const isVideo = isVideoUrl(item.url);
                const thumb = isVideo ? getVideoThumbnail(item.url) : item.url;
                return (
                  <button
                    key={item.id}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    className={`relative flex-shrink-0 w-12 h-9 rounded overflow-hidden transition-all ${
                      i === lightboxIndex ? 'ring-2 ring-[#B08B52] opacity-100' : 'opacity-50 hover:opacity-80'
                    }`}
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <Play size={10} className="text-white" />
                      </div>
                    )}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play size={8} className="text-white" fill="currentColor" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
