// ============================================================
// Source de vérité — Services de conciergerie
// ============================================================
// Pour ajouter un nouveau service : ajouter un objet à CONCIERGE_SERVICES.
// Le champ `slug` doit être unique (ancre URL et React key).
//
// Deux formats de contenu possibles, exclusifs ou cumulés :
//   - body_fr / body_en : récit (paragraphes séparés par \n, rendus en <p>)
//   - items_fr / items_en : liste de prestations (bullets bronze)
// ============================================================

export type ConciergeServiceIcon =
  | 'grocery'
  | 'chef'
  | 'transfer'
  | 'cleaning'
  | 'boat'
  | 'spa'
  | 'family'
  | 'events'
  | 'lifestyle'
  | 'security'
  | 'activities';

export interface ConciergeService {
  slug: string;
  icon: ConciergeServiceIcon;
  title_fr: string;
  title_en: string;
  intro_fr: string;
  intro_en: string;
  body_fr?: string;
  body_en?: string;
  items_fr?: string[];
  items_en?: string[];
  pricing_note_fr?: string;
  pricing_note_en?: string;
}

const QUOTE_NOTE_FR =
  "Sur devis selon la prestation et le prestataire — toutes nos offres sont confirmées avant réservation.";
const QUOTE_NOTE_EN =
  "Quote upon request based on the service and provider — every offer is confirmed before booking.";

