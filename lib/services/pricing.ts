// ============================================================
// Island Living SXM — Pricing Service
// Calcule les montants de réservation selon les règles métier
// ============================================================

export const CLEANING_FEES: Record<string, number> = {
  'villa-vanille': 550,
  'villa-blanche': 350,
  'maison-blanche': 350,
};

export const SECURITY_DEPOSITS: Record<string, number> = {
  'villa-vanille': 800,
  'villa-blanche': 500,
  'maison-blanche': 500,
};

export const DEPOSIT_RATE = 0.40; // 40%

// Taxe de séjour Sint Maarten (room tax). Base validée par la comptable :
// hébergement + voyageurs sup. + ménage obligatoire. L'inclusion du ménage
// reste à confirmer par l'administration fiscale → réglable ici.
export const ROOM_TAX = {
  rate: 0.05,
  includeCleaningFee: true,
  includeExtraGuests: true,
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface SeasonalPriceInput {
  is_active: boolean;
  date_from: string;       // 'YYYY-MM-DD'
  date_to: string;         // 'YYYY-MM-DD'
  price_per_night: number;
}

export interface ExtraGuestsConfig {
  guestsCount: number;            // total voyageurs annoncés par le voyageur
  baseCapacity: number;           // capacité incluse dans le prix de base (= apt.max_guests)
  pricePerNight: number;          // tarif par voyageur supplémentaire par nuit
}

export interface PricingResult {
  nights: number;
  nightlyRate: number;             // prix moyen pondéré par nuit
  accommodationAmount: number;
  cleaningFee: number;
  extraGuestsCount: number;        // nombre de voyageurs sup. facturés
  extraGuestsAmount: number;       // surcoût total des voyageurs sup.
  bookingTotal: number;            // hébergement + ménage + voyageurs sup., HORS taxe de séjour
  roomTaxRate: number;             // 0 si résident exonéré
  roomTaxBase: number;
  roomTaxAmount: number;
  totalPayable: number;            // bookingTotal + taxe de séjour
  depositAmount: number;           // 40 % de totalPayable
  depositRoomTax: number;          // part de taxe incluse dans l'acompte (40 %)
  remainingBalance: number;
  balanceRoomTax: number;          // part de taxe incluse dans le solde (60 %)
  securityDepositAmount: number;
  currency: 'USD';
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calcule le prix d'hébergement pour la période en parcourant nuit par
 * nuit. Une nuit est facturée :
 *  - au tarif saisonnier actif qui couvre cette date, si trouvé (le plus
 *    haut si plusieurs saisons se chevauchent)
 *  - sinon au tarif de base (nightlyRate)
 *
 * Ce comportement gère correctement une réservation qui chevauche basse
 * saison + haute saison : chaque nuit est payée à son tarif réel.
 */
export function calculatePricing(
  slug: string,
  checkIn: string,
  checkOut: string,
  nightlyRate: number,
  seasonalPrices: SeasonalPriceInput[] = [],
  extraGuests?: ExtraGuestsConfig,
  options: { roomTaxExempt?: boolean } = {},
): PricingResult {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / msPerDay);

  if (nights <= 0) throw new Error('Invalid dates: check-out must be after check-in');

  const activeSeasonals = seasonalPrices.filter((sp) => sp.is_active);

  let accommodationAmount = 0;
  const cur = new Date(checkInDate);
  while (cur < checkOutDate) {
    const dayStr = toDateStr(cur);
    // Choisit la saison applicable à cette nuit. Si plusieurs saisons
    // se chevauchent sur le même jour, on prend la plus chère (cohérent
    // avec server-pricing).
    const matching = activeSeasonals.filter(
      (sp) => sp.date_from <= dayStr && sp.date_to >= dayStr,
    );
    const rate = matching.length
      ? Math.max(...matching.map((s) => Number(s.price_per_night)))
      : Number(nightlyRate);
    accommodationAmount += rate;
    cur.setDate(cur.getDate() + 1);
  }

  const cleaningFee = CLEANING_FEES[slug] ?? 250;

  // Voyageurs supplémentaires — payés en plus si guestsCount > baseCapacity.
  // Le surcoût est inclus dans bookingTotal et donc aussi dans l'acompte 40%.
  let extraGuestsCount = 0;
  let extraGuestsAmount = 0;
  if (extraGuests && extraGuests.pricePerNight > 0) {
    extraGuestsCount = Math.max(0, extraGuests.guestsCount - extraGuests.baseCapacity);
    extraGuestsAmount = extraGuestsCount * extraGuests.pricePerNight * nights;
  }

  const bookingTotal = accommodationAmount + cleaningFee + extraGuestsAmount;

  // Taxe de séjour (résidents de Sint Maarten exonérés, sur justificatif
  // validé manuellement par l'admin).
  const roomTaxRate = options.roomTaxExempt ? 0 : ROOM_TAX.rate;
  const roomTaxBase = accommodationAmount
    + (ROOM_TAX.includeCleaningFee ? cleaningFee : 0)
    + (ROOM_TAX.includeExtraGuests ? extraGuestsAmount : 0);
  const roomTaxAmount = round2(roomTaxBase * roomTaxRate);
  const totalPayable = round2(bookingTotal + roomTaxAmount);

  // Acompte 40 % calculé sur le total TTC ; la taxe suit la même
  // répartition (40 % avec l'acompte, 60 % avec le solde) pour être
  // déclarée au mois de chaque encaissement.
  const depositAmount = round2(totalPayable * DEPOSIT_RATE);
  const remainingBalance = round2(totalPayable - depositAmount);
  const depositRoomTax = round2(roomTaxAmount * DEPOSIT_RATE);
  const balanceRoomTax = round2(roomTaxAmount - depositRoomTax);
  const securityDepositAmount = SECURITY_DEPOSITS[slug] ?? 300;

  // Prix moyen pondéré — utilisé pour l'affichage "$X × N nights".
  // Si toutes les nuits ont le même tarif, c'est ce tarif. Sinon c'est
  // la moyenne, ce qui reste la bonne information à montrer au visiteur.
  const avgNightlyRate = Math.round((accommodationAmount / nights) * 100) / 100;

  return {
    nights,
    nightlyRate: avgNightlyRate,
    accommodationAmount,
    cleaningFee,
    extraGuestsCount,
    extraGuestsAmount,
    bookingTotal,
    roomTaxRate,
    roomTaxBase,
    roomTaxAmount,
    totalPayable,
    depositAmount,
    depositRoomTax,
    remainingBalance,
    balanceRoomTax,
    securityDepositAmount,
    currency: 'USD',
  };
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    // Les centimes n'apparaissent que s'il y en a (la taxe de 5 % en produit).
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
