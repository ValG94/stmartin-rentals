import React from 'react';

export interface AmenityDef {
  key: string;
  label_fr: string;
  label_en: string;
  icon: React.ReactNode;
}

// Icônes SVG ligne (style Antilles Exception)
const icons: Record<string, React.ReactNode> = {
  pool: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M2 12c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" />
      <path d="M2 17c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" />
      <path d="M7 5l2-2 2 2M12 5V3" />
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  ),
  ac: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="2" y="6" width="20" height="8" rx="2" />
      <path d="M7 14v4M12 14v4M17 14v4" />
      <path d="M7 10h.01M12 10h.01" />
    </svg>
  ),
  parking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
    </svg>
  ),
  sea_view: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M2 16c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" />
      <path d="M12 8a4 4 0 0 0-4 4" />
      <circle cx="12" cy="8" r="2" />
      <path d="M12 2v2M12 12v2" />
    </svg>
  ),
  lagoon_view: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M3 17c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0" />
      <path d="M12 3c0 0-5 3-5 8h10c0-5-5-8-5-8z" />
    </svg>
  ),
  terrace: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  bbq: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M4 11h16M4 11a8 8 0 0 0 16 0" />
      <path d="M12 19v3M8 19l-2 3M16 19l2 3" />
      <path d="M8 3l1 4M12 3v4M16 3l-1 4" />
    </svg>
  ),
  kitchen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M6 2v20M6 8h4M6 13h4" />
      <path d="M14 2c0 4 4 5 4 9a4 4 0 0 1-8 0c0-4 4-5 4-9z" />
    </svg>
  ),
  tv: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 20h8M12 18v2" />
    </svg>
  ),
  jacuzzi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M4 19h16M4 19V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10" />
      <path d="M8 13c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zM14 11c.5-1 1.5-1.5 2-1" />
      <path d="M7 7V5M12 7V5M17 7V5" />
    </svg>
  ),
  washing_machine: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <rect x="3" y="2" width="18" height="20" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M7 6h.01M10 6h.01" />
    </svg>
  ),
  hair_dryer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M10 8a4 4 0 1 0 0 8" />
      <path d="M14 12h7" />
      <path d="M18 9l3-3M18 15l3 3" />
      <path d="M10 12v7l-3 2" />
    </svg>
  ),
  bed_linen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M2 9V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3" />
      <path d="M2 9h20v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z" />
      <path d="M6 9V7M18 9V7" />
    </svg>
  ),
  beach_towels: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M3 6c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
      <path d="M3 10h18M8 6v16" />
    </svg>
  ),
  massage_room: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M4 18h16M4 18V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10" />
      <circle cx="12" cy="6" r="2" />
      <path d="M9 11l3 3 3-3" />
    </svg>
  ),
};

export const AMENITIES_LIST: AmenityDef[] = [
  { key: 'pool',            label_fr: 'Piscine',            label_en: 'Pool',             icon: icons.pool },
  { key: 'jacuzzi',         label_fr: 'Jacuzzi',            label_en: 'Jacuzzi',          icon: icons.jacuzzi },
  { key: 'wifi',            label_fr: 'Wi-Fi',              label_en: 'Wi-Fi',            icon: icons.wifi },
  { key: 'tv',              label_fr: 'Télévision',         label_en: 'Television',       icon: icons.tv },
  { key: 'ac',              label_fr: 'Climatisation',      label_en: 'Air conditioning', icon: icons.ac },
  { key: 'kitchen',         label_fr: 'Cuisine équipée',    label_en: 'Equipped kitchen', icon: icons.kitchen },
  { key: 'bbq',             label_fr: 'Barbecue',           label_en: 'BBQ',              icon: icons.bbq },
  { key: 'terrace',         label_fr: 'Terrasse',           label_en: 'Terrace',          icon: icons.terrace },
  { key: 'sea_view',        label_fr: 'Vue mer',            label_en: 'Sea view',         icon: icons.sea_view },
  { key: 'lagoon_view',     label_fr: 'Vue lagon',          label_en: 'Lagoon view',      icon: icons.lagoon_view },
  { key: 'parking',         label_fr: 'Parking',            label_en: 'Parking',          icon: icons.parking },
  { key: 'washing_machine', label_fr: 'Lave-linge',         label_en: 'Washing machine',  icon: icons.washing_machine },
  { key: 'hair_dryer',      label_fr: 'Sèche-cheveux',      label_en: 'Hair dryer',       icon: icons.hair_dryer },
  { key: 'bed_linen',       label_fr: 'Linge de maison',    label_en: 'Bed linen',        icon: icons.bed_linen },
  { key: 'beach_towels',    label_fr: 'Serviettes de plage', label_en: 'Beach towels',    icon: icons.beach_towels },
  { key: 'massage_room',    label_fr: 'Salle de massage',   label_en: 'Massage room',     icon: icons.massage_room },
];

export const AMENITIES_MAP = Object.fromEntries(
  AMENITIES_LIST.map((a) => [a.key, a])
);

interface AmenityIconProps {
  amenityKey: string;
  locale?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AmenityIconDisplay({ amenityKey, locale = 'fr', size = 'md' }: AmenityIconProps) {
  const def = AMENITIES_MAP[amenityKey];
  if (!def) return null;

  const label = locale === 'fr' ? def.label_fr : def.label_en;

  const sizeClasses = {
    sm: 'text-xs gap-1.5',
    md: 'text-sm gap-2',
    lg: 'text-base gap-3',
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]} text-night-500`}>
      <span className="text-night-400 flex-shrink-0">{def.icon}</span>
      <span>{label}</span>
    </div>
  );
}
