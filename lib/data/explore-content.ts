export type ActivityCategory =
  | 'Sea'
  | 'Beach'
  | 'Adventure'
  | 'Food'
  | 'Unique'
  | 'Day trip'
  | 'Romantic';

export type Duration = 'Half day' | 'Full day' | 'Half or full day' | 'Flexible';

export interface Activity {
  id: number;
  categories: ActivityCategory[];
  duration?: Duration;
  en: {
    title: string;
    description: string[];
    tip?: string;
  };
  fr: {
    title: string;
    description: string[];
    tip?: string;
  };
}

export interface ItineraryDay {
  day: number;
  en: {
    title: string;
    items: string[];
  };
  fr: {
    title: string;
    items: string[];
  };
}

export const activities: Activity[] = [
  {
    id: 1,
    categories: ['Sea'],
    duration: 'Full day',
    en: {
      title: 'Full-Day Catamaran Tour',
      description: [
        'Cruise around the island — Dutch & French sides',
        'Stops at Tintamarre, hidden beaches or Creole Rock',
        'Open bar and lunch often included',
        'One of the island\'s most iconic experiences',
      ],
      tip: 'Best enjoyed early in your trip — Day 1 or 2',
    },
    fr: {
      title: 'Excursion Catamaran à la Journée',
      description: [
        'Croisière autour de l\'île — côtés hollandais et français',
        'Arrêts à Tintamarre, plages cachées ou Rocher Créole',
        'Open bar et déjeuner souvent inclus',
        'L\'une des expériences les plus emblématiques de l\'île',
      ],
      tip: 'Idéal en début de séjour — Jour 1 ou 2',
    },
  },
  {
    id: 2,
    categories: ['Beach'],
    duration: 'Half or full day',
    en: {
      title: 'Pinel Island Escape',
      description: [
        'Short ferry ride to a pristine islet',
        'Calm turquoise waters, perfect for snorkeling',
        'Beach restaurants serving lobster and cocktails',
        'A serene escape from the main island',
      ],
    },
    fr: {
      title: 'Évasion à l\'Îlet Pinel',
      description: [
        'Courte traversée en ferry vers un îlet préservé',
        'Eaux turquoise et calmes, idéales pour le snorkeling',
        'Restaurants de plage avec langouste et cocktails',
        'Une escapade sereine loin de l\'île principale',
      ],
    },
  },
  {
    id: 3,
    categories: ['Unique'],
    duration: 'Half day',
    en: {
      title: 'Maho Beach Plane-Spotting',
      description: [
        'World-famous for low-flying aircraft over the beach',
        'A truly one-of-a-kind island experience',
        'Easily combined with lunch or drinks nearby',
      ],
      tip: 'Check flight schedules for wide-body arrivals',
    },
    fr: {
      title: 'Maho Beach & Avions Rase-Mottes',
      description: [
        'Célèbre dans le monde entier pour ses avions à très basse altitude',
        'Une expérience véritablement unique sur l\'île',
        'Facile à combiner avec un déjeuner ou un verre à proximité',
      ],
      tip: 'Consultez les horaires pour voir les gros porteurs',
    },
  },
  {
    id: 4,
    categories: ['Sea', 'Adventure'],
    duration: 'Half day',
    en: {
      title: 'Snorkeling & Diving',
      description: [
        'Top spots: Creole Rock, Tintamarre, Little Bay',
        'Encounter turtles, rays and tropical fish',
        'Guided excursions available for all levels',
      ],
    },
    fr: {
      title: 'Snorkeling & Plongée',
      description: [
        'Meilleurs spots : Rocher Créole, Tintamarre, Little Bay',
        'Rencontrez tortues, raies et poissons tropicaux',
        'Excursions guidées disponibles pour tous niveaux',
      ],
    },
  },
  {
    id: 5,
    categories: ['Beach'],
    duration: 'Full day',
    en: {
      title: 'Orient Bay Beach Day',
      description: [
        'Jet ski, parasailing and vibrant beach clubs',
        'Often called the "St Tropez of the Caribbean"',
        'Lively atmosphere with watersports and dining',
      ],
    },
    fr: {
      title: 'Journée à Orient Bay',
      description: [
        'Jet ski, parachute ascensionnel et beach clubs animés',
        'Surnommée le "Saint-Tropez des Caraïbes"',
        'Ambiance festive, activités nautiques et restauration',
      ],
    },
  },
  {
    id: 6,
    categories: ['Romantic', 'Sea'],
    duration: 'Half day',
    en: {
      title: 'Sunset Cruise',
      description: [
        'Sailing with cocktails and music at golden hour',
        'Breathtaking Caribbean sunset views',
        'One of the most romantic experiences on the island',
      ],
    },
    fr: {
      title: 'Croisière au Coucher du Soleil',
      description: [
        'Navigation avec cocktails et musique à l\'heure dorée',
        'Coucher de soleil spectaculaire sur les Caraïbes',
        'L\'une des expériences les plus romantiques de l\'île',
      ],
    },
  },
  {
    id: 7,
    categories: ['Adventure'],
    duration: 'Half day',
    en: {
      title: 'ATV & Buggy Island Tour',
      description: [
        'Explore scenic roads, viewpoints and hidden beaches',
        'A perfect blend of adrenaline and sightseeing',
        'Guided tours available from multiple operators',
      ],
    },
    fr: {
      title: 'Tour de l\'Île en ATV / Buggy',
      description: [
        'Exploration des routes panoramiques, points de vue et plages cachées',
        'Un excellent mélange d\'adrénaline et de découverte',
        'Excursions guidées disponibles auprès de plusieurs opérateurs',
      ],
    },
  },
  {
    id: 8,
    categories: ['Adventure'],
    duration: 'Half day',
    en: {
      title: 'Zipline at Rainforest Adventure',
      description: [
        'One of the steepest ziplines in the world',
        'Stunning panoramic views over the island',
        'An unforgettable thrill above the treetops',
      ],
    },
    fr: {
      title: 'Tyrolienne — Rainforest Adventure',
      description: [
        'L\'une des tyroliennes les plus raides au monde',
        'Vues panoramiques spectaculaires sur l\'île',
        'Une sensation inoubliable au-dessus de la canopée',
      ],
    },
  },
  {
    id: 9,
    categories: ['Food'],
    duration: 'Half day',
    en: {
      title: 'Grand Case Food & Culture',
      description: [
        'Grand Case — the culinary capital of the island',
        'Traditional lolos serving authentic BBQ and Creole food',
        'Optional rum distillery visit',
      ],
    },
    fr: {
      title: 'Gastronomie & Culture à Grand Case',
      description: [
        'Grand Case — capitale gastronomique de l\'île',
        'Lolos traditionnels avec barbecue authentique et cuisine créole',
        'Visite de distillerie de rhum possible',
      ],
    },
  },
  {
    id: 10,
    categories: ['Day trip'],
    duration: 'Full day',
    en: {
      title: 'Day Trip to Anguilla or Saba',
      description: [
        'Anguilla: pristine white-sand beaches and luxury',
        'Saba: world-class diving and volcanic landscapes',
        'A full-day change of scenery from Sint Maarten',
      ],
    },
    fr: {
      title: 'Excursion à Anguilla ou Saba',
      description: [
        'Anguilla : sable blanc immaculé et plages luxueuses',
        'Saba : plongée de classe mondiale et paysages volcaniques',
        'Une journée de dépaysement total depuis Sint Maarten',
      ],
    },
  },
];

