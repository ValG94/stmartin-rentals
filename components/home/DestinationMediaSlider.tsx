'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import type { DestinationMedia } from '@/types';

interface Props {
  media: DestinationMedia[];
  locale: string;
  /** Hauteur desktop (la mosaïque actuelle utilise 450px) */
  desktopHeightPx?: number;
  /** Délai entre slides en ms — 0 désactive l'autoplay */
  autoplayMs?: number;
}

/**
 * Slider premium pour la section "The Destination" de la homepage.
 *
 * Caractéristiques :
 *  - Transition fade (rendu éditorial vs slide cheap)
 *  - Autoplay 6s par défaut, pause au hover/touch
 *  - Swipe horizontal sur mobile
 *  - Dots bronze subtils en bas à droite
 *  - Flèches discrètes au hover sur desktop (cachées sur mobile)
 *  - Vidéos : autoplay muté, looping, contrôle volume optionnel
 *  - Légende/titre overlay en bas-gauche si renseignés
 *  - Aucun contrôle si un seul média (pas de carrousel inutile)
 */
export default function DestinationMediaSlider({
  media,
  locale,
  desktopHeightPx = 450,
  autoplayMs = 6000,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const dragRef = useRef<{ startX: number; moved: boolean } | null>(null);
  const isFr = locale === 'fr';

  const count = media.length;
  const hasMultiple = count > 1;

  const goTo = useCallback((i: number) => {
    setActiveIdx(((i % count) + count) % count);
  }, [count]);

  const next = useCallback(() => goTo(activeIdx + 1), [goTo, activeIdx]);
  const prev = useCallback(() => goTo(activeIdx - 1), [goTo, activeIdx]);

  // Autoplay — pausé au hover / touch / si l'utilisateur a navigué récemment
  useEffect(() => {
    if (!hasMultiple || autoplayMs <= 0 || paused) return;
    const timer = setTimeout(next, autoplayMs);
    return () => clearTimeout(timer);
  }, [activeIdx, paused, hasMultiple, autoplayMs, next]);

  // Swipe handlers
  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    if (Math.abs(e.clientX - dragRef.current.startX) > 8) dragRef.current.moved = true;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    dragRef.current = null;
    if (!hasMultiple) return;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
  };

  if (count === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden group bg-night-100"
      style={{ height: `${desktopHeightPx}px` }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Slides empilées en fade */}
      {media.map((item, i) => (
        <Slide
          key={item.id}
          item={item}
          isActive={i === activeIdx}
          isFr={isFr}
          muted={muted}
        />
      ))}

      {/* Overlay titre + légende sur le slide actif (si renseignés) */}
      {hasCaption(media[activeIdx], isFr) && (
        <div
          key={`caption-${media[activeIdx].id}`}
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none bg-gradient-to-t from-black/60 via-black/10 to-transparent p-6 md:p-8"
        >
          <div className="max-w-md text-white">
            {(isFr ? media[activeIdx].title_fr : media[activeIdx].title_en) && (
              <p className="font-serif text-lg md:text-xl font-light leading-tight mb-1 drop-shadow-md">
                {isFr ? media[activeIdx].title_fr : media[activeIdx].title_en}
              </p>
            )}
            {(isFr ? media[activeIdx].caption_fr : media[activeIdx].caption_en) && (
              <p className="font-sans text-xs md:text-sm font-light text-white/85 leading-relaxed drop-shadow-md">
                {isFr ? media[activeIdx].caption_fr : media[activeIdx].caption_en}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bouton mute si vidéo active */}
      {media[activeIdx].media_type === 'video' && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
          className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/90 hover:bg-black/50 hover:text-white transition-colors"
          aria-label={muted ? (isFr ? 'Activer le son' : 'Unmute') : (isFr ? 'Couper le son' : 'Mute')}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      )}

      {/* Flèches navigation — visibles uniquement si plusieurs médias, au hover sur desktop */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-cream-100/85 backdrop-blur-sm text-night-600 opacity-0 group-hover:opacity-100 hover:bg-cream-100 transition-all duration-300"
            aria-label={isFr ? 'Précédent' : 'Previous'}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center rounded-full bg-cream-100/85 backdrop-blur-sm text-night-600 opacity-0 group-hover:opacity-100 hover:bg-cream-100 transition-all duration-300"
            aria-label={isFr ? 'Suivant' : 'Next'}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dots discrets en bas à droite */}
      {hasMultiple && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5">
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              aria-label={`${isFr ? 'Slide' : 'Slide'} ${i + 1}`}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === activeIdx
                  ? 'w-6 bg-bronze-400'
                  : 'w-1 bg-cream-100/70 hover:bg-cream-100'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sous-composant slide ─────────────────────────────────────────────────────

function Slide({
  item,
  isActive,
  isFr,
  muted,
}: {
  item: DestinationMedia;
  isActive: boolean;
  isFr: boolean;
  muted: boolean;
}) {
  const alt = (isFr ? item.alt_fr : item.alt_en) || (isFr ? item.title_fr : item.title_en) || '';

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isActive}
    >
      {item.media_type === 'video' ? (
        <video
          src={item.media_url}
          poster={item.thumbnail_url ?? undefined}
          autoPlay
          muted={muted}
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.media_url}
          alt={alt}
          className="w-full h-full object-cover"
          loading={isActive ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
}

function hasCaption(item: DestinationMedia, isFr: boolean): boolean {
  const title = isFr ? item.title_fr : item.title_en;
  const caption = isFr ? item.caption_fr : item.caption_en;
  return Boolean(title || caption);
}
