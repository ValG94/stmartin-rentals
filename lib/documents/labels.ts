// ============================================================
// Libellés et formats des documents comptables (FR / EN)
// ============================================================
//
// Règle éditoriale : pas de tiret cadratin dans les documents.

import type { DocLocale, InvoiceLine, PaymentRecord } from './types';

export function money(amount: number, locale: DocLocale): string {
  const n = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
    // fr-FR utilise une espace fine insécable que Helvetica n'a pas
    .replace(/ /g, ' ');
  return locale === 'fr' ? `${n} USD` : `USD ${n}`;
}

export function date(iso: string, locale: DocLocale): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function percent(rate: number, locale: DocLocale): string {
  const v = Math.round(rate * 1000) / 10;
  return locale === 'fr' ? `${String(v).replace('.', ',')} %` : `${v}%`;
}

const L = {
  en: {
    invoice: 'INVOICE',
    receipt: 'PAYMENT RECEIPT',
    invoiceNo: 'Invoice no.',
    receiptNo: 'Receipt no.',
    issueDate: 'Issue date',
    paymentDate: 'Payment date',
    issuedBy: 'Issued by',
    billTo: 'Bill to',
    receivedFrom: 'Received from',
    crib: 'CRIB',
    stay: 'Stay',
    property: 'Property',
    bookingRef: 'Booking reference',
    dates: 'Dates',
    stayDates: (a: string, b: string) => `${a} to ${b}`,
    nightsGuests: (n: number, g: number) => `${n} night${n > 1 ? 's' : ''}, ${g} guest${g > 1 ? 's' : ''}`,
    description: 'Description',
    qty: 'Qty',
    unitPrice: 'Unit price',
    amount: 'Amount',
    subtotal: 'Subtotal',
    roomTax: (pct: string, base: string) => `Room tax ${pct} on ${base}`,
    roomTaxExempt: 'Room tax: exempt (Sint Maarten resident)',
    totalPayable: 'Total payable',
    paymentsReceived: 'Payments received',
    receiptCol: 'Receipt',
    ofWhichRoomTax: (t: string) => `incl. room tax ${t}`,
    totalPaid: 'Total paid',
    balanceDue: 'Balance due',
    balanceDueBy: (d: string) => `Due before arrival, by ${d}`,
    noPaymentYet: 'No payment received yet.',
    securityDeposit: (a: string) => `Security deposit: card pre-authorization of ${a}, not charged and not included in the total payable.`,
    amountsInUsd: 'All amounts in US dollars.',
    forInvoice: 'For invoice',
    invoiceTotal: 'Invoice total',
    amountReceived: 'Amount received',
    paidToDate: 'Paid to date',
    balanceRemaining: 'Balance remaining',
    method: 'Payment method',
    processorRef: 'Transaction reference',
    thanks: 'Thank you for your payment.',
    line: {
      accommodation: 'Accommodation (per night)',
      cleaning: 'Mandatory cleaning fee',
      extra_guests: (g: number) => `Extra guests: ${g}, per guest per night`,
    },
    paymentKind: { deposit: 'Booking deposit (40%)', balance: 'Balance payment', full: 'Full payment' },
    paymentMethod: { card: 'Card', bank_transfer: 'Bank transfer' },
  },
  fr: {
    invoice: 'FACTURE',
    receipt: 'REÇU DE PAIEMENT',
    invoiceNo: 'Facture n°',
    receiptNo: 'Reçu n°',
    issueDate: 'Date d\'émission',
    paymentDate: 'Date du paiement',
    issuedBy: 'Émetteur',
    billTo: 'Facturé à',
    receivedFrom: 'Reçu de',
    crib: 'CRIB',
    stay: 'Séjour',
    property: 'Hébergement',
    bookingRef: 'Référence de réservation',
    dates: 'Dates',
    stayDates: (a: string, b: string) => `Du ${a} au ${b}`,
    nightsGuests: (n: number, g: number) => `${n} nuit${n > 1 ? 's' : ''}, ${g} voyageur${g > 1 ? 's' : ''}`,
    description: 'Désignation',
    qty: 'Qté',
    unitPrice: 'Prix unitaire',
    amount: 'Montant',
    subtotal: 'Sous-total',
    roomTax: (pct: string, base: string) => `Taxe de séjour ${pct} sur ${base}`,
    roomTaxExempt: 'Taxe de séjour : exonéré (résident de Sint Maarten)',
    totalPayable: 'Total à payer',
    paymentsReceived: 'Paiements reçus',
    receiptCol: 'Reçu',
    ofWhichRoomTax: (t: string) => `dont taxe de séjour ${t}`,
    totalPaid: 'Total payé',
    balanceDue: 'Reste à payer',
    balanceDueBy: (d: string) => `À régler avant l'arrivée, au plus tard le ${d}`,
    noPaymentYet: 'Aucun paiement reçu à ce jour.',
    securityDeposit: (a: string) => `Dépôt de garantie : empreinte bancaire de ${a}, non débitée et non incluse dans le total à payer.`,
    amountsInUsd: 'Montants exprimés en dollars US.',
    forInvoice: 'Pour la facture',
    invoiceTotal: 'Total de la facture',
    amountReceived: 'Montant reçu',
    paidToDate: 'Total payé à ce jour',
    balanceRemaining: 'Reste à payer',
    method: 'Moyen de paiement',
    processorRef: 'Référence de transaction',
    thanks: 'Merci pour votre paiement.',
    line: {
      accommodation: 'Hébergement (par nuit)',
      cleaning: 'Frais de ménage obligatoires',
      extra_guests: (g: number) => `Voyageurs supplémentaires : ${g}, par voyageur et par nuit`,
    },
    paymentKind: { deposit: 'Acompte de réservation (40 %)', balance: 'Paiement du solde', full: 'Paiement intégral' },
    paymentMethod: { card: 'Carte bancaire', bank_transfer: 'Virement bancaire' },
  },
};

export function labels(locale: DocLocale) {
  return L[locale];
}

export function lineLabel(line: InvoiceLine, locale: DocLocale): string {
  const l = L[locale].line;
  if (line.kind === 'accommodation') return l.accommodation;
  if (line.kind === 'cleaning') return l.cleaning;
  return l.extra_guests(line.extraGuestsCount ?? 0);
}

export function paymentLabel(p: PaymentRecord, locale: DocLocale): string {
  const l = L[locale];
  return `${l.paymentKind[p.kind]}, ${l.paymentMethod[p.method].toLowerCase()}`;
}
