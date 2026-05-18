'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { GuideItem } from '@/lib/api-guide';
import GuideIcon from './GuideIcon';
import { Phone, MessageCircle, Globe, MapPin, Mail, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface GuideItemRendererProps {
  item: GuideItem;
  locale: string;
}

export default function GuideItemRenderer({ item, locale }: GuideItemRendererProps) {
  const isFr = locale === 'fr';

  switch (item.item_type) {
    case 'activity_card':
      return <ActivityCard item={item} isFr={isFr} />;
    case 'itinerary_day':
      return <ItineraryDayItem item={item} isFr={isFr} />;
    case 'contact':
    case 'partner':
      return <ContactItem item={item} isFr={isFr} />;
    case 'house_rule':
      return <HouseRuleItem item={item} isFr={isFr} />;
    case 'button_link':
      return <ButtonLinkItem item={item} isFr={isFr} />;
    default:
      return <InfoCardItem item={item} isFr={isFr} />;
  }
}

// ── Activity Card — luxury travel editorial ───────────────────
function ActivityCard({ item, isFr }: { item: GuideItem; isFr: boolean }) {
  const [tipOpen, setTipOpen] = useState(false);
  const meta = item.meta_json ?? {};
  const tip = isFr ? (meta.tip_fr as string) : (meta.tip_en as string);
  const duration = isFr ? (meta.duration_fr as string) : (meta.duration_en as string);
  const iconName = (meta.icon as string) ?? item.icon_name;
  const category = isFr ? item.category_fr : item.category_en;
  const badge = isFr ? item.badge_fr : item.badge_en;
  const content = isFr ? item.content_fr : item.content_en;
  const title = isFr ? item.title_fr : item.title_en;
  const hasContact = item.phone || item.whatsapp || item.email || item.website_url || item.map_url;

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] transition-all duration-400 flex flex-col">

      {/* Image — immersive, tall */}
      {item.image_url ? (
        <div className="relative h-52 overflow-hidden">
          <Image
            src={item.image_url}
            alt={title ?? ''}
            fill
            className="object-cover transition-transform duration-700 hover:scale-105"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,27,42,0.55) 0%, transparent 55%)' }} />
          {/* Badge on image */}
          {badge && (
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#B08B52] text-white tracking-wide">
                {badge}
              </span>
            </div>
          )}
          {/* Category on image bottom */}
          {category && (
            <div className="absolute bottom-3 left-4">
              <span className="text-[10px] font-semibold text-white/80 uppercase tracking-[0.2em]">
                {category}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* No image — colored header band */
        <div className="h-20 flex items-end px-5 pb-4" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1a2e42 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#B08B52]/20 flex items-center justify-center flex-shrink-0">
              <GuideIcon name={iconName} size={17} className="text-[#B08B52]" />
            </div>
            {category && (
              <span className="text-[10px] font-semibold text-white/60 uppercase tracking-[0.2em]">{category}</span>
            )}
          </div>
          {badge && (
            <span className="ml-auto text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#B08B52] text-white tracking-wide">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">

        {/* Icon + title (only shown when no image, since category/badge are on the image) */}
        <div className="flex items-start gap-3 mb-3">
          {item.image_url && (
            <div className="w-9 h-9 rounded-xl bg-[#0D1B2A] flex items-center justify-center flex-shrink-0 mt-0.5">
              <GuideIcon name={iconName} size={16} className="text-[#B08B52]" />
            </div>
          )}
          <h4 className="font-serif text-base font-semibold text-[#0D1B2A] leading-snug flex-1">
            {title}
          </h4>
        </div>

        {/* Description */}
        {content && (
          <p className="text-sm text-stone-500 leading-relaxed mb-4 font-light">{content}</p>
        )}

        {/* Duration + Tip toggle */}
        {(duration || tip) && (
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-stone-100">
            {duration ? (
              <span className="flex items-center gap-1.5 text-xs text-stone-400 font-light">
                <GuideIcon name="clock" size={12} className="text-stone-300" />
                {duration}
              </span>
            ) : <span />}
            {tip && (
              <button
                onClick={() => setTipOpen(o => !o)}
                className="flex items-center gap-1 text-xs text-[#B08B52] font-medium hover:text-[#8C6A38] transition-colors"
              >
                {isFr ? 'Conseil' : 'Tip'} {tipOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
          </div>
        )}

        {/* Tip expandable */}
        {tip && tipOpen && (
          <div className="mt-3 p-3.5 rounded-2xl" style={{ background: 'rgba(176,139,82,0.07)', borderLeft: '2px solid rgba(176,139,82,0.4)' }}>
            <p className="text-xs text-stone-600 leading-relaxed font-light">{tip}</p>
          </div>
        )}

        {/* Contact buttons */}
        {hasContact && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-100">
            {item.phone && (
              <a href={`tel:${item.phone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-medium hover:bg-[#0D1B2A] hover:text-white transition-all">
                <Phone size={11} /> {item.phone}
              </a>
            )}
            {item.whatsapp && (
              <a href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-600 hover:text-white transition-all">
                <MessageCircle size={11} /> WhatsApp
              </a>
            )}
            {item.email && (
              <a href={`mailto:${item.email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-medium hover:bg-[#0D1B2A] hover:text-white transition-all">
                <Mail size={11} /> Email
              </a>
            )}
            {item.website_url && (
              <a href={item.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-medium hover:bg-[#0D1B2A] hover:text-white transition-all">
                <Globe size={11} /> {isFr ? 'Site web' : 'Website'}
              </a>
            )}
            {item.map_url && (
              <a href={item.map_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: 'rgba(176,139,82,0.1)', color: '#B08B52' }}>
                <MapPin size={11} /> Maps
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Itinerary Day — timeline premium ─────────────────────────
function ItineraryDayItem({ item, isFr }: { item: GuideItem; isFr: boolean }) {
  const meta = item.meta_json ?? {};
  const day = meta.day as number;
  const content = isFr ? item.content_fr : item.content_en;

  return (
    <div className="flex gap-5 group">
      {/* Timeline */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#B08B52]/30 bg-white group-hover:border-[#B08B52] group-hover:bg-[#B08B52]/5 transition-all">
          <span className="text-[#B08B52] text-xs font-semibold">{day}</span>
        </div>
        <div className="flex-1 w-px bg-stone-100 mt-2 group-last:hidden" />
      </div>
      {/* Content */}
      <div className="flex-1 pb-7">
        <h4 className="font-serif text-sm font-semibold text-[#0D1B2A] mb-1.5 leading-snug">
          {isFr ? item.title_fr : item.title_en}
        </h4>
        {content && (
          <p className="text-sm text-stone-500 leading-relaxed font-light">{content}</p>
        )}
      </div>
    </div>
  );
}

// ── Contact / Partner ─────────────────────────────────────────
function ContactItem({ item, isFr }: { item: GuideItem; isFr: boolean }) {
  const content = isFr ? item.content_fr : item.content_en;
  const category = isFr ? item.category_fr : item.category_en;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-[#0D1B2A] flex items-center justify-center flex-shrink-0">
          <GuideIcon name={item.icon_name} size={18} className="text-[#B08B52]" />
        </div>
        <div>
          <h4 className="font-serif text-sm font-semibold text-[#0D1B2A] leading-snug">
            {isFr ? item.title_fr : item.title_en}
          </h4>
          {category && (
            <span className="text-[10px] text-stone-400 font-medium uppercase tracking-[0.15em] mt-0.5 block">
              {category}
            </span>
          )}
        </div>
      </div>
      {content && (
        <p className="text-sm text-stone-500 leading-relaxed font-light mb-4">{content}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {item.phone && (
          <a href={`tel:${item.phone}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-medium hover:bg-[#0D1B2A] hover:text-white transition-all">
            <Phone size={11} /> {item.phone}
          </a>
        )}
        {item.whatsapp && (
          <a href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-600 hover:text-white transition-all">
            <MessageCircle size={11} /> WhatsApp
          </a>
        )}
        {item.email && (
          <a href={`mailto:${item.email}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-medium hover:bg-[#0D1B2A] hover:text-white transition-all">
            <Mail size={11} /> Email
          </a>
        )}
        {item.website_url && (
          <a href={item.website_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-medium hover:bg-[#0D1B2A] hover:text-white transition-all">
            <Globe size={11} /> {isFr ? 'Site web' : 'Website'}
          </a>
        )}
        {item.map_url && (
          <a href={item.map_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: 'rgba(176,139,82,0.1)', color: '#B08B52' }}>
            <MapPin size={11} /> Maps
          </a>
        )}
      </div>
    </div>
  );
}

// ── House Rule ────────────────────────────────────────────────
function HouseRuleItem({ item, isFr }: { item: GuideItem; isFr: boolean }) {
  const content = isFr ? item.content_fr : item.content_en;
  return (
    <div className="flex gap-4 py-4 border-b border-stone-100 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <GuideIcon name={item.icon_name} size={15} className="text-stone-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#0D1B2A] mb-0.5">
          {isFr ? item.title_fr : item.title_en}
        </p>
        {content && (
          <p className="text-sm text-stone-500 leading-relaxed font-light">{content}</p>
        )}
      </div>
    </div>
  );
}

// ── Button Link ───────────────────────────────────────────────
function ButtonLinkItem({ item, isFr }: { item: GuideItem; isFr: boolean }) {
  const label = isFr ? (item.cta_label_fr ?? item.title_fr) : (item.cta_label_en ?? item.title_en);
  const href = item.external_url ?? item.website_url ?? item.map_url ?? '#';
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl border border-[#0D1B2A] text-[#0D1B2A] text-sm font-medium tracking-wide hover:bg-[#0D1B2A] hover:text-white transition-all group">
      <GuideIcon name={item.icon_name} size={15} />
      {label}
      <ExternalLink size={12} className="opacity-40 group-hover:opacity-70 transition-opacity" />
    </a>
  );
}

// ── Info Card (generic) ───────────────────────────────────────
function InfoCardItem({ item, isFr }: { item: GuideItem; isFr: boolean }) {
  const content = isFr ? item.content_fr : item.content_en;
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
          <GuideIcon name={item.icon_name} size={16} className="text-[#B08B52]" />
        </div>
        <h4 className="font-serif text-sm font-semibold text-[#0D1B2A]">
          {isFr ? item.title_fr : item.title_en}
        </h4>
      </div>
      {content && (
        <p className="text-sm text-stone-500 leading-relaxed font-light">{content}</p>
      )}
      {item.image_url && (
        <div className="relative mt-4 h-36 rounded-2xl overflow-hidden">
          <Image src={item.image_url} alt="" fill className="object-cover" sizes="100vw" />
        </div>
      )}
    </div>
  );
}