export const itinerary: ItineraryDay[] = [
  {
    day: 1,
    en: {
      title: 'Arrival & First Sunset',
      items: ['Settle in, unwind at the villa', 'Swim at the nearest beach', 'Dinner in Grand Case'],
    },
    fr: {
      title: 'Arrivée & Premier Coucher de Soleil',
      items: ['Installation, détente à la villa', 'Baignade à la plage la plus proche', 'Dîner à Grand Case'],
    },
  },
  {
    day: 2,
    en: {
      title: 'Full-Day Catamaran',
      items: ['Full-day catamaran tour around the island', 'Snorkeling stops at Tintamarre or Creole Rock', 'Open bar and lunch on board'],
    },
    fr: {
      title: 'Catamaran à la Journée',
      items: ['Excursion catamaran autour de l\'île', 'Snorkeling à Tintamarre ou Rocher Créole', 'Open bar et déjeuner à bord'],
    },
  },
  {
    day: 3,
    en: {
      title: 'Pinel Island & Evening Chill',
      items: ['Ferry to Pinel Island', 'Snorkeling and beach lunch with lobster', 'Relaxed evening at the villa'],
    },
    fr: {
      title: 'Îlet Pinel & Soirée Détente',
      items: ['Ferry vers l\'Îlet Pinel', 'Snorkeling et déjeuner de plage avec langouste', 'Soirée tranquille à la villa'],
    },
  },
  {
    day: 4,
    en: {
      title: 'Orient Bay & Night Out',
      items: ['Orient Bay beach day with watersports', 'Jet ski, parasailing, beach club vibes', 'Night out on the Dutch side'],
    },
    fr: {
      title: 'Orient Bay & Sortie en Soirée',
      items: ['Journée à Orient Bay avec activités nautiques', 'Jet ski, parachute ascensionnel, beach clubs', 'Sortie nocturne côté hollandais'],
    },
  },
  {
    day: 5,
    en: {
      title: 'Island Tour & Maho Sunset',
      items: ['ATV or buggy tour of the island', 'Scenic viewpoints and hidden beaches', 'Maho Beach at sunset — watch the planes land'],
    },
    fr: {
      title: 'Tour de l\'Île & Maho au Coucher du Soleil',
      items: ['Tour de l\'île en ATV ou buggy', 'Points de vue panoramiques et plages cachées', 'Maho Beach au coucher du soleil — avions rase-mottes'],
    },
  },
  {
    day: 6,
    en: {
      title: 'Day Trip: Anguilla or Saba',
      items: ['Full-day excursion to Anguilla or Saba', 'Anguilla: white sand & luxury', 'Saba: diving & volcanic scenery'],
    },
    fr: {
      title: 'Excursion : Anguilla ou Saba',
      items: ['Excursion à la journée à Anguilla ou Saba', 'Anguilla : sable blanc & luxe', 'Saba : plongée & paysages volcaniques'],
    },
  },
  {
    day: 7,
    en: {
      title: 'Final Morning & Farewell Cruise',
      items: ['Morning snorkeling at Creole Rock or Little Bay', 'Sunset cruise to close the week in style', 'Last dinner with Caribbean views'],
    },
    fr: {
      title: 'Dernière Matinée & Croisière d\'Adieu',
      items: ['Snorkeling matinal au Rocher Créole ou Little Bay', 'Sunset cruise pour clôturer la semaine en beauté', 'Dernier dîner avec vue sur les Caraïbes'],
    },
  },
];

