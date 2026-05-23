// ============================================================
// Source de vérité — Services de conciergerie
// ============================================================
// Pour ajouter un nouveau service : ajouter un objet à SERVICES.
// Le champ `slug` doit être unique (ancre URL et React key).
// `body_*` accepte des paragraphes séparés par \n — rendus en <p>.
// ============================================================

export type ConciergeServiceIcon =
  | 'grocery'
  | 'chef'
  | 'transfer'
  | 'cleaning'
  | 'boat'
  | 'spa';

export interface ConciergeService {
  slug: string;
  icon: ConciergeServiceIcon;
  title_fr: string;
  title_en: string;
  intro_fr: string;
  intro_en: string;
  body_fr: string;
  body_en: string;
  pricing_note_fr?: string;
  pricing_note_en?: string;
}

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
];
