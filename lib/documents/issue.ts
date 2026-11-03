// ============================================================
// Émission des factures et reçus à chaque paiement encaissé
// ============================================================
//
// Server-only. Appelé par les routes qui confirment un paiement (webhook
// Fygaro, virement marqué reçu par l'admin, capture PayPal).
//
//   1er paiement (acompte ou intégral) → facture + reçu R1
//   paiement du solde                  → reçu R2 (la facture existe déjà)
//
// Idempotent : la numérotation et l'unicité (une facture par booking, un
// reçu par type de paiement) sont garanties en base par issue_invoice /
// issue_receipt (cf. supabase/add_room_tax_invoices.sql). Un PDF déjà
// stocké n'est jamais régénéré : le document émis reste figé.

import type { SupabaseClient } from '@supabase/supabase-js';
import { PROPERTIES } from './company';
import { buildInvoiceData, buildReceiptData, type PricingSnapshot } from './build';
import { renderInvoicePdf, renderReceiptPdf } from './render';
import type { DocLocale, InvoiceData, PaymentRecord } from './types';

const BUCKET = 'documents';

export interface PaymentEvent {
  kind: PaymentRecord['kind'];
  method: PaymentRecord['method'];
  processorReference?: string | null;
  paidAt?: Date;           // défaut : maintenant
}

export interface IssuedDocument {
  number: string;
  filename: string;
  pdf: Buffer;
}

export interface IssuedDocuments {
  invoice?: IssuedDocument;   // seulement au 1er paiement
  receipt: IssuedDocument;
}

interface BookingRow {
  id: string;
  guest_name: string;
  guest_email: string;
  billing_address: string | null;
  locale: string | null;
  check_in: string;
  check_out: string;
  nights: number;
  guests_count: number;
  price_per_night: number;
  accommodation_amount: number;
  cleaning_fee: number;
  extra_guests_count: number;
  extra_guest_price_per_night: number;
  extra_guests_amount: number;
  booking_total: number;
  room_tax_rate: number | null;
  room_tax_base: number | null;
  room_tax_amount: number | null;
  total_payable: number | null;
  deposit_amount: number;
  deposit_room_tax: number | null;
  balance_room_tax: number | null;
  security_deposit_amount: number;
  bank_account_company_key: string | null;
  apartments: { slug: string } | { slug: string }[] | null;
}

interface ReceiptRow {
  seq: number;
  number: string;
  payment_date: string;
  kind: PaymentRecord['kind'];
  method: PaymentRecord['method'];
  amount: number;
  room_tax: number;
  processor_reference: string | null;
  pdf_path: string | null;
}

/** Date du jour à Sint Maarten (UTC-4, sans heure d'été). */
function sxmDate(d: Date): string {
  return new Date(d.getTime() - 4 * 3600_000).toISOString().slice(0, 10);
}

const num = (v: unknown) => Number(v) || 0;

function toPaymentRecord(r: ReceiptRow): PaymentRecord {
  return {
    receiptNumber: r.number,
    date: r.payment_date,
    kind: r.kind,
    method: r.method,
    amount: num(r.amount),
    roomTax: num(r.room_tax),
    processorReference: r.processor_reference ?? undefined,
  };
}

/**
 * Émet (ou retrouve) la facture et le reçu correspondant à un paiement.
 * Renvoie null pour les bookings créées avant la taxe de séjour.
 */
