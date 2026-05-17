import {
  Activity,
  activityIcons,
  categoryLabels,
  durationLabels,
} from '@/lib/data/explore-content';

interface ActivityCardProps {
  activity: Activity;
  locale: string;
  index: number;
}

export default function ActivityCard({ activity, locale, index }: ActivityCardProps) {
  const content = locale === 'fr' ? activity.fr : activity.en;
  const icon = activityIcons[activity.id];
  const primaryCategory = activity.categories[0];
  const catStyle = categoryLabels[primaryCategory];

  return (
    <article
      className="group relative flex flex-col bg-night-700/60 border border-white/8 rounded-2xl overflow-hidden
                 hover:border-bronze-400/40 hover:bg-night-700/80
                 transition-all duration-500 ease-luxury"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bronze-400/40 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Card body */}
      <div className="flex flex-col flex-1 p-6">
        {/* Icon + number */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-night-600/80 border border-white/10
                          flex items-center justify-center text-2xl
                          group-hover:border-bronze-400/30 transition-colors duration-300">
            {icon}
          </div>
          <span className="text-xs font-mono text-white/20 mt-1">
            {String(activity.id).padStart(2, '0')}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg font-semibold text-white leading-snug mb-3
                       group-hover:text-bronze-300 transition-colors duration-300">
          {content.title}
        </h3>

        {/* Description */}
        <ul className="flex-1 space-y-1.5 mb-4">
          {content.description.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/55 leading-relaxed">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-bronze-400/50 flex-shrink-0" />
              {line}
            </li>
          ))}
        </ul>

        {/* Tip */}
        {content.tip && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-bronze-400/8 border border-bronze-400/20">
            <p className="text-xs text-bronze-300/80 leading-relaxed">
              <span className="font-semibold text-bronze-300">
                {locale === 'fr' ? 'Conseil · ' : 'Tip · '}
              </span>
              {content.tip}
            </p>
          </div>
        )}

        {/* Footer: categories + duration */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/8">
          {activity.categories.map((cat) => (
            <span
              key={cat}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium
                          tracking-wider uppercase border ${categoryLabels[cat].color}`}
            >
              {locale === 'fr' ? categoryLabels[cat].fr : categoryLabels[cat].en}
            </span>
          ))}
          {activity.duration && (
            <span className="ml-auto text-[10px] text-white/30 font-medium tracking-wider uppercase">
              {locale === 'fr'
                ? durationLabels[activity.duration].fr
                : durationLabels[activity.duration].en}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
