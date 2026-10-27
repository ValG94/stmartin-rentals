// Construit les données d'une facture / d'un reçu à partir du pricing.

import type { PricingResult } from '../services/pricing';
import type { DocLocale, GuestIdentity, InvoiceData, InvoiceLine, PaymentRecord, ReceiptData, StayInfo } from './types';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function buildInvoiceLines(pricing: PricingResult, extraGuestPricePerNight = 0): InvoiceLine[] {
  const lines: InvoiceLine[] = [
    { kind: 'accommodation', quantity: pricing.nights, unitPrice: pricing.nightlyRate, amount: pricing.accommodationAmount },
    { kind: 'cleaning', quantity: 1, unitPrice: pricing.cleaningFee, amount: pricing.cleaningFee },
  ];
  if (pricing.extraGuestsAmount > 0) {
    lines.push({
      kind: 'extra_guests',
      quantity: pricing.extraGuestsCount * pricing.nights,
      unitPrice: extraGuestPricePerNight,
      amount: pricing.extraGuestsAmount,
      extraGuestsCount: pricing.extraGuestsCount,
    });
  }
  return lines;
}

export function buildInvoiceData(args: {
  locale: DocLocale;
  number: string;
  issueDate: string;
  guest: GuestIdentity;
  stay: StayInfo;
  pricing: PricingResult;
  extraGuestPricePerNight?: number;
  payments: PaymentRecord[];
  roomTaxExemptionNote?: string;
}): InvoiceData {
  const { pricing, payments } = args;
  const paid = round2(payments.reduce((s, p) => s + p.amount, 0));
  const taxPaid = round2(payments.reduce((s, p) => s + p.roomTax, 0));
  return {
    locale: args.locale,
    number: args.number,
    issueDate: args.issueDate,
    guest: args.guest,
    stay: args.stay,
    lines: buildInvoiceLines(pricing, args.extraGuestPricePerNight),
    subtotal: pricing.bookingTotal,
    roomTax: {
      rate: pricing.roomTaxRate,
      base: pricing.roomTaxBase,
      amount: pricing.roomTaxAmount,
      exemptionNote: args.roomTaxExemptionNote,
    },
    totalPayable: pricing.totalPayable,
    payments,
    balanceDue: round2(pricing.totalPayable - paid),
    balanceRoomTax: round2(pricing.roomTaxAmount - taxPaid),
    balanceDueDate: args.stay.checkIn,
    securityDepositAmount: pricing.securityDepositAmount,
  };
}

/** Reçu d'un paiement ; `previousPayments` = paiements antérieurs de la même facture. */
export function buildReceiptData(invoice: InvoiceData, payment: PaymentRecord, previousPayments: PaymentRecord[]): ReceiptData {
  const paidToDate = round2([...previousPayments, payment].reduce((s, p) => s + p.amount, 0));
  return {
    locale: invoice.locale,
    invoice,
    payment,
    paidToDate,
    balanceRemaining: round2(invoice.totalPayable - paidToDate),
  };
}
