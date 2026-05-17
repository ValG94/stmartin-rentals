import { ItineraryDay as ItineraryDayType } from '@/lib/data/explore-content';

interface ItineraryDayProps {
  day: ItineraryDayType;
  locale: string;
  isLast: boolean;
}

const DAY_ACCENTS = [
  'from-sky-500/20 to-sky-600/5',
  'from-teal-500/20 to-teal-600/5',
  'from-amber-500/20 to-amber-600/5',
  'from-rose-500/20 to-rose-600/5',
  'from-violet-500/20 to-violet-600/5',
  'from-emerald-500/20 to-emerald-600/5',
  'from-bronze-400/20 to-bronze-500/5',
];

const DAY_DOTS = [
  'bg-sky-400',
  'bg-teal-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-violet-400',
  'bg-emerald-400',
  'bg-bronze-400',
];

export default function ItineraryDay({ day, locale, isLast }: ItineraryDayProps) {
  const content = locale === 'fr' ? day.fr : day.en;
  const accentIdx = (day.day - 1) % DAY_ACCENTS.length;
  const dayLabel = locale === 'fr' ? 'Jour' : 'Day';

  return (
    <div className="relative flex gap-4 sm:gap-6">
      {/* Timeline stem */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Dot */}
        <div className={`w-3 h-3 rounded-full ${DAY_DOTS[accentIdx]} ring-2 ring-night-600 ring-offset-1 ring-offset-night-600 flex-shrink-0 mt-1.5`} />
        {/* Vertical line */}
        {!isLast && (
          <div className="w-px flex-1 mt-2 bg-gradient-to-b from-white/15 to-transparent min-h-[3rem]" />
        )}
      </div>

      {/* Card */}
      <div
        className={`flex-1 mb-8 rounded-2xl border border-white/8 overflow-hidden
                    bg-gradient-to-br ${DAY_ACCENTS[accentIdx]} bg-night-700/50
                    hover:border-white/15 transition-all duration-300 group`}
      >
        <div className="p-5 sm:p-6">
          {/* Day number + title */}
          <div className="flex items-baseline gap-3 mb-3">
            <span className={`text-xs font-mono font-bold tracking-widest uppercase ${DAY_DOTS[accentIdx].replace('bg-', 'text-')}`}>
              {dayLabel} {day.day}
            </span>
            <div className="h-px flex-1 bg-white/8" />
          </div>
          <h4 className="font-serif text-base sm:text-lg font-semibold text-white mb-3 leading-snug
                         group-hover:text-bronze-200 transition-colors duration-300">
            {content.title}
          </h4>

          {/* Items */}
          <ul className="space-y-2">
            {content.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-white/55 leading-relaxed">
                <span className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 ${DAY_DOTS[accentIdx]} opacity-70`} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
