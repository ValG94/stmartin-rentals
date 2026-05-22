// ============================================================
// Island Living SXM — Pricing Service
// Calcule les montants de réservation selon les règles métier
// ============================================================

export const CLEANING_FEES: Record<string, number> = {
  'villa-vanille': 450,
  'villa-blanche': 250,
  'maison-blanche': 250,
};

export const SECURITY_DEPOSITS: Record<string, number> = {
  'villa-vanille': 800,
  'villa-blanche': 500,
  'maison-blanche': 500,
};

export const DEPOSIT_RATE = 0.40; // 40%

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
  bookingTotal: number;
  depositAmount: number;
  remainingBalance: number;
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
  const depositAmount = Math.round(bookingTotal * DEPOSIT_RATE * 100) / 100;
  const remainingBalance = Math.round((bookingTotal - depositAmount) * 100) / 100;
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
    depositAmount,
    remainingBalance,
    securityDepositAmount,
    currency: 'USD',
  };
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
