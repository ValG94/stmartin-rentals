/**
 * Registre d'icônes fermé pour le guide digital.
 * Seules ces icônes sont disponibles dans le dashboard admin.
 * Utilise Lucide React (déjà installé dans le projet).
 */

export interface GuideIconDef {
  name: string;
  label_fr: string;
  label_en: string;
  group: string;
}

export const GUIDE_ICON_REGISTRY: GuideIconDef[] = [
  // Essentiels
  { name: 'info',         label_fr: 'Information',     label_en: 'Information',    group: 'Essentiels' },
  { name: 'home',         label_fr: 'Maison',          label_en: 'Home',           group: 'Essentiels' },
  { name: 'key',          label_fr: 'Clé',             label_en: 'Key',            group: 'Essentiels' },
  { name: 'lock',         label_fr: 'Cadenas',         label_en: 'Lock',           group: 'Essentiels' },
  { name: 'wifi',         label_fr: 'Wi-Fi',           label_en: 'Wi-Fi',          group: 'Essentiels' },
  { name: 'phone',        label_fr: 'Téléphone',       label_en: 'Phone',          group: 'Essentiels' },
  { name: 'mail',         label_fr: 'Email',           label_en: 'Email',          group: 'Essentiels' },
  { name: 'map-pin',      label_fr: 'Localisation',    label_en: 'Location',       group: 'Essentiels' },
  { name: 'clock',        label_fr: 'Horaire',         label_en: 'Schedule',       group: 'Essentiels' },
  { name: 'calendar',     label_fr: 'Calendrier',      label_en: 'Calendar',       group: 'Essentiels' },
  // Séjour
  { name: 'sun',          label_fr: 'Soleil',          label_en: 'Sun',            group: 'Séjour' },
  { name: 'moon',         label_fr: 'Nuit',            label_en: 'Night',          group: 'Séjour' },
  { name: 'utensils',     label_fr: 'Cuisine',         label_en: 'Kitchen',        group: 'Séjour' },
  { name: 'coffee',       label_fr: 'Café',            label_en: 'Coffee',         group: 'Séjour' },
  { name: 'car',          label_fr: 'Voiture',         label_en: 'Car',            group: 'Séjour' },
  { name: 'shopping-bag', label_fr: 'Shopping',        label_en: 'Shopping',       group: 'Séjour' },
  { name: 'tv',           label_fr: 'Télévision',      label_en: 'TV',             group: 'Séjour' },
  { name: 'thermometer',  label_fr: 'Climatisation',   label_en: 'AC',             group: 'Séjour' },
  { name: 'droplets',     label_fr: 'Piscine',         label_en: 'Pool',           group: 'Séjour' },
  { name: 'flame',        label_fr: 'Barbecue',        label_en: 'BBQ',            group: 'Séjour' },
  // Activités
  { name: 'sailboat',     label_fr: 'Voilier',         label_en: 'Sailboat',       group: 'Activités' },
  { name: 'waves',        label_fr: 'Mer / Plongée',   label_en: 'Sea / Diving',   group: 'Activités' },
  { name: 'island',       label_fr: 'Île',             label_en: 'Island',         group: 'Activités' },
  { name: 'plane',        label_fr: 'Avion',           label_en: 'Plane',          group: 'Activités' },
  { name: 'zap',          label_fr: 'Aventure',        label_en: 'Adventure',      group: 'Activités' },
  { name: 'map',          label_fr: 'Carte',           label_en: 'Map',            group: 'Activités' },
  { name: 'compass',      label_fr: 'Explorer',        label_en: 'Explore',        group: 'Activités' },
  { name: 'sunset',       label_fr: 'Coucher de soleil', label_en: 'Sunset',       group: 'Activités' },
  { name: 'mountain',     label_fr: 'Montagne',        label_en: 'Mountain',       group: 'Activités' },
  { name: 'bike',         label_fr: 'Vélo / ATV',      label_en: 'Bike / ATV',     group: 'Activités' },
  // Contacts
  { name: 'alert-circle', label_fr: 'Urgence',         label_en: 'Emergency',      group: 'Contacts' },
  { name: 'shield',       label_fr: 'Sécurité',        label_en: 'Security',       group: 'Contacts' },
  { name: 'heart',        label_fr: 'Santé',           label_en: 'Health',         group: 'Contacts' },
  { name: 'star',         label_fr: 'Recommandé',      label_en: 'Recommended',    group: 'Contacts' },
  { name: 'bookmark',     label_fr: 'Favori',          label_en: 'Favourite',      group: 'Contacts' },
  { name: 'link',         label_fr: 'Lien',            label_en: 'Link',           group: 'Contacts' },
];

export const GUIDE_ICON_GROUPS = [
  'Essentiels',
  'Séjour',
  'Activités',
  'Contacts',
] as const;

export type GuideIconName = typeof GUIDE_ICON_REGISTRY[number]['name'];

/** Retourne true si le nom d'icône est dans le registre */
export function isValidGuideIcon(name: string): boolean {
  return GUIDE_ICON_REGISTRY.some((i) => i.name === name);
}

/** Fallback si l'icône n'est pas dans le registre */
export const FALLBACK_ICON = 'info';
