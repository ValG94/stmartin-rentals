'use client';

import { ActivityCategory, categoryLabels } from '@/lib/data/explore-content';

interface CategoryFilterProps {
  locale: string;
  active: ActivityCategory | 'All';
  onChange: (cat: ActivityCategory | 'All') => void;
}

const ALL_CATEGORIES: ActivityCategory[] = ['Sea', 'Beach', 'Adventure', 'Food', 'Unique', 'Day trip', 'Romantic'];

export default function CategoryFilter({ locale, active, onChange }: CategoryFilterProps) {
  const allLabel = locale === 'fr' ? 'Tout voir' : 'All';

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {/* All button */}
      <button
        onClick={() => onChange('All')}
        className={`
          px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase
          border transition-all duration-300
          ${active === 'All'
            ? 'bg-bronze-400 border-bronze-400 text-night-600'
            : 'bg-transparent border-white/20 text-white/60 hover:border-bronze-400/60 hover:text-white/90'
          }
        `}
      >
        {allLabel}
      </button>

      {ALL_CATEGORIES.map((cat) => {
        const label = locale === 'fr' ? categoryLabels[cat].fr : categoryLabels[cat].en;
        const isActive = active === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`
              px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase
              border transition-all duration-300
              ${isActive
                ? 'bg-bronze-400 border-bronze-400 text-night-600'
                : 'bg-transparent border-white/20 text-white/60 hover:border-bronze-400/60 hover:text-white/90'
              }
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
