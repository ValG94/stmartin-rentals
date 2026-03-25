'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Play, Grid, Maximize2 } from 'lucide-react';

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  alt?: string;
  caption?: string;
}

interface ImageGalleryProps {
  images: string[];
  alt: string;
  mediaItems?: MediaItem[];
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

function getVideoThumbnail(url: string): string {
  const ytId = getYouTubeId(url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
  return '';
}

function getVideoEmbedUrl(url: string): string {
  const ytId = getYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
  const vimeoId = getVimeoId(url);
  if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
  return url;
}

export default function ImageGallery({ images, alt, mediaItems }: ImageGalleryProps) {
  const allMedia: MediaItem[] = mediaItems
    ? mediaItems
    : images.map((url) => ({ type: 'image' as const, url, alt }));

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + allMedia.length) % allMedia.length : 0)),
    [allMedia.length]
  );
  const next = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % allMedia.length : 0)),
    [allMedia.length]
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

  const displayedMedia = showAll ? allMedia : allMedia.slice(0, 9);
  const hasMore = allMedia.length > 9;
  const currentItem = lightboxIndex !== null ? allMedia[lightboxIndex] : null;

  if (allMedia.length === 0) return null;

  return (
    <>
      {/* ── Grille de médias ── */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-2xl overflow-hidden">
          {displayedMedia.map((item, i) => {
            const isFirst = i === 0;
            const isLastVisible = !showAll && i === 8 && hasMore;
            const thumb = item.type === 'video'
              ? (item.thumbnail || getVideoThumbnail(item.url))
              : item.url;

            return (
              <div
                key={i}
                className={`relative cursor-pointer overflow-hidden group ${isFirst ? 'col-span-2 row-span-2' : ''}`}
                style={{ height: isFirst ? '400px' : '180px' }}
                onClick={() => !isLastVisible && setLightboxIndex(i)}
              >
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={item.alt || `${alt} ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes={isFirst ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 50vw, 33vw'}
                    priority={i === 0}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <Play size={40} className="text-white/60" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play size={22} className="text-gray-900 ml-1" fill="currentColor" />
                    </div>
                  </div>
                )}

                {isLastVisible && (
                  <div
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2"
                    onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
                  >
                    <Grid size={24} className="text-white" />
                    <span className="text-white font-semibold text-base">+{allMedia.length - 9} photos</span>
                  </div>
                )}

                {isFirst && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 text-white rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 backdrop-blur-sm">
                      <Maximize2 size={12} />
                      Plein écran
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{allMedia.length} média{allMedia.length > 1 ? 's' : ''}</span>
          <div className="flex gap-3">
            {showAll && hasMore && (
              <button onClick={() => setShowAll(false)} className="text-[#B08B52] hover:underline font-medium">
                Réduire
              </button>
            )}
            {!showAll && hasMore && (
              <button onClick={() => setShowAll(true)} className="text-[#B08B52] hover:underline font-medium">
                Voir les {allMedia.length} médias
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && currentItem && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-colors"
            onClick={closeLightbox}
            aria-label="Fermer"
          >
            <X size={22} />
          </button>

          {allMedia.length > 1 && (
            <button
              className="absolute left-4 z-10 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Précédent"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <div
            className="relative w-full max-w-5xl mx-20 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {currentItem.type === 'video' ? (
              <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
                <iframe
                  src={getVideoEmbedUrl(currentItem.url)}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={currentItem.alt || `Vidéo ${lightboxIndex + 1}`}
                />
              </div>
            ) : (
              <div className="relative w-full" style={{ height: '80vh' }}>
                <Image
                  src={currentItem.url}
                  alt={currentItem.alt || `${alt} ${lightboxIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
            )}
            {currentItem.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white text-sm text-center rounded-b-xl">
                {currentItem.caption}
              </div>
            )}
          </div>

          {allMedia.length > 1 && (
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
            <span className="text-white/70 text-sm">{lightboxIndex + 1} / {allMedia.length}</span>
            <div className="flex gap-1.5 overflow-x-auto max-w-lg px-4 pb-1">
              {allMedia.map((item, i) => {
                const thumb = item.type === 'video'
                  ? (item.thumbnail || getVideoThumbnail(item.url))
                  : item.url;
                return (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    className={`relative flex-shrink-0 w-12 h-9 rounded overflow-hidden transition-all ${
                      i === lightboxIndex ? 'ring-2 ring-[#B08B52] opacity-100' : 'opacity-50 hover:opacity-80'
                    }`}
                  >
                    {thumb ? (
                      <Image src={thumb} alt="" fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <Play size={10} className="text-white" />
                      </div>
                    )}
                    {item.type === 'video' && (
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
