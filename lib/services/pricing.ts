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
  'villa-vanille': 530,
  'villa-blanche': 300,
  'maison-blanche': 300,
};

export const DEPOSIT_RATE = 0.40; // 40%

export interface PricingResult {
  nights: number;
  nightlyRate: number;
  accommodationAmount: number;
  cleaningFee: number;
  bookingTotal: number;
  depositAmount: number;       // 40% acompte
  remainingBalance: number;    // 60% solde
  securityDepositAmount: number; // dépôt de garantie à l'arrivée
  currency: 'USD';
}

export function calculatePricing(
  slug: string,
  checkIn: string,
  checkOut: string,
  nightlyRate: number
): PricingResult {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / msPerDay);

  if (nights <= 0) throw new Error('Invalid dates: check-out must be after check-in');

  const accommodationAmount = nights * nightlyRate;
  const cleaningFee = CLEANING_FEES[slug] ?? 250;
  const bookingTotal = accommodationAmount + cleaningFee;
  const depositAmount = Math.round(bookingTotal * DEPOSIT_RATE * 100) / 100;
  const remainingBalance = Math.round((bookingTotal - depositAmount) * 100) / 100;
  const securityDepositAmount = SECURITY_DEPOSITS[slug] ?? 300;

  return {
    nights,
    nightlyRate,
    accommodationAmount,
    cleaningFee,
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
