'use client';

import { useState } from 'react';
import type { GuideItem } from '@/lib/api-guide';
import GuideIcon from './GuideIcon';
import { Phone, MessageCircle, Globe, MapPin, Mail, ChevronDown, ChevronUp } from 'lucide-react';

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

// ── Activity Card ─────────────────────────────────────────────
function ActivityCard({ item, isFr }: { item: GuideItem; isFr: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const meta = item.meta_json ?? {};
  const tip = isFr ? (meta.tip_fr as string) : (meta.tip_en as string);
  const duration = isFr ? (meta.duration_fr as string) : (meta.duration_en as string);
  const iconName = (meta.icon as string) ?? item.icon_name;
  const category = isFr ? item.category_fr : item.category_en;
  const badge = isFr ? item.badge_fr : item.badge_en;
  const content = isFr ? item.content_fr : item.content_en;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Image */}
      {item.image_url && (
        <div className="h-40 overflow-hidden">
          <img src={item.image_url} alt={isFr ? item.title_fr ?? '' : item.title_en ?? ''} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D1B2A] flex items-center justify-center flex-shrink-0">
              <GuideIcon name={iconName} size={18} className="text-[#B08B52]" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                {isFr ? item.title_fr : item.title_en}
              </h4>
              {category && (
                <span className="text-[10px] text-[#B08B52] font-medium uppercase tracking-wider">{category}</span>
              )}
            </div>
          </div>
          {badge && (
            <span className="flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#B08B52]/10 text-[#B08B52] border border-[#B08B52]/20">
              {badge}
            </span>
          )}
        </div>

        {content && (
          <p className="text-sm text-gray-600 leading-relaxed mb-3">{content}</p>
        )}

        <div className="flex items-center justify-between">
          {duration && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <GuideIcon name="clock" size={12} className="text-gray-400" />
              {duration}
            </span>
          )}
          {tip && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-[#B08B52] font-medium hover:text-[#8C6A38] transition-colors"
            >
              Conseil {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {tip && expanded && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-xs text-amber-800 leading-relaxed">💡 {tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Itinerary Day ─────────────────────────────────────────────
function ItineraryDayItem({ item, isFr }: { item: GuideItem; isFr: boolean }) {
  const meta = item.meta_json ?? {};
  const day = meta.day as number;
  const content = isFr ? item.content_fr : item.content_en;

  return (
    <div className="flex gap-4">
      {/* Timeline dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-[#0D1B2A] border-2 border-[#B08B52] flex items-center justify-center">
          <span className="text-[#B08B52] text-xs font-bold">{day}</span>
        </div>
        <div className="flex-1 w-px bg-gray-200 mt-2" />
      </div>
      {/* Content */}
      <div className="flex-1 pb-6">
        <h4 className="font-semibold text-gray-900 text-sm mb-1">
          {isFr ? item.title_fr : item.title_en}
        </h4>
        {content && (
          <p className="text-sm text-gray-500 leading-relaxed">{content}</p>
        )}
      </div>
    </div>
  );
}

// ── Contact / Partner ─────────────────────────────────────────
function ContactItem({ item, isFr }: { item: GuideItem; isFr: boolean }) {
  const content = isFr ? item.content_fr : item.content_en;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#0D1B2A] flex items-center justify-center flex-shrink-0">
          <GuideIcon name={item.icon_name} size={16} className="text-[#B08B52]" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">{isFr ? item.title_fr : item.title_en}</h4>
          {item.category_fr && (
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
              {isFr ? item.category_fr : item.category_en}
            </span>
          )}
        </div>
      </div>
      {content && <p className="text-sm text-gray-600 mb-3 leading-relaxed">{content}</p>}
      <div className="flex flex-wrap gap-2">
        {item.phone && (
          <a href={`tel:${item.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-[#0D1B2A] hover:text-white transition-colors">
            <Phone size={12} /> {item.phone}
          </a>
        )}
        {item.whatsapp && (
          <a href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-600 hover:text-white transition-colors">
            <MessageCircle size={12} /> WhatsApp
          </a>
        )}
        {item.email && (
          <a href={`mailto:${item.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-[#0D1B2A] hover:text-white transition-colors">
            <Mail size={12} /> Email
          </a>
        )}
        {item.website_url && (
          <a href={item.website_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-[#0D1B2A] hover:text-white transition-colors">
            <Globe size={12} /> Site web
          </a>
        )}
        {item.map_url && (
          <a href={item.map_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#B08B52]/10 text-[#B08B52] text-xs font-medium hover:bg-[#B08B52] hover:text-white transition-colors">
            <MapPin size={12} /> Maps
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
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <GuideIcon name={item.icon_name} size={14} className="text-gray-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{isFr ? item.title_fr : item.title_en}</p>
        {content && <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{content}</p>}
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
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-[#0D1B2A] text-[#0D1B2A] text-sm font-semibold hover:bg-[#0D1B2A] hover:text-white transition-all">
      <GuideIcon name={item.icon_name} size={16} />
      {label}
    </a>
  );
}

// ── Info Card (generic) ───────────────────────────────────────
function InfoCardItem({ item, isFr }: { item: GuideItem; isFr: boolean }) {
  const content = isFr ? item.content_fr : item.content_en;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <GuideIcon name={item.icon_name} size={15} className="text-[#B08B52]" />
        </div>
        <h4 className="font-semibold text-gray-900 text-sm">{isFr ? item.title_fr : item.title_en}</h4>
      </div>
      {content && <p className="text-sm text-gray-600 leading-relaxed">{content}</p>}
      {item.image_url && (
        <img src={item.image_url} alt="" className="mt-3 w-full rounded-xl object-cover h-32" />
      )}
    </div>
  );
}
