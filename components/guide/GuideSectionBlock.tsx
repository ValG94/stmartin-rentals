import type { GuideSection } from '@/lib/api-guide';
import { sanitizeRichHtml } from '@/lib/services/sanitize';
import GuideIcon from './GuideIcon';
import GuideItemRenderer from './GuideItemRenderer';

interface GuideSectionBlockProps {
  section: GuideSection;
  locale: string;
}

export default function GuideSectionBlock({ section, locale }: GuideSectionBlockProps) {
  const isFr = locale === 'fr';
  const items = section.items ?? [];

  const visibleItems   = items.filter(i => i.is_visible !== false);
  const activityItems  = visibleItems.filter(i => i.item_type === 'activity_card');
  const itineraryItems = visibleItems.filter(i => i.item_type === 'itinerary_day');
  const otherItems     = visibleItems.filter(i => i.item_type !== 'activity_card' && i.item_type !== 'itinerary_day');

  // Section type routing
  const sectionType = section.section_type ?? 'generic';
  const isActivities = sectionType === 'activities';
  const isItinerary  = sectionType === 'itinerary';
  // Legacy: old "explore" type contained both — keep rendering both
  const isExplore    = sectionType === 'explore' || section.section_key === 'explore_saint_martin';

  const title    = isFr ? section.title_fr    : section.title_en;
  const subtitle = isFr ? section.subtitle_fr : section.subtitle_en;
  const intro    = isFr ? section.intro_fr    : section.intro_en;

  return (
    <section>

      {/* ── Section header ───────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#0D1B2A] flex items-center justify-center flex-shrink-0">
            <GuideIcon name={section.icon_name} size={18} className="text-[#B08B52]" />
          </div>
          <div className="flex-1">
            {subtitle && (
              <p className="text-[10px] font-semibold text-[#B08B52] uppercase tracking-[0.3em] mb-1">
                {subtitle}
              </p>
            )}
            <h2 className="font-serif text-2xl font-light text-[#0D1B2A] leading-tight">
              {title}
            </h2>
          </div>
        </div>

        {/* Intro — pleine largeur, rendu HTML riche depuis WYSIWYG (sanitisé) */}
        {intro && (
          <div
            className="guide-rich-text text-sm text-stone-600 leading-relaxed font-light w-full"
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(intro) }}
          />
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION TYPE : activities
          Grille de cards d'activités uniquement
      ══════════════════════════════════════════════════════════ */}
      {isActivities && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.3em] whitespace-nowrap">
              {isFr ? 'Activités & excursions' : 'Activities & excursions'}
            </p>
            <div className="h-px flex-1 bg-stone-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {activityItems.map(item => (
              <GuideItemRenderer key={item.id} item={item} locale={locale} />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECTION TYPE : itinerary
          Timeline 7 jours — intro déjà affichée dans le header
      ══════════════════════════════════════════════════════════ */}
      {isItinerary && (
        <div className="pl-0">
          {itineraryItems.map((item, idx) => (
            <GuideItemRenderer
              key={item.id}
              item={item}
              locale={locale}
              isLast={idx === itineraryItems.length - 1}
            />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECTION TYPE : explore (legacy — activités + itinéraire)
      ══════════════════════════════════════════════════════════ */}
      {isExplore && (
        <div className="space-y-12">
          {activityItems.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.3em] whitespace-nowrap">
                  {isFr ? 'Activités & excursions' : 'Activities & excursions'}
                </p>
                <div className="h-px flex-1 bg-stone-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {activityItems.map(item => (
                  <GuideItemRenderer key={item.id} item={item} locale={locale} />
                ))}
              </div>
            </div>
          )}
          {itineraryItems.length > 0 && (
            <div className="pl-0">
              {itineraryItems.map((item, idx) => (
                <GuideItemRenderer
                  key={item.id}
                  item={item}
                  locale={locale}
                  isLast={idx === itineraryItems.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECTION TYPE : generic / contacts / house_rules
      ══════════════════════════════════════════════════════════ */}
      {!isActivities && !isItinerary && !isExplore && (
        <div>
          {otherItems.some(i => i.item_type === 'house_rule') ? (
            /* House rules — liste contenue */
            <div className="bg-white rounded-3xl border border-stone-100 px-6 py-2 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              {otherItems.map(item => (
                <GuideItemRenderer key={item.id} item={item} locale={locale} />
              ))}
            </div>
          ) : (
            /* Autres items — grille 2 colonnes */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherItems.map(item => (
                <GuideItemRenderer key={item.id} item={item} locale={locale} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Separator ────────────────────────────────────────────── */}
      <div className="mt-14 flex items-center gap-4">
        <div className="h-px flex-1 bg-stone-100" />
        <div className="w-1 h-1 rounded-full bg-stone-200" />
        <div className="h-px w-8 bg-stone-100" />
      </div>
    </section>
  );
}
