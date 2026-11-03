// ============================================================
// Identité des émetteurs des factures + adresses des villas
// ============================================================
//
// Deux sociétés, une par villa (recommandation de la comptable, option A,
// 30/10/2026) : chaque société facture sa propre villa, avec sa propre
// numérotation, et déclare la taxe de séjour sous son propre CRIB.
//   - Maison Blanche : CHENILLE INVESTMENTS LTD, à l'adresse de son
//     certificat CRIB (celle d'un autre bien de Chenille, Sardinia Yacht Club).
//   - Villa Vanille : GOLDEN ISLAND LUXURY RENTALS INC., à l'adresse de son
//     attestation (la villa elle-même).
// Les factures portent la marque Island Living SXM, mais l'émetteur est
// toujours la société qui fournit l'hébergement.
//
// Villa Vanille est gérée par Chenille pour le compte de Golden Island
// (décision de la propriétaire du 30/10/2026, contrat écrit de gestion et
// d'encaissement préparé par la comptable) : les factures restent au nom de
// Golden Island, avec la mention que Chenille agit comme mandataire de
// gestion et d'encaissement (formulation validée par la comptable le
// 03/11/2026). Les virements de Villa Vanille vont directement sur le
// compte de Golden Island (bank_transfer_config.company_key).

export interface Seller {
  // Clé stable en base (invoices.company_key, bank_transfer_config.company_key)
  key: 'chenille' | 'goldenIsland';
  name: string;
  addressLines: string[];
  crib: string;
  // Préfixe de la numérotation propre à la société : PRÉFIXE-AAAA-NNNN.
  invoicePrefix: string;
}

export const BRAND = {
  tradeName: 'Island Living SXM',
  email: 'contact@islandlivingsxm.com',
  website: 'islandlivingsxm.com',
};

export const SELLERS = {
  chenille: {
    key: 'chenille',
    name: 'CHENILLE INVESTMENTS LTD',
    addressLines: ['Rhine Road #149', 'Cupecoy, Low Lands', 'Sint Maarten'],
    crib: '435230608',
    invoicePrefix: 'CI',
  },
  goldenIsland: {
    key: 'goldenIsland',
    name: 'GOLDEN ISLAND LUXURY RENTALS INC.',
    addressLines: ['Seaside Drive #33', 'Indigo Bay, Cole Bay', 'Sint Maarten'],
    crib: '435230700',
    invoicePrefix: 'GI',
  },
} satisfies Record<string, Seller>;

export interface PropertyIdentity {
  name: string;
  addressLines: string[];
  seller: Seller;
  // Société qui gère et encaisse pour le compte de l'émetteur (mandat écrit).
  managedBy?: Seller;
}

// Clé = slug de l'apartment. 'villa-blanche' est le slug réel en base de
// la Maison Blanche (legacy), 'maison-blanche' un alias.
const MAISON_BLANCHE: PropertyIdentity = {
  name: 'Maison Blanche',
  addressLines: ['14 Tisza Drive', 'Lowlands', 'Sint Maarten'],
  seller: SELLERS.chenille,
};

export const PROPERTIES: Record<string, PropertyIdentity> = {
  'villa-vanille': {
    name: 'Villa Vanille',
    addressLines: ['33 Seaside Drive', 'Indigo Bay', 'Sint Maarten'],
    seller: SELLERS.goldenIsland,
    managedBy: SELLERS.chenille,
  },
  'villa-blanche': MAISON_BLANCHE,
  'maison-blanche': MAISON_BLANCHE,
};
