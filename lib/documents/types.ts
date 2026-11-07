// ============================================================
// Données des documents comptables (facture, reçu)
// ============================================================
//
// Une facture par réservation (PRÉFIXE-AAAA-NNNN, une série par société
// émettrice, cf. company.ts), un reçu daté par paiement
// (numéro de facture + -R1, -R2…) qui référence la facture, et un avoir
// par remboursement (numéro de facture + -C1, -C2…).

import type { PropertyIdentity } from './company';

export type DocLocale = 'fr' | 'en';

export interface GuestIdentity {
  name: string;
  email: string;
  billingAddressLines: string[];
}

export interface StayInfo {
  property: PropertyIdentity;
  bookingReference: string;
  checkIn: string;   // 'YYYY-MM-DD'
  checkOut: string;  // 'YYYY-MM-DD'
  nights: number;
  guestsCount: number;
}

export interface InvoiceLine {
  kind: 'accommodation' | 'cleaning' | 'extra_guests';
  quantity: number;        // nuits, forfait (1) ou voyageurs × nuits
  unitPrice: number;
  amount: number;
  extraGuestsCount?: number;
}

export interface PaymentRecord {
  receiptNumber: string;
  date: string;            // 'YYYY-MM-DD', date réelle d'encaissement
  kind: 'deposit' | 'balance' | 'full';
  method: 'card' | 'bank_transfer' | 'paypal';
  amount: number;          // taxe de séjour comprise
  roomTax: number;         // part de taxe de séjour incluse
  processorReference?: string;
}

export interface InvoiceData {
  locale: DocLocale;
  number: string;
  issueDate: string;
  guest: GuestIdentity;
  stay: StayInfo;
  lines: InvoiceLine[];
  subtotal: number;
  roomTax: {
    rate: number;          // 0 si résident exonéré
    base: number;
    amount: number;
    exemptionNote?: string; // ex. "carte d'identité vérifiée le …"
  };
  totalPayable: number;
  payments: PaymentRecord[];
  balanceDue: number;
  balanceRoomTax: number;
  balanceDueDate: string;  // avant l'arrivée
  securityDepositAmount: number;
}

export interface ReceiptData {
  locale: DocLocale;
  invoice: Pick<InvoiceData, 'number' | 'issueDate' | 'guest' | 'stay' | 'totalPayable'>;
  payment: PaymentRecord;
  paidToDate: number;      // après ce paiement
  balanceRemaining: number;
}

export interface CreditNoteData {
  locale: DocLocale;
  number: string;
  issueDate: string;
  invoice: Pick<InvoiceData, 'number' | 'issueDate' | 'guest' | 'stay' | 'totalPayable'>;
  amount: number;          // remboursé, taxe de séjour comprise
  roomTax: number;         // part de taxe de séjour remboursée
  reason?: string;
  refundMethod?: PaymentRecord['method'];
  refundReference?: string;
  paidToDate: number;      // total encaissé sur la facture
  creditedToDate: number;  // total des avoirs, celui-ci compris
  netPaid: number;         // paidToDate - creditedToDate
}