export const categoryLabels: Record<ActivityCategory, { en: string; fr: string; color: string }> = {
  Sea: { en: 'Sea', fr: 'Mer', color: 'bg-sky-900/60 text-sky-200 border-sky-700/50' },
  Beach: { en: 'Beach', fr: 'Plage', color: 'bg-amber-900/60 text-amber-200 border-amber-700/50' },
  Adventure: { en: 'Adventure', fr: 'Aventure', color: 'bg-emerald-900/60 text-emerald-200 border-emerald-700/50' },
  Food: { en: 'Food & Culture', fr: 'Gastronomie', color: 'bg-rose-900/60 text-rose-200 border-rose-700/50' },
  Unique: { en: 'Unique', fr: 'Insolite', color: 'bg-violet-900/60 text-violet-200 border-violet-700/50' },
  'Day trip': { en: 'Day Trip', fr: 'Excursion', color: 'bg-teal-900/60 text-teal-200 border-teal-700/50' },
  Romantic: { en: 'Romantic', fr: 'Romantique', color: 'bg-pink-900/60 text-pink-200 border-pink-700/50' },
};

export const durationLabels: Record<Duration, { en: string; fr: string }> = {
  'Half day': { en: 'Half day', fr: 'Demi-journée' },
  'Full day': { en: 'Full day', fr: 'Journée complète' },
  'Half or full day': { en: 'Half or full day', fr: 'Demi ou journée' },
  'Flexible': { en: 'Flexible', fr: 'Flexible' },
};

export const activityIcons: Record<number, string> = {
  1: '⛵',
  2: '🏝️',
  3: '✈️',
  4: '🤿',
  5: '🏖️',
  6: '🌅',
  7: '🏍️',
  8: '🪂',
  9: '🍽️',
  10: '🗺️',
};
