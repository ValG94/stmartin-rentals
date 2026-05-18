import type { GuideSection } from '@/lib/api-guide';
import GuideIcon from './GuideIcon';
import GuideItemRenderer from './GuideItemRenderer';

interface GuideSectionBlockProps {
  section: GuideSection;
  locale: string;
}

export default function GuideSectionBlock({ section, locale }: GuideSectionBlockProps) {
  const isFr = locale === 'fr';
  const items = section.items ?? [];
  const activityItems = items.filter(i => i.item_type === 'activity_card');
  const itineraryItems = items.filter(i => i.item_type === 'itinerary_day');
  const otherItems = items.filter(i => i.item_type !== 'activity_card' && i.item_type !== 'itinerary_day');

  const isExploreSection = section.section_key === 'explore_saint_martin';
  const title = isFr ? section.title_fr : section.title_en;
  const subtitle = isFr ? section.subtitle_fr : section.subtitle_en;
  const intro = isFr ? section.intro_fr : section.intro_en;

  return (
    <section>
      {/* ── Section header ───────────────────────────────────── */}
      <div className="mb-8">
        {/* Eyebrow + rule */}
        <div className="flex items-center gap-4 mb-6">
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

        {/* Intro — rendu HTML riche depuis l'éditeur WYSIWYG */}
        {intro && (
          <div
            className="guide-rich-text text-sm text-stone-600 leading-relaxed font-light w-full"
            dangerouslySetInnerHTML={{ __html: intro }}
          />
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      {isExploreSection ? (
        /* Explore Saint-Martin — activities grid + itinerary timeline */
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
            <div>
              <div className="flex items-center gap-4 mb-6">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.3em] whitespace-nowrap">
                  {isFr ? 'Itinéraire suggéré — 7 jours' : 'Suggested itinerary — 7 days'}
                </p>
                <div className="h-px flex-1 bg-stone-100" />
              </div>
              <div className="bg-white rounded-3xl border border-stone-100 px-6 py-7 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
                {itineraryItems.map(item => (
                  <GuideItemRenderer key={item.id} item={item} locale={locale} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Generic sections */
        <div>
          {otherItems.some(i => i.item_type === 'house_rule') ? (
            /* House rules — contained list */
            <div className="bg-white rounded-3xl border border-stone-100 px-6 py-2 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              {otherItems.map(item => (
                <GuideItemRenderer key={item.id} item={item} locale={locale} />
              ))}
            </div>
          ) : (
            /* Other items — grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherItems.map(item => (
                <GuideItemRenderer key={item.id} item={item} locale={locale} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Separator ────────────────────────────────────────── */}
      <div className="mt-14 flex items-center gap-4">
        <div className="h-px flex-1 bg-stone-100" />
        <div className="w-1 h-1 rounded-full bg-stone-200" />
        <div className="h-px w-8 bg-stone-100" />
      </div>
    </section>
  );
}
