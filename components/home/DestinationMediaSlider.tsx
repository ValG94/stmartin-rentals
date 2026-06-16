'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import type { DestinationMedia } from '@/types';

interface Props {
  media: DestinationMedia[];
  locale: string;
  /** Délai entre slides en ms — 0 désactive l'autoplay */
  autoplayMs?: number;
}

/**
 * Slider premium éditorial pour la section "The Destination" de la home.
 *
 * Direction visuelle : luxury hospitality, calm, refined.
 * - Transition fade 1400ms (rendu magazine vs slide-cheap)
 * - Autoplay 7s, pause au hover/touch
 * - Swipe horizontal sur mobile
 * - Frame : hairline cream interne + shadow d'élévation discrète
 * - Caption éditoriale : label bronze uppercase + hairline + serif italic
 * - Flèches : backdrop-blur, stroke fin 1.5, slide-in au hover (desktop only)
 * - Dots : hairlines horizontales 1px (40px bronze actif / 12px cream inactif)
 * - Compteur "01 / 03" discret en haut-gauche pour repère
 * - Aucun contrôle si un seul média (pas de carrousel inutile)
 */
export default function DestinationMediaSlider({
  media,
  locale,
  autoplayMs = 7000,
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

  // Autoplay — pausé au hover / touch
  useEffect(() => {
    if (!hasMultiple || autoplayMs <= 0 || paused) return;
    const timer = setTimeout(next, autoplayMs);
    return () => clearTimeout(timer);
  }, [activeIdx, paused, hasMultiple, autoplayMs, next]);

  // Swipe handlers (Pointer Events unifient souris + tactile)
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

  const current = media[activeIdx];
  const hasCaption =
    Boolean(isFr ? current.title_fr : current.title_en) ||
    Boolean(isFr ? current.caption_fr : current.caption_en);

  return (
    <div
      className="relative w-full h-full overflow-hidden group bg-night-100"
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

      {/* Frame intérieur : hairline cream très discret pour effet "encadré" */}
      <div className="absolute inset-0 z-30 pointer-events-none ring-1 ring-inset ring-cream-100/15" />

      {/* Compteur 01/03 — haut-gauche, micro-typographique */}
      {hasMultiple && (
        <div
          className="absolute top-5 left-5 md:top-6 md:left-6 z-20 font-sans text-[10px] md:text-[11px] uppercase text-cream-100/75 pointer-events-none"
          style={{ letterSpacing: '0.25em' }}
        >
          <span className="text-bronze-300 font-medium">{String(activeIdx + 1).padStart(2, '0')}</span>
          <span className="mx-2 text-cream-100/40">/</span>
          <span>{String(count).padStart(2, '0')}</span>
        </div>
      )}

      {/* Bouton mute (vidéo uniquement) */}
      {current.media_type === 'video' && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
          className="absolute top-5 right-5 md:top-6 md:right-6 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-night-600/25 backdrop-blur-md text-cream-100 hover:bg-night-600/45 transition-colors duration-500"
          aria-label={muted ? (isFr ? 'Activer le son' : 'Unmute') : (isFr ? 'Couper le son' : 'Mute')}
        >
          {muted ? <VolumeX size={14} strokeWidth={1.75} /> : <Volume2 size={14} strokeWidth={1.75} />}
        </button>
      )}

      {/* Caption éditoriale : pastille night + serif italic
          Le label devient une chip night-600/80 avec backdrop-blur — toujours
          lisible peu importe le contraste de la photo (clair, sombre, vidéo
          qui change). Accent bronze conservé via un mini-point. */}
      {hasCaption && (
        <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
          {/* Gradient doux — night plutôt que black pur, plus aligné brand */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-night-600/55 via-night-600/10 to-transparent" />

          <div className="relative p-7 md:p-10 max-w-lg">
            {(isFr ? current.title_fr : current.title_en) && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-4 rounded-full bg-night-600/80 backdrop-blur-md">
                <span className="w-1 h-1 rounded-full bg-bronze-300 flex-shrink-0" aria-hidden="true" />
                <span
                  className="font-sans text-[10px] md:text-[11px] uppercase font-medium text-cream-100"
                  style={{ letterSpacing: '0.22em' }}
                >
                  {isFr ? current.title_fr : current.title_en}
                </span>
              </div>
            )}
            {(isFr ? current.caption_fr : current.caption_en) && (
              <p
                className="font-serif text-lg md:text-xl italic font-light text-cream-100 leading-snug"
                style={{
                  letterSpacing: '-0.005em',
                  textShadow: '0 1px 12px rgba(13,27,42,0.45), 0 1px 2px rgba(13,27,42,0.35)',
                }}
              >
                {isFr ? current.caption_fr : current.caption_en}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Flèches navigation — backdrop blur subtil, slide-in au hover */}
      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-night-600/25 backdrop-blur-md text-cream-100 opacity-0 group-hover:opacity-100 hover:bg-night-600/45 hover:-translate-x-0.5 transition-all duration-700 -translate-y-1/2"
            aria-label={isFr ? 'Précédent' : 'Previous'}
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-night-600/25 backdrop-blur-md text-cream-100 opacity-0 group-hover:opacity-100 hover:bg-night-600/45 hover:translate-x-0.5 transition-all duration-700 -translate-y-1/2"
            aria-label={isFr ? 'Suivant' : 'Next'}
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </>
      )}

      {/* Dots : hairlines horizontales 1px, bronze active vs cream inactif */}
      {hasMultiple && (
        <div className="absolute bottom-5 right-5 md:bottom-6 md:right-6 z-20 flex items-center gap-3">
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={(e) => { e.stopPropagation(); goTo(i); }}
              aria-label={`${isFr ? 'Aller au slide' : 'Go to slide'} ${i + 1}`}
              className="group/dot py-2 px-0.5"
            >
              <span
                className={`block h-px transition-all duration-700 ease-out ${
                  i === activeIdx
                    ? 'w-10 bg-bronze-300'
                    : 'w-3 bg-cream-100/40 group-hover/dot:bg-cream-100/75'
                }`}
              />
            </button>
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
      className={`absolute inset-0 transition-opacity ease-out ${
        isActive ? 'opacity-100 duration-[1400ms]' : 'opacity-0 duration-[800ms] pointer-events-none'
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