export async function issueDocumentsForPayment(
  sb: SupabaseClient,
  bookingId: string,
  payment: PaymentEvent,
): Promise<IssuedDocuments | null> {
  const { data, error } = await sb
    .from('bookings')
    .select(`
      id, guest_name, guest_email, billing_address, locale,
      check_in, check_out, nights, guests_count, price_per_night,
      accommodation_amount, cleaning_fee,
      extra_guests_count, extra_guest_price_per_night, extra_guests_amount,
      booking_total, room_tax_rate, room_tax_base, room_tax_amount, total_payable,
      deposit_amount, deposit_room_tax, balance_room_tax, security_deposit_amount,
      bank_account_company_key,
      apartments:apartment_id (slug)
    `)
    .eq('id', bookingId)
    .single();
  if (error || !data) throw new Error(`Booking ${bookingId} not found: ${error?.message}`);
  const b = data as unknown as BookingRow;

  if (b.total_payable == null || b.room_tax_rate == null) return null;

  const apt = Array.isArray(b.apartments) ? b.apartments[0] : b.apartments;
  const property = apt ? PROPERTIES[apt.slug] : undefined;
  if (!property) throw new Error(`No issuing company configured for apartment "${apt?.slug}"`);
  const seller = property.seller;
  // Société qui encaisse réellement : titulaire du compte de virement
  // indiqué au voyageur, sinon celle du compte carte (Fygaro, Chenille),
  // c.-à-d. le mandataire s'il y en a un. Sert aux relevés de reversement.
  const collectedBy = payment.method === 'bank_transfer' && b.bank_account_company_key
    ? b.bank_account_company_key
    : (property.managedBy ?? seller).key;
  const locale: DocLocale = b.locale === 'fr' ? 'fr' : 'en';
  const paymentDate = sxmDate(payment.paidAt ?? new Date());

  const pricing: PricingSnapshot = {
    nights: num(b.nights),
    nightlyRate: num(b.price_per_night),
    accommodationAmount: num(b.accommodation_amount),
    cleaningFee: num(b.cleaning_fee),
    extraGuestsCount: num(b.extra_guests_count),
    extraGuestsAmount: num(b.extra_guests_amount),
    bookingTotal: num(b.booking_total),
    roomTaxRate: num(b.room_tax_rate),
    roomTaxBase: num(b.room_tax_base),
    roomTaxAmount: num(b.room_tax_amount),
    totalPayable: num(b.total_payable),
    securityDepositAmount: num(b.security_deposit_amount),
  };

  // Montant et part de taxe du paiement, d'après les montants figés
  // à la création (pas le montant reçu, qui vaut 1 USD en mode test).
  const depositAmount = num(b.deposit_amount);
  const amount = payment.kind === 'full' ? pricing.totalPayable
    : payment.kind === 'deposit' ? depositAmount
    : Math.round((pricing.totalPayable - depositAmount) * 100) / 100;
  const roomTax = payment.kind === 'full' ? pricing.roomTaxAmount
    : payment.kind === 'deposit' ? num(b.deposit_room_tax)
    : num(b.balance_room_tax);

  // 1. Facture (créée au 1er paiement, retrouvée ensuite)
  const { data: invoice, error: invErr } = await sb.rpc('issue_invoice', {
    p_booking_id: bookingId,
    p_company_key: seller.key,
    p_prefix: seller.invoicePrefix,
    p_issue_date: paymentDate,
    p_locale: locale,
    p_subtotal: pricing.bookingTotal,
    p_room_tax_rate: pricing.roomTaxRate,
    p_room_tax_base: pricing.roomTaxBase,
    p_room_tax_amount: pricing.roomTaxAmount,
    p_total_payable: pricing.totalPayable,
  }).single<{ id: string; number: string; issue_date: string; locale: string; pdf_path: string | null; data: InvoiceData | null }>();
  if (invErr || !invoice) throw new Error(`issue_invoice failed: ${invErr?.message}`);

  // 2. Reçu de ce paiement
  const { data: receipt, error: rcpErr } = await sb.rpc('issue_receipt', {
    p_invoice_id: invoice.id,
    p_kind: payment.kind,
    p_method: payment.method,
    p_payment_date: paymentDate,
    p_amount: amount,
    p_room_tax: roomTax,
    p_processor_reference: payment.processorReference ?? null,
    p_collected_by: collectedBy,
  }).single<ReceiptRow & { id: string }>();
  if (rcpErr || !receipt) throw new Error(`issue_receipt failed: ${rcpErr?.message}`);

  const { data: allReceipts, error: listErr } = await sb
    .from('receipts')
    .select('seq, number, payment_date, kind, method, amount, room_tax, processor_reference, pdf_path')
    .eq('invoice_id', invoice.id)
    .order('seq');
  if (listErr) throw new Error(`receipts lookup failed: ${listErr.message}`);
  const receipts = (allReceipts ?? []) as ReceiptRow[];
  const docLocale: DocLocale = invoice.locale === 'fr' ? 'fr' : 'en';
  const year = invoice.issue_date.slice(0, 4);

  // 3. PDF de la facture : rendu une seule fois, avec les paiements reçus
  //    à son émission.
  let invoiceData = invoice.data;
  let issuedInvoice: IssuedDocument | undefined;
  if (!invoice.pdf_path) {
    invoiceData = buildInvoiceData({
      locale: docLocale,
      number: invoice.number,
      issueDate: invoice.issue_date,
      guest: {
        name: b.guest_name,
        email: b.guest_email,
        billingAddressLines: (b.billing_address ?? '').split('\n').map((l) => l.trim()).filter(Boolean),
      },
      stay: {
        property,
        bookingReference: b.id,
        checkIn: b.check_in,
        checkOut: b.check_out,
        nights: pricing.nights,
        guestsCount: num(b.guests_count),
      },
      pricing,
      extraGuestPricePerNight: num(b.extra_guest_price_per_night),
      payments: receipts.filter((r) => r.seq <= receipt.seq).map(toPaymentRecord),
    });
    const pdf = await renderInvoicePdf(invoiceData);
    const path = `${seller.key}/${year}/${invoice.number}.pdf`;
    await upload(sb, path, pdf);
    const { error: updErr } = await sb.from('invoices').update({ data: invoiceData, pdf_path: path }).eq('id', invoice.id);
    if (updErr) throw new Error(`invoice update failed: ${updErr.message}`);
    issuedInvoice = { number: invoice.number, filename: `${invoice.number}.pdf`, pdf };
  }
  if (!invoiceData) throw new Error(`Invoice ${invoice.number} has a PDF but no stored data`);

  // 4. PDF du reçu
  let receiptPdf: Buffer;
  if (receipt.pdf_path) {
    receiptPdf = await download(sb, receipt.pdf_path);
  } else {
    const previous = receipts.filter((r) => r.seq < receipt.seq).map(toPaymentRecord);
    receiptPdf = await renderReceiptPdf(buildReceiptData(invoiceData, toPaymentRecord(receipt), previous));
    const path = `${seller.key}/${year}/${receipt.number}.pdf`;
    await upload(sb, path, receiptPdf);
    const { error: updErr } = await sb.from('receipts').update({ pdf_path: path }).eq('id', receipt.id);
    if (updErr) throw new Error(`receipt update failed: ${updErr.message}`);
  }

  return {
    invoice: issuedInvoice,
    receipt: { number: receipt.number, filename: `${receipt.number}.pdf`, pdf: receiptPdf },
  };
}

