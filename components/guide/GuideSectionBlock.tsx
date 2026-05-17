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

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#0D1B2A] flex items-center justify-center flex-shrink-0">
          <GuideIcon name={section.icon_name} size={18} className="text-[#B08B52]" />
        </div>
        <div>
          <h2 className="font-serif text-xl font-semibold text-gray-900">
            {isFr ? section.title_fr : section.title_en}
          </h2>
          {(isFr ? section.subtitle_fr : section.subtitle_en) && (
            <p className="text-xs text-[#B08B52] font-medium uppercase tracking-wider mt-0.5">
              {isFr ? section.subtitle_fr : section.subtitle_en}
            </p>
          )}
        </div>
      </div>

      {/* Intro */}
      {(isFr ? section.intro_fr : section.intro_en) && (
        <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-prose">
          {isFr ? section.intro_fr : section.intro_en}
        </p>
      )}

      {/* Explore section : grille activités + timeline itinéraire */}
      {isExploreSection ? (
        <div className="space-y-8">
          {activityItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">
                {isFr ? 'Activités & excursions' : 'Activities & excursions'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activityItems.map(item => (
                  <GuideItemRenderer key={item.id} item={item} locale={locale} />
                ))}
              </div>
            </div>
          )}
          {itineraryItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-4">
                {isFr ? 'Itinéraire suggéré — 7 jours' : 'Suggested itinerary — 7 days'}
              </p>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                {itineraryItems.map(item => (
                  <GuideItemRenderer key={item.id} item={item} locale={locale} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Sections génériques */
        <div>
          {/* Items house_rule : liste */}
          {otherItems.some(i => i.item_type === 'house_rule') ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              {otherItems.map(item => (
                <GuideItemRenderer key={item.id} item={item} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherItems.map(item => (
                <GuideItemRenderer key={item.id} item={item} locale={locale} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="mt-8 border-t border-gray-100" />
    </section>
  );
}
