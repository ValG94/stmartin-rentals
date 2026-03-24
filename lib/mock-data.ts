import { Apartment, AvailabilityBlock, Booking, SiteSettings } from '@/types';

// ============================================================
// DONNÉES MOCKÉES - À remplacer par des appels Supabase
// ============================================================

export const MOCK_APARTMENTS: Apartment[] = [
  {
    id: '1',
    slug: 'villa-azur',
    title_fr: 'Villa Azur',
    title_en: 'Villa Azur',
    short_description_fr: 'Villa de luxe avec piscine à débordement et vue mer panoramique',
    short_description_en: 'Luxury villa with infinity pool and panoramic sea view',
    description_fr: `Nichée sur les hauteurs de Saint-Martin, la Villa Azur est une propriété d'exception offrant une vue imprenable sur la mer des Caraïbes. Avec sa piscine à débordement, ses grandes terrasses en bois et ses chambres lumineuses décorées avec soin, elle incarne le luxe tropical dans toute sa splendeur.

La villa dispose de 4 chambres spacieuses, chacune dotée d'une salle de bain privative. Les espaces de vie ouverts sur l'extérieur créent une connexion permanente avec la nature et la mer. Les lustres en raphia naturel et les tons sable apportent une touche bohème chic à l'ensemble.`,
    description_en: `Nestled in the hills of Saint-Martin, Villa Azur is an exceptional property offering breathtaking views over the Caribbean Sea. With its infinity pool, large wooden terraces and carefully decorated bright rooms, it embodies tropical luxury in all its splendor.

The villa has 4 spacious bedrooms, each with a private bathroom. The living spaces open to the outside create a permanent connection with nature and the sea. Natural raffia chandeliers and sand tones bring a bohemian chic touch to the whole.`,
    location: 'Terres Basses, Saint-Martin',
    price_per_night: 650,
    currency: 'EUR',
    bedrooms: 4,
    bathrooms: 4,
    max_guests: 8,
    amenities: ['pool', 'wifi', 'ac', 'parking', 'sea_view', 'terrace', 'bbq', 'kitchen'],
    images: [
      {
        id: '1-1',
        apartment_id: '1',
        url: '/images/villa-azur/chambre-vue-mer.jpg',
        alt_fr: 'Chambre principale avec vue sur la mer et la piscine',
        alt_en: 'Master bedroom with sea and pool view',
        is_cover: true,
        position: 1,
      },
      {
        id: '1-2',
        apartment_id: '1',
        url: '/images/villa-azur/piscine-terrasse.jpg',
        alt_fr: 'Terrasse et piscine à débordement vue aérienne',
        alt_en: 'Aerial view of terrace and infinity pool',
        is_cover: false,
        position: 2,
      },
      {
        id: '1-3',
        apartment_id: '1',
        url: '/images/villa-azur/piscine-3.jpg',
        alt_fr: 'Piscine et terrasse en bois',
        alt_en: 'Pool and wooden terrace',
        is_cover: false,
        position: 3,
      },
      {
        id: '1-4',
        apartment_id: '1',
        url: '/images/villa-azur/exterieur.jpg',
        alt_fr: 'Vue aérienne de la piscine',
        alt_en: 'Aerial view of the pool',
        is_cover: false,
        position: 4,
      },
      {
        id: '1-5',
        apartment_id: '1',
        url: '/images/villa-azur/chambre-2.jpg',
        alt_fr: 'Chambre avec salle de bain attenante',
        alt_en: 'Bedroom with en-suite bathroom',
        is_cover: false,
        position: 5,
      },
      {
        id: '1-6',
        apartment_id: '1',
        url: '/images/villa-azur/chambre-3.jpg',
        alt_fr: 'Chambre spacieuse et lumineuse',
        alt_en: 'Spacious and bright bedroom',
        is_cover: false,
        position: 6,
      },
    ],
    sections: [
      {
        id: 's1-1',
        apartment_id: '1',
        type: 'welcome',
        title_fr: 'Bienvenue à la Villa Azur',
        title_en: 'Welcome to Villa Azur',
        content_fr: `Bienvenue dans votre havre de paix ! Nous sommes ravis de vous accueillir à la Villa Azur pour votre séjour à Saint-Martin.

Check-in : à partir de 15h00
Check-out : avant 11h00

Les clés se trouvent dans le boîtier à code à l'entrée. Le code vous sera communiqué par SMS le jour de votre arrivée.

N'hésitez pas à nous contacter pour toute question : +590 690 XX XX XX`,
        content_en: `Welcome to your haven of peace! We are delighted to welcome you to Villa Azur for your stay in Saint-Martin.

Check-in: from 3:00 PM
Check-out: before 11:00 AM

The keys are in the code box at the entrance. The code will be sent to you by SMS on the day of your arrival.

Do not hesitate to contact us for any questions: +590 690 XX XX XX`,
        icon: '👋',
        position: 1,
      },
      {
        id: 's1-2',
        apartment_id: '1',
        type: 'access',
        title_fr: 'Accès & Stationnement',
        title_en: 'Access & Parking',
        content_fr: `**Adresse :** Résidence Les Terres Basses, Route de la Baie Rouge, 97150 Saint-Martin

**GPS :** 18.0789° N, 63.1234° W

**Depuis l'aéroport :** 15 minutes en voiture. Prenez la direction Marigot, puis suivez les panneaux vers Terres Basses.

**Stationnement :** 2 places de parking privées devant la villa.

**Accès piscine :** La piscine est accessible 24h/24. Merci de ne pas utiliser la piscine après 22h pour respecter le voisinage.`,
        content_en: `**Address:** Résidence Les Terres Basses, Route de la Baie Rouge, 97150 Saint-Martin

**GPS:** 18.0789° N, 63.1234° W

**From the airport:** 15 minutes by car. Head towards Marigot, then follow signs to Terres Basses.

**Parking:** 2 private parking spaces in front of the villa.

**Pool access:** The pool is accessible 24/7. Please do not use the pool after 10 PM to respect the neighborhood.`,
        icon: '🗺️',
        position: 2,
      },
      {
        id: 's1-3',
        apartment_id: '1',
        type: 'wifi',
        title_fr: 'Wi-Fi & Équipements',
        title_en: 'Wi-Fi & Equipment',
        content_fr: `**Réseau Wi-Fi :** VillaAzur_Guest
**Mot de passe :** Caraïbes2024!

**Équipements disponibles :**
- Climatisation dans toutes les chambres (télécommande sur la table de nuit)
- Smart TV 65" au salon avec Netflix et Canal+
- Enceinte Bluetooth JBL au salon
- Barbecue au gaz sur la terrasse
- Cuisine entièrement équipée (lave-vaisselle, micro-ondes, cafetière Nespresso)`,
        content_en: `**Wi-Fi Network:** VillaAzur_Guest
**Password:** Caraïbes2024!

**Available equipment:**
- Air conditioning in all rooms (remote control on the bedside table)
- 65" Smart TV in the living room with Netflix and Canal+
- JBL Bluetooth speaker in the living room
- Gas barbecue on the terrace
- Fully equipped kitchen (dishwasher, microwave, Nespresso coffee maker)`,
        icon: '📶',
        position: 3,
      },
      {
        id: 's1-4',
        apartment_id: '1',
        type: 'rules',
        title_fr: 'Règles de la Maison',
        title_en: 'House Rules',
        content_fr: `Pour que votre séjour et celui de nos futurs hôtes se passe dans les meilleures conditions :

✅ **Autorisé :**
- Animaux de compagnie (sur demande préalable)
- Événements familiaux jusqu'à 10 personnes

❌ **Non autorisé :**
- Fumer à l'intérieur de la villa
- Musique forte après 22h
- Fêtes ou soirées sans accord préalable

🧹 **Ménage :** La villa vous est remise propre. Merci de la laisser dans un état correct. Des frais de ménage supplémentaires peuvent être facturés en cas de dégradation.`,
        content_en: `To ensure your stay and that of our future guests goes smoothly:

✅ **Allowed:**
- Pets (on prior request)
- Family events up to 10 people

❌ **Not allowed:**
- Smoking inside the villa
- Loud music after 10 PM
- Parties without prior agreement

🧹 **Cleaning:** The villa is handed over clean. Please leave it in a reasonable condition. Additional cleaning fees may be charged in case of damage.`,
        icon: '📋',
        position: 4,
      },
      {
        id: 's1-5',
        apartment_id: '1',
        type: 'services',
        title_fr: 'Services Disponibles',
        title_en: 'Available Services',
        content_fr: `**Services inclus :**
- Linge de maison (draps, serviettes de bain et de plage)
- Ménage de fin de séjour
- Kit de bienvenue (café, thé, eau, produits de base)

**Services optionnels (sur demande) :**
- 🛒 Courses à l'arrivée : 50€ de commission
- 👨‍🍳 Chef à domicile : à partir de 150€/repas
- 🚗 Transfert aéroport : 35€ aller simple
- 🧹 Ménage quotidien : 60€/jour
- 🚤 Location de bateau : sur devis`,
        content_en: `**Included services:**
- Household linen (sheets, bath and beach towels)
- End-of-stay cleaning
- Welcome kit (coffee, tea, water, basic products)

**Optional services (on request):**
- 🛒 Grocery shopping on arrival: €50 commission
- 👨‍🍳 Private chef: from €150/meal
- 🚗 Airport transfer: €35 one way
- 🧹 Daily cleaning: €60/day
- 🚤 Boat rental: on quote`,
        icon: '✨',
        position: 5,
      },
      {
        id: 's1-6',
        apartment_id: '1',
        type: 'recommendations',
        title_fr: 'Nos Coups de Cœur',
        title_en: 'Our Recommendations',
        content_fr: `**Plages :**
- 🏖️ Baie Rouge : 5 min à pied, la plus belle plage de l'île
- 🏖️ Baie Longue : 10 min en voiture, calme et sauvage
- 🏖️ Orient Bay : 20 min, ambiance festive côté français

**Restaurants :**
- 🍽️ La Cigale (Étang de la Barrière) - Fruits de mer, vue lagon
- 🍽️ Spiga (Marigot) - Cuisine italienne raffinée
- 🍽️ Le Cottage (Grand Case) - Gastronomie créole

**Activités :**
- 🤿 Plongée avec Octopus Diving (Marigot)
- 🚤 Excursion à Anguilla ou Saint-Barth
- 🛍️ Marché de Marigot le mercredi et samedi matin`,
        content_en: `**Beaches:**
- 🏖️ Baie Rouge: 5 min walk, the most beautiful beach on the island
- 🏖️ Baie Longue: 10 min by car, quiet and wild
- 🏖️ Orient Bay: 20 min, festive atmosphere on the French side

**Restaurants:**
- 🍽️ La Cigale (Étang de la Barrière) - Seafood, lagoon view
- 🍽️ Spiga (Marigot) - Refined Italian cuisine
- 🍽️ Le Cottage (Grand Case) - Creole gastronomy

**Activities:**
- 🤿 Diving with Octopus Diving (Marigot)
- 🚤 Excursion to Anguilla or Saint-Barth
- 🛍️ Marigot market on Wednesday and Saturday morning`,
        icon: '⭐',
        position: 6,
      },
      {
        id: 's1-7',
        apartment_id: '1',
        type: 'emergency',
        title_fr: 'Urgences & Contacts Utiles',
        title_en: 'Emergency & Useful Contacts',
        content_fr: `**Urgences :**
- 🚨 SAMU : 15
- 🚒 Pompiers : 18
- 👮 Police : 17
- 🆘 Numéro européen : 112

**Hôpital :**
- Centre Hospitalier Louis-Constant Fleming : +590 590 52 25 25
- Adresse : Concordia, 97150 Saint-Martin

**Contacts propriétaire :**
- 📱 Téléphone : +590 690 XX XX XX
- 📧 Email : contact@stmartin-rentals.com
- 💬 WhatsApp disponible 7j/7 de 8h à 20h`,
        content_en: `**Emergencies:**
- 🚨 SAMU: 15
- 🚒 Fire: 18
- 👮 Police: 17
- 🆘 European number: 112

**Hospital:**
- Centre Hospitalier Louis-Constant Fleming: +590 590 52 25 25
- Address: Concordia, 97150 Saint-Martin

**Owner contacts:**
- 📱 Phone: +590 690 XX XX XX
- 📧 Email: contact@stmartin-rentals.com
- 💬 WhatsApp available 7 days/7 from 8am to 8pm`,
        icon: '🆘',
        position: 7,
      },
    ],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    slug: 'villa-lagon',
    title_fr: 'Villa Lagon',
    title_en: 'Villa Lagon',
    short_description_fr: 'Charmante villa avec piscine privée et vue sur le lagon turquoise',
    short_description_en: 'Charming villa with private pool and turquoise lagoon view',
    description_fr: `La Villa Lagon est une propriété chaleureuse et élégante idéalement située en bord de lagon à Saint-Martin. Son salon lumineux ouvert sur une terrasse avec vue directe sur les eaux turquoises du lagon en fait un lieu de séjour inoubliable.

Avec 2 chambres confortables, une piscine privée et une cuisine entièrement équipée, la Villa Lagon est parfaite pour les couples ou les petites familles souhaitant profiter d'un cadre authentique et reposant.`,
    description_en: `Villa Lagon is a warm and elegant property ideally located on the lagoon's edge in Saint-Martin. Its bright living room opening onto a terrace with a direct view of the turquoise lagoon waters makes it an unforgettable place to stay.

With 2 comfortable bedrooms, a private pool and a fully equipped kitchen, Villa Lagon is perfect for couples or small families wishing to enjoy an authentic and relaxing setting.`,
    location: 'Sandy Ground, Saint-Martin',
    price_per_night: 320,
    currency: 'EUR',
    bedrooms: 2,
    bathrooms: 2,
    max_guests: 4,
    amenities: ['pool', 'wifi', 'ac', 'parking', 'lagoon_view', 'terrace', 'kitchen'],
    images: [
      {
        id: '2-1',
        apartment_id: '2',
        url: '/images/villa-lagon/salon-vue-lagon.jpg',
        alt_fr: 'Salon avec vue panoramique sur le lagon',
        alt_en: 'Living room with panoramic lagoon view',
        is_cover: true,
        position: 1,
      },
      {
        id: '2-2',
        apartment_id: '2',
        url: '/images/villa-lagon/piscine.jpg',
        alt_fr: 'Piscine privée avec vue sur le lagon',
        alt_en: 'Private pool with lagoon view',
        is_cover: false,
        position: 2,
      },
      {
        id: '2-3',
        apartment_id: '2',
        url: '/images/villa-lagon/chambre.jpg',
        alt_fr: 'Chambre principale avec décoration florale',
        alt_en: 'Master bedroom with floral decoration',
        is_cover: false,
        position: 3,
      },
      {
        id: '2-4',
        apartment_id: '2',
        url: '/images/villa-lagon/salon-2.jpg',
        alt_fr: 'Salon et salle à manger ouverts',
        alt_en: 'Open living and dining room',
        is_cover: false,
        position: 4,
      },
      {
        id: '2-5',
        apartment_id: '2',
        url: '/images/villa-lagon/salle-de-bain.jpg',
        alt_fr: 'Salle de bain élégante',
        alt_en: 'Elegant bathroom',
        is_cover: false,
        position: 5,
      },
      {
        id: '2-6',
        apartment_id: '2',
        url: '/images/villa-lagon/repas.jpg',
        alt_fr: 'Plateau de bienvenue avec fruits tropicaux',
        alt_en: 'Welcome tray with tropical fruits',
        is_cover: false,
        position: 6,
      },
    ],
    sections: [
      {
        id: 's2-1',
        apartment_id: '2',
        type: 'welcome',
        title_fr: 'Bienvenue à la Villa Lagon',
        title_en: 'Welcome to Villa Lagon',
        content_fr: `Bienvenue dans votre nid douillet face au lagon ! Nous sommes heureux de vous accueillir à la Villa Lagon.

Check-in : à partir de 15h00
Check-out : avant 11h00

Les clés se trouvent dans la boîte à clés sécurisée. Le code vous sera envoyé par SMS le jour de votre arrivée.

Pour toute question : +590 690 XX XX XX`,
        content_en: `Welcome to your cozy nest facing the lagoon! We are happy to welcome you to Villa Lagon.

Check-in: from 3:00 PM
Check-out: before 11:00 AM

The keys are in the secure key box. The code will be sent to you by SMS on the day of your arrival.

For any questions: +590 690 XX XX XX`,
        icon: '👋',
        position: 1,
      },
      {
        id: 's2-2',
        apartment_id: '2',
        type: 'access',
        title_fr: 'Accès & Stationnement',
        title_en: 'Access & Parking',
        content_fr: `**Adresse :** Résidence Sandy Ground, Allée des Flamants, 97150 Saint-Martin

**GPS :** 18.0654° N, 63.0987° W

**Depuis l'aéroport :** 10 minutes en voiture. Suivez la direction Sandy Ground.

**Stationnement :** 1 place de parking privée devant la villa.`,
        content_en: `**Address:** Résidence Sandy Ground, Allée des Flamants, 97150 Saint-Martin

**GPS:** 18.0654° N, 63.0987° W

**From the airport:** 10 minutes by car. Follow the direction Sandy Ground.

**Parking:** 1 private parking space in front of the villa.`,
        icon: '🗺️',
        position: 2,
      },
      {
        id: 's2-3',
        apartment_id: '2',
        type: 'wifi',
        title_fr: 'Wi-Fi & Équipements',
        title_en: 'Wi-Fi & Equipment',
        content_fr: `**Réseau Wi-Fi :** VillaLagon_Guest
**Mot de passe :** Lagon2024!

**Équipements disponibles :**
- Climatisation dans les 2 chambres
- Smart TV 55" au salon
- Cuisine équipée (lave-vaisselle, micro-ondes, cafetière)
- Linge de maison fourni`,
        content_en: `**Wi-Fi Network:** VillaLagon_Guest
**Password:** Lagon2024!

**Available equipment:**
- Air conditioning in both bedrooms
- 55" Smart TV in the living room
- Equipped kitchen (dishwasher, microwave, coffee maker)
- Household linen provided`,
        icon: '📶',
        position: 3,
      },
      {
        id: 's2-4',
        apartment_id: '2',
        type: 'rules',
        title_fr: 'Règles de la Maison',
        title_en: 'House Rules',
        content_fr: `✅ **Autorisé :**
- Couples et familles avec enfants
- Animaux de petite taille (sur demande)

❌ **Non autorisé :**
- Fumer à l'intérieur
- Musique forte après 21h
- Plus de 4 personnes sans accord préalable`,
        content_en: `✅ **Allowed:**
- Couples and families with children
- Small pets (on request)

❌ **Not allowed:**
- Smoking inside
- Loud music after 9 PM
- More than 4 people without prior agreement`,
        icon: '📋',
        position: 4,
      },
      {
        id: 's2-5',
        apartment_id: '2',
        type: 'recommendations',
        title_fr: 'Nos Coups de Cœur',
        title_en: 'Our Recommendations',
        content_fr: `**Plages à proximité :**
- 🏖️ Plage de Sandy Ground : 2 min à pied
- 🏖️ Baie Nettlé : 5 min en voiture
- 🏖️ Baie Orientale : 25 min en voiture

**Restaurants :**
- 🍽️ Le Pêcheur (Sandy Ground) - Poissons frais du jour
- 🍽️ Kakao Beach (Baie Nettlé) - Pieds dans l'eau
- 🍽️ La Bodega (Marigot) - Tapas et vins

**Activités :**
- 🚣 Kayak sur le lagon (location à 200m)
- 🐠 Snorkeling autour de l'îlet Pinel
- 🛍️ Marché artisanal de Marigot`,
        content_en: `**Nearby beaches:**
- 🏖️ Sandy Ground Beach: 2 min walk
- 🏖️ Baie Nettlé: 5 min by car
- 🏖️ Orient Bay: 25 min by car

**Restaurants:**
- 🍽️ Le Pêcheur (Sandy Ground) - Fresh fish of the day
- 🍽️ Kakao Beach (Baie Nettlé) - Feet in the water
- 🍽️ La Bodega (Marigot) - Tapas and wines

**Activities:**
- 🚣 Kayaking on the lagoon (rental 200m away)
- 🐠 Snorkeling around Pinel Island
- 🛍️ Marigot craft market`,
        icon: '⭐',
        position: 5,
      },
      {
        id: 's2-6',
        apartment_id: '2',
        type: 'emergency',
        title_fr: 'Urgences & Contacts Utiles',
        title_en: 'Emergency & Useful Contacts',
        content_fr: `**Urgences :**
- 🚨 SAMU : 15
- 🚒 Pompiers : 18
- 👮 Police : 17

**Contacts propriétaire :**
- 📱 Téléphone : +590 690 XX XX XX
- 💬 WhatsApp : 7j/7 de 8h à 20h`,
        content_en: `**Emergencies:**
- 🚨 SAMU: 15
- 🚒 Fire: 18
- 👮 Police: 17

**Owner contacts:**
- 📱 Phone: +590 690 XX XX XX
- 💬 WhatsApp: 7 days/7 from 8am to 8pm`,
        icon: '🆘',
        position: 6,
      },
    ],
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// --- Disponibilités mockées ---
const today = new Date();
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r.toISOString().split('T')[0];
};

export const MOCK_AVAILABILITY_BLOCKS: AvailabilityBlock[] = [
  {
    id: 'b1',
    apartment_id: '1',
    start_date: addDays(today, 5),
    end_date: addDays(today, 10),
    block_type: 'booking',
    label: 'Réservation confirmée',
  },
  {
    id: 'b2',
    apartment_id: '1',
    start_date: addDays(today, 20),
    end_date: addDays(today, 27),
    block_type: 'booking',
    label: 'Réservation confirmée',
  },
  {
    id: 'b3',
    apartment_id: '2',
    start_date: addDays(today, 3),
    end_date: addDays(today, 8),
    block_type: 'booking',
    label: 'Réservation confirmée',
  },
  {
    id: 'b4',
    apartment_id: '2',
    start_date: addDays(today, 15),
    end_date: addDays(today, 18),
    block_type: 'maintenance',
    label: 'Maintenance',
  },
];

// --- Réservations mockées ---
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'r1',
    apartment_id: '1',
    guest_name: 'Marie Dupont',
    guest_email: 'marie.dupont@email.com',
    guest_phone: '+33 6 12 34 56 78',
    check_in: addDays(today, 5),
    check_out: addDays(today, 10),
    guests_count: 4,
    nights: 5,
    price_per_night: 650,
    total_amount: 3250,
    deposit_amount: 975,
    remaining_amount: 2275,
    payment_mode: 'deposit',
    payment_status: 'partial',
    booking_status: 'confirmed',
    notes: 'Arrivée tardive prévue vers 20h',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'r2',
    apartment_id: '2',
    guest_name: 'Jean Martin',
    guest_email: 'jean.martin@email.com',
    guest_phone: '+33 6 98 76 54 32',
    check_in: addDays(today, 3),
    check_out: addDays(today, 8),
    guests_count: 2,
    nights: 5,
    price_per_night: 320,
    total_amount: 1600,
    deposit_amount: 480,
    remaining_amount: 0,
    payment_mode: 'full',
    payment_status: 'paid',
    booking_status: 'confirmed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// --- Paramètres du site ---
export const MOCK_SITE_SETTINGS: SiteSettings = {
  id: '1',
  contact_email: 'contact@stmartin-rentals.com',
  contact_phone: '+590 690 XX XX XX',
  contact_whatsapp: '+590690XXXXXX',
  deposit_percentage: 30,
  site_name_fr: 'StMartin Rentals',
  site_name_en: 'StMartin Rentals',
  meta_description_fr: 'Locations saisonnières de luxe à Saint-Martin, Antilles françaises',
  meta_description_en: 'Luxury vacation rentals in Saint-Martin, French West Indies',
};