async function upload(sb: SupabaseClient, path: string, pdf: Buffer): Promise<void> {
  const { error } = await sb.storage.from(BUCKET).upload(path, pdf, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw new Error(`Upload ${path} failed: ${error.message}`);
}

async function download(sb: SupabaseClient, path: string): Promise<Buffer> {
  const { data, error } = await sb.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Download ${path} failed: ${error?.message}`);
  return Buffer.from(await data.arrayBuffer());
}

/** Pièces jointes Resend (base64) pour les documents émis. */
export function toEmailAttachments(docs: IssuedDocuments | null): { filename: string; content: string }[] {
  if (!docs) return [];
  return [docs.invoice, docs.receipt]
    .filter((d): d is IssuedDocument => !!d)
    .map((d) => ({ filename: d.filename, content: d.pdf.toString('base64') }));
}

/**
 * Variante qui ne lève jamais : un échec d'émission ne doit pas bloquer la
 * confirmation du paiement ni le mail au voyageur. L'erreur est loguée pour
 * reprise manuelle.
 */
export async function tryIssueDocumentsForPayment(
  sb: SupabaseClient,
  bookingId: string,
  payment: PaymentEvent,
): Promise<IssuedDocuments | null> {
  try {
    return await issueDocumentsForPayment(sb, bookingId, payment);
  } catch (err) {
    console.error(`[documents] issue failed for booking ${bookingId} (${payment.kind}):`, err);
    return null;
  }
}