export const CONCIERGE_SERVICES: ConciergeService[] = [
  {
    slug: 'grocery-delivery',
    icon: 'grocery',
    title_fr: 'Livraison de courses avant votre arrivée',
    title_en: 'Grocery delivery before your arrival',
    intro_fr:
      "Afin de rendre votre arrivée à la villa la plus agréable possible, nous vous proposons un service de livraison de courses directement à votre hébergement avant votre check-in.",
    intro_en:
      "In order to make your arrival at the villa as pleasant as possible, we offer a grocery delivery service directly to your accommodation before your check-in.",
    body_fr: `Après plusieurs heures de vol, et parfois de circulation, profitez pleinement de votre arrivée sans avoir à vous rendre au supermarché. Vos produits essentiels, boissons, snacks ou demandes spécifiques peuvent être préparés et livrés à la villa avant votre installation.

Pour bénéficier de ce service, il vous suffit de nous transmettre à l'avance la liste précise des courses souhaitées. Nous nous chargerons de l'achat et de la livraison pour vous.`,
    body_en: `After several hours of flight, and sometimes traffic, you can fully enjoy your arrival without having to go to the supermarket. Your essentials, drinks, snacks, or specific requests can be prepared and delivered to the villa before you settle in.

To benefit from this service, all you need to do is send us in advance the exact list of groceries you want. We will take care of the shopping and delivery for you.`,
    pricing_note_fr:
      "Le coût des courses est facturé sur justificatif, auquel s'ajoutent des frais de déplacement et de service.",
    pricing_note_en:
      "The cost of the groceries is charged with a receipt, to which a delivery and service fee will be added.",
  },
  {
    slug: 'transport-mobilite',
    icon: 'transfer',
    title_fr: 'Transport et mobilité',
    title_en: 'Transport & mobility',
    intro_fr:
      "De l'arrivée à l'aéroport jusqu'à votre prochaine escale insulaire, organisez vos déplacements avec une flotte premium adaptée à chaque moment de votre séjour.",
    intro_en:
      "From airport pickup to your next island escape, organize your travel with a premium fleet tailored to every moment of your stay.",
    items_fr: [
      "Location de voitures et SUV haut de gamme",
      "Service de taxi privé et chauffeur dédié",
      "Buggy et quads pour explorer l'île",
      "Hélicoptère et jet privé pour vos transferts inter-îles",
    ],
    items_en: [
      "High-end car and SUV rentals",
      "Private taxi service with dedicated driver",
      "Buggy and quads to explore the island",
      "Helicopter and private jet for inter-island transfers",
    ],
    pricing_note_fr: QUOTE_NOTE_FR,
    pricing_note_en: QUOTE_NOTE_EN,
  },
  {
    slug: 'nautisme-mer',
    icon: 'boat',
    title_fr: 'Nautisme et expériences en mer',
    title_en: 'Yachting and sea experiences',
    intro_fr:
      "Profitez des eaux turquoise des Caraïbes avec une flotte d'embarcations privées et des expériences nautiques pensées pour tous les niveaux.",
    intro_en:
      "Make the most of the Caribbean's turquoise waters with a fleet of private vessels and sea experiences designed for every level.",
    items_fr: [
      "Boat charter privé avec capitaine",
      "Location de jet skis",
      "Sorties pêche au gros",
      "Plongée sous-marine et snorkeling guidé",
    ],
    items_en: [
      "Private boat charter with captain",
      "Jet ski rentals",
      "Deep-sea fishing excursions",
      "Scuba diving and guided snorkeling",
    ],
    pricing_note_fr: QUOTE_NOTE_FR,
    pricing_note_en: QUOTE_NOTE_EN,
  },
  {
    slug: 'gastronomie-boissons',
    icon: 'chef',
    title_fr: "Gastronomie et boissons d'exception",
    title_en: 'Fine dining and premium beverages',
    intro_fr:
      "Transformez chaque repas en moment d'exception, du dîner gastronomique préparé en villa aux dégustations animées par les meilleurs spécialistes.",
    intro_en:
      "Transform every meal into an exceptional moment, from gourmet dinners prepared at the villa to tastings led by the finest specialists.",
    items_fr: [
      "Chef privé à domicile",
      "Traiteur de luxe pour vos réceptions",
      "Mixologue et serveur privé pour vos soirées",
      "Sommelier et dégustations de vins",
      "Cours de cuisine locale et gastronomique",
    ],
    items_en: [
      "Private chef at the villa",
      "Luxury catering for your receptions",
      "Private mixologist and waiter for your evenings",
      "Sommelier and wine tasting sessions",
      "Local and gourmet cooking classes",
    ],
    pricing_note_fr: QUOTE_NOTE_FR,
    pricing_note_en: QUOTE_NOTE_EN,
  },
  {
    slug: 'bien-etre-sante',
    icon: 'spa',
    title_fr: 'Bien-être et santé',
    title_en: 'Wellness and health',
    intro_fr:
      "Un cocon de soins amené jusqu'à votre villa, pour conjuguer détente, vitalité et rituels de beauté sans jamais quitter votre villa.",
    intro_en:
      "A haven of treatments brought to your villa, combining relaxation, vitality and beauty rituals — all without leaving your villa.",
    items_fr: [
      "Massages à domicile",
      "Spa mobile et soins corporels",
      "Cours privés de yoga et pilates",
      "Coach fitness personnel",
      "Coiffeur et barbier à domicile",
      "Esthéticienne pour vos soins beauté",
    ],
    items_en: [
      "In-villa massage",
      "Mobile spa and body treatments",
      "Private yoga and pilates classes",
      "Personal fitness coach",
      "In-villa hairdresser and barber",
      "Beauty treatments with an aesthetician",
    ],
    pricing_note_fr: QUOTE_NOTE_FR,
    pricing_note_en: QUOTE_NOTE_EN,
  },
  {
    slug: 'famille-enfants',
    icon: 'family',
    title_fr: 'Services famille et enfants',
    title_en: 'Family and children services',
    intro_fr:
      "Pour que les vacances soient aussi reposantes pour les parents que joyeuses pour les enfants, une équipe attentive et qualifiée à votre disposition.",
    intro_en:
      "So that parents enjoy true rest while children create lasting memories — a caring, qualified team at your service.",
    items_fr: [
      "Baby-sitting ponctuel ou récurrent",
      "Nanny dédiée pour la durée du séjour",
      "Fourniture de lits bébé et équipements de puériculture",
    ],
    items_en: [
      "Occasional or recurring baby-sitting",
      "Dedicated nanny for the duration of your stay",
      "Baby cots and childcare equipment provided",
    ],
    pricing_note_fr: QUOTE_NOTE_FR,
    pricing_note_en: QUOTE_NOTE_EN,
  },
  {
    slug: 'evenementiel',
    icon: 'events',
    title_fr: 'Événementiel et expériences privées',
    title_en: 'Events and private experiences',
    intro_fr:
      "Anniversaire intime, demande en mariage, dîner thématique — nous orchestrons chaque détail pour transformer votre moment en souvenir inoubliable.",
    intro_en:
      "Intimate birthdays, marriage proposals, themed dinners — we orchestrate every detail to turn your moment into an unforgettable memory.",
    items_fr: [
      "Organisation d'événements sur mesure",
      "Décoration florale et compositions exclusives",
      "DJ pour ambiances privées",
      "Photographe professionnel",
    ],
    items_en: [
      "Bespoke event planning",
      "Floral design and exclusive arrangements",
      "DJ for private parties",
      "Professional photographer",
    ],
    pricing_note_fr: QUOTE_NOTE_FR,
    pricing_note_en: QUOTE_NOTE_EN,
  },
  {
    slug: 'lifestyle-luxe',
    icon: 'lifestyle',
    title_fr: 'Lifestyle et services de luxe',
    title_en: 'Lifestyle and luxury services',
    intro_fr:
      "Une attention discrète portée aux détails qui transforment un séjour en signature personnelle, du dressing à la dernière coupe de champagne.",
    intro_en:
      "Discreet attention to the details that turn a stay into your personal signature, from styling to the final glass of champagne.",
    items_fr: [
      "Styliste, image consultant et maquilleur",
      "Livraison de champagne, caviar et produits d'exception",
      "Accès et réservations en vie nocturne",
    ],
    items_en: [
      "Stylist, image consultant and makeup artist",
      "Champagne, caviar and exceptional products delivery",
      "Nightlife access and reservations",
    ],
    pricing_note_fr: QUOTE_NOTE_FR,
    pricing_note_en: QUOTE_NOTE_EN,
  },
  {
    slug: 'securite-protection',
    icon: 'security',
    title_fr: 'Sécurité et protection rapprochée',
    title_en: 'Security and close protection',
    intro_fr:
      "Pour les hôtes exigeant la plus grande tranquillité, des équipes formées assurent votre quiétude avec une discrétion absolue.",
    intro_en:
      "For guests who require the highest level of peace of mind, trained teams ensure your security with absolute discretion.",
    items_fr: [
      "Garde du corps personnel et protection VIP",
      "Présence sécurisée 24h/24 et 7j/7",
      "Chauffeur sécurisé pour vos déplacements",
      "Rondes et discrétion complète sur la villa",
    ],
    items_en: [
      "Personal bodyguard and VIP protection",
      "24/7 secure presence",
      "Secure driver for your transfers",
      "Patrols and complete discretion on the villa",
    ],
    pricing_note_fr: QUOTE_NOTE_FR,
    pricing_note_en: QUOTE_NOTE_EN,
  },
  {
    slug: 'activites-loisirs',
    icon: 'activities',
    title_fr: 'Activités et loisirs premium',
    title_en: 'Premium activities and leisure',
    intro_fr:
      "Saint-Martin et ses environs offrent un terrain de jeu d'exception — nous l'ouvrons à vos envies sportives et culturelles avec les meilleurs professionnels.",
    intro_en:
      "Saint-Martin and its surroundings offer an exceptional playground — we open it to your sporting and cultural desires with the finest professionals.",
    items_fr: [
      "Cours privés de golf, tennis et padel",
      "Guide privé pour découvertes culturelles et naturelles",
    ],
    items_en: [
      "Private golf, tennis and padel lessons",
      "Private guide for cultural and natural discoveries",
    ],
    pricing_note_fr: QUOTE_NOTE_FR,
    pricing_note_en: QUOTE_NOTE_EN,
  },
];
