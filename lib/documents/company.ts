// ============================================================
// Identité de l'émetteur des factures + adresses des villas
// ============================================================
//
// Validé par la comptable : les factures sont émises au nom de
// CHENILLE INVESTMENTS LTD, à l'adresse figurant sur son certificat
// CRIB (qui est celle d'un autre bien de Chenille, au Sardinia Yacht
// Club). L'adresse de la villa louée apparaît séparément.

export const SELLER = {
  name: 'CHENILLE INVESTMENTS LTD',
  addressLines: ['Rhine Road #149', 'Cupecoy, Low Lands', 'Sint Maarten'],
  crib: '435230608',
  tradeName: 'Island Living SXM',
  email: 'contact@islandlivingsxm.com',
  website: 'islandlivingsxm.com',
};

export interface PropertyIdentity {
  name: string;
  addressLines: string[];
}

// Clé = slug de l'apartment. 'villa-blanche' est le slug réel en base de
// la Maison Blanche (legacy), 'maison-blanche' un alias.
const MAISON_BLANCHE: PropertyIdentity = {
  name: 'Maison Blanche',
  addressLines: ['[Adresse à compléter]', 'Sint Maarten'],
};

export const PROPERTIES: Record<string, PropertyIdentity> = {
  'villa-vanille': {
    name: 'Villa Vanille',
    addressLines: ['33 Seaside Drive 11', 'Indigo Bay', 'Sint Maarten'],
  },
  'villa-blanche': MAISON_BLANCHE,
  'maison-blanche': MAISON_BLANCHE,
};
