// Génère des exemples de facture, reçus et mail de confirmation à partir
// du vrai code (pricing + modèles), pour relecture par la comptable.
//
// Usage : pnpm docs:samples <dossier-de-sortie>

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { calculatePricing } from '../lib/services/pricing';
import { PROPERTIES } from '../lib/documents/company';
import { buildInvoiceData, buildReceiptData } from '../lib/documents/build';
import { renderInvoicePdf, renderReceiptPdf } from '../lib/documents/render';
import type { DocLocale, PaymentRecord } from '../lib/documents/types';

const outDir = process.argv[2];
if (!outDir) throw new Error('Usage: render-document-samples.tsx <outDir>');
mkdirSync(outDir, { recursive: true });

// Exemple de la comptable : 7 nuits × 650 USD + ménage 550 USD.
const pricing = calculatePricing('villa-vanille', '2026-12-12', '2026-12-19', 650);
const bookingId = '3f2a9c1e-7b4d-4e8a-9f61-2c5d8e0b7a14';
const invoiceNumber = 'IL-2026-0001';

const deposit: PaymentRecord = {
  receiptNumber: `${invoiceNumber}-R1`, date: '2026-10-27', kind: 'deposit', method: 'card',
  amount: pricing.depositAmount, roomTax: pricing.depositRoomTax, processorReference: 'SAMPLE-TX-0001',
};
const balance: PaymentRecord = {
  receiptNumber: `${invoiceNumber}-R2`, date: '2026-12-02', kind: 'balance', method: 'card',
  amount: pricing.remainingBalance, roomTax: pricing.balanceRoomTax, processorReference: 'SAMPLE-TX-0002',
};

function invoiceFor(locale: DocLocale) {
  return buildInvoiceData({
    locale,
    number: invoiceNumber,
    issueDate: deposit.date,
    guest: {
      name: 'Sample Guest',
      email: 'guest@example.com',
      billingAddressLines: ['125 Ocean Drive', 'Miami, FL 33139', 'United States'],
    },
    stay: {
      property: PROPERTIES['villa-vanille'],
      bookingReference: bookingId,
      checkIn: '2026-12-12', checkOut: '2026-12-19', nights: pricing.nights, guestsCount: 6,
    },
    pricing,
    payments: [deposit],
  });
}

async function main() {
  for (const locale of ['en', 'fr'] as const) {
    const invoice = invoiceFor(locale);
    writeFileSync(join(outDir, `invoice-${invoiceNumber}-${locale}.pdf`), await renderInvoicePdf(invoice));
    writeFileSync(join(outDir, `receipt-${deposit.receiptNumber}-${locale}.pdf`), await renderReceiptPdf(buildReceiptData(invoice, deposit, [])));
    writeFileSync(join(outDir, `receipt-${balance.receiptNumber}-${locale}.pdf`), await renderReceiptPdf(buildReceiptData(invoice, balance, [deposit])));
  }

  // Mail de confirmation révisé : on intercepte l'envoi Resend pour
  // récupérer le HTML au lieu de l'envoyer.
  process.env.RESEND_API_KEY = 'sample';
  const sent: { subject: string; html: string; to: string }[] = [];
  globalThis.fetch = (async (_url: string, init: { body: string }) => {
    sent.push(JSON.parse(init.body));
    return { ok: true, text: async () => '' };
  }) as unknown as typeof fetch;
  const { sendBookingConfirmationEmail } = await import('../lib/services/email');
  for (const locale of ['en', 'fr'] as const) {
    sent.length = 0;
    await sendBookingConfirmationEmail({
      guestName: 'Sample Guest', guestEmail: 'guest@example.com', villaName: 'Villa Vanille',
      checkIn: '2026-12-12', checkOut: '2026-12-19', nights: pricing.nights,
      accommodationAmount: pricing.accommodationAmount, cleaningFee: pricing.cleaningFee,
      extraGuestsAmount: pricing.extraGuestsAmount, bookingTotal: pricing.bookingTotal,
      roomTaxRate: pricing.roomTaxRate, roomTaxAmount: pricing.roomTaxAmount, totalPayable: pricing.totalPayable,
      paymentOption: 'deposit_40', depositAmount: pricing.depositAmount, remainingBalance: pricing.remainingBalance,
      securityDepositAmount: pricing.securityDepositAmount, paymentMethod: 'fygaro', bookingId, locale,
      depositAuthorizationStatus: 'authorized', invoiceNumber,
    });
    const mail = sent.find((m) => m.to === 'guest@example.com')!;
    writeFileSync(join(outDir, `confirmation-${locale}.html`),
      `<!doctype html><meta charset="utf-8"><title>${mail.subject}</title>\n${mail.html}`);
  }
  console.log('Samples written to', outDir);
}

main();
