// ============================================================
// Avoirs et liste des documents d'une réservation (admin)
// ============================================================
//
// Server-only. Un avoir est émis à la main depuis l'admin pour chaque
// remboursement (revue manuelle demandée par la comptable). Le plafond
// (pas plus que l'encaissé non encore remboursé) et la numérotation
// (facture + -C1, -C2…) sont garantis en base par issue_credit_note
// (cf. supabase/add_credit_notes.sql).

import type { SupabaseClient } from '@supabase/supabase-js';
import { BUCKET, upload } from './issue';
import { renderCreditNotePdf } from './render';
import type { CreditNoteData, DocLocale, InvoiceData, PaymentRecord } from './types';

const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => Number(v) || 0;

export interface CreditNoteInput {
  amount: number;          // remboursé, taxe de séjour comprise
  roomTax: number;
  issueDate: string;       // 'YYYY-MM-DD'
  reason?: string;
  refundMethod?: PaymentRecord['method'];
  refundReference?: string;
}

interface InvoiceRow {
  id: string;
  number: string;
  issue_date: string;
  locale: string;
  room_tax_amount: number;
  total_payable: number;
  data: InvoiceData | null;
  pdf_path: string | null;
}

async function loadInvoice(sb: SupabaseClient, bookingId: string): Promise<InvoiceRow | null> {
  const { data, error } = await sb
    .from('invoices')
    .select('id, number, issue_date, locale, room_tax_amount, total_payable, data, pdf_path')
    .eq('booking_id', bookingId)
    .maybeSingle();
  if (error) throw new Error(`invoice lookup failed: ${error.message}`);
  return data as InvoiceRow | null;
}

async function sumAmounts(sb: SupabaseClient, table: 'receipts' | 'credit_notes', invoiceId: string): Promise<number> {
  const { data, error } = await sb.from(table).select('amount').eq('invoice_id', invoiceId);
  if (error) throw new Error(`${table} lookup failed: ${error.message}`);
  return round2((data ?? []).reduce((s, r) => s + num(r.amount), 0));
}

export async function issueCreditNote(
  sb: SupabaseClient,
  bookingId: string,
  input: CreditNoteInput,
): Promise<{ number: string; filename: string; pdf: Buffer; guestEmail: string; locale: DocLocale }> {
  const invoice = await loadInvoice(sb, bookingId);
  if (!invoice?.data) throw new Error('Aucune facture émise pour cette réservation');
  if (!(input.amount > 0)) throw new Error('Le montant de l\'avoir doit être positif');
  if (input.roomTax < 0 || input.roomTax > input.amount) throw new Error('Taxe de séjour de l\'avoir invalide');

  const { data: note, error } = await sb.rpc('issue_credit_note', {
    p_invoice_id: invoice.id,
    p_issue_date: input.issueDate,
    p_amount: round2(input.amount),
    p_room_tax: round2(input.roomTax),
    p_reason: input.reason?.trim() || null,
    p_refund_method: input.refundMethod ?? null,
    p_refund_reference: input.refundReference?.trim() || null,
  }).single<{ id: string; number: string; issue_date: string; company_key: string }>();
  if (error || !note) throw new Error(`issue_credit_note failed: ${error?.message}`);

  const inv = invoice.data;
  const paidToDate = await sumAmounts(sb, 'receipts', invoice.id);
  const creditedToDate = await sumAmounts(sb, 'credit_notes', invoice.id);
  const data: CreditNoteData = {
    locale: inv.locale,
    number: note.number,
    issueDate: note.issue_date,
    invoice: { number: inv.number, issueDate: inv.issueDate, guest: inv.guest, stay: inv.stay, totalPayable: inv.totalPayable },
    amount: round2(input.amount),
    roomTax: round2(input.roomTax),
    reason: input.reason?.trim() || undefined,
    refundMethod: input.refundMethod,
    refundReference: input.refundReference?.trim() || undefined,
    paidToDate,
    creditedToDate,
    netPaid: round2(paidToDate - creditedToDate),
  };

  const pdf = await renderCreditNotePdf(data);
  const path = `${note.company_key}/${note.issue_date.slice(0, 4)}/${note.number}.pdf`;
  await upload(sb, path, pdf);
  const { error: updErr } = await sb.from('credit_notes').update({ data, pdf_path: path }).eq('id', note.id);
  if (updErr) throw new Error(`credit note update failed: ${updErr.message}`);

  return { number: note.number, filename: `${note.number}.pdf`, pdf, guestEmail: inv.guest.email, locale: inv.locale };
}

export interface BookingDocument {
  type: 'invoice' | 'receipt' | 'credit_note';
  number: string;
  date: string;
  amount: number;
  roomTax: number;
  url: string | null;      // lien signé, valable 1 h
}

export interface BookingDocuments {
  invoice: { number: string; totalPayable: number; roomTaxAmount: number } | null;
  paidToDate: number;
  creditedToDate: number;
  refundable: number;
  documents: BookingDocument[];
}

/** Documents émis pour une réservation, avec liens de téléchargement. */
export async function listBookingDocuments(sb: SupabaseClient, bookingId: string): Promise<BookingDocuments> {
  const invoice = await loadInvoice(sb, bookingId);
  if (!invoice) return { invoice: null, paidToDate: 0, creditedToDate: 0, refundable: 0, documents: [] };

  const [{ data: receipts }, { data: notes }] = await Promise.all([
    sb.from('receipts').select('number, payment_date, amount, room_tax, pdf_path').eq('invoice_id', invoice.id).order('seq'),
    sb.from('credit_notes').select('number, issue_date, amount, room_tax, pdf_path').eq('invoice_id', invoice.id).order('seq'),
  ]);

  const docs: Array<Omit<BookingDocument, 'url'> & { path: string | null }> = [
    { type: 'invoice', number: invoice.number, date: invoice.issue_date, amount: num(invoice.total_payable), roomTax: num(invoice.room_tax_amount), path: invoice.pdf_path },
    ...(receipts ?? []).map((r) => ({ type: 'receipt' as const, number: r.number, date: r.payment_date, amount: num(r.amount), roomTax: num(r.room_tax), path: r.pdf_path })),
    ...(notes ?? []).map((n) => ({ type: 'credit_note' as const, number: n.number, date: n.issue_date, amount: -num(n.amount), roomTax: -num(n.room_tax), path: n.pdf_path })),
  ];

  const paths = docs.map((d) => d.path).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await sb.storage.from(BUCKET).createSignedUrls(paths, 3600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }

  const paidToDate = round2((receipts ?? []).reduce((s, r) => s + num(r.amount), 0));
  const creditedToDate = round2((notes ?? []).reduce((s, n) => s + num(n.amount), 0));
  return {
    invoice: { number: invoice.number, totalPayable: num(invoice.total_payable), roomTaxAmount: num(invoice.room_tax_amount) },
    paidToDate,
    creditedToDate,
    refundable: round2(paidToDate - creditedToDate),
    documents: docs.map(({ path, ...d }) => ({ ...d, url: path ? urls.get(path) ?? null : null })),
  };
}
