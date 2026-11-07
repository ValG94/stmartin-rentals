// ============================================================
// Export mensuel des paiements et remboursements (comptable)
// ============================================================
//
// Server-only. Format demandé par la comptable (27/10/2026) : une ligne par
// paiement (reçu) ou remboursement (avoir) daté dans le mois, avec la taxe
// de séjour, et des totaux mensuels par société émettrice, détaillés par
// société qui a encaissé pour le rapprochement avec les relevés bancaires.
// Les réservations des plateformes (Airbnb, Abritel) ne sont pas incluses :
// elles ne passent pas par le site.

import type { SupabaseClient } from '@supabase/supabase-js';
import { SELLERS, type Seller } from './company';

const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => Number(v) || 0;
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

type CompanyKey = Seller['key'];

interface Row {
  company: CompanyKey;
  date: string;
  type: 'Payment' | 'Refund';
  document: string;
  invoice: string;
  bookingId: string;
  property: string;
  guest: string;
  checkIn: string;
  checkOut: string;
  paymentType: string;
  method: string;
  handledBy: string;
  reference: string;
  amount: number;
  roomTax: number;
}

interface BookingJoin {
  guest_name: string;
  check_in: string;
  check_out: string;
  apartments: { title_en: string | null } | { title_en: string | null }[] | null;
}

const KIND: Record<string, string> = { deposit: 'Deposit', balance: 'Balance', full: 'Full payment' };
const METHOD: Record<string, string> = { card: 'Card', bank_transfer: 'Bank transfer', paypal: 'PayPal' };

function companyName(key: string): string {
  return (SELLERS as Record<string, Seller>)[key]?.name ?? key;
}

function monthBounds(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

function bookingFields(b: BookingJoin | null) {
  const apt = b ? one(b.apartments) : null;
  return {
    property: apt?.title_en ?? '',
    guest: b?.guest_name ?? '',
    checkIn: b?.check_in ?? '',
    checkOut: b?.check_out ?? '',
  };
}

export async function loadMonthlyRows(sb: SupabaseClient, month: string, company?: CompanyKey): Promise<Row[]> {
  const { from, to } = monthBounds(month);
  const bookingSel = 'bookings:booking_id (guest_name, check_in, check_out, apartments:apartment_id (title_en))';

  const [receipts, notes] = await Promise.all([
    sb.from('receipts')
      .select(`number, payment_date, kind, method, amount, room_tax, processor_reference, collected_by, booking_id, invoices:invoice_id (number, company_key), ${bookingSel}`)
      .gte('payment_date', from).lte('payment_date', to),
    sb.from('credit_notes')
      .select(`number, issue_date, amount, room_tax, refund_method, refund_reference, refunded_by, company_key, booking_id, invoices:invoice_id (number), ${bookingSel}`)
      .gte('issue_date', from).lte('issue_date', to),
  ]);
  if (receipts.error) throw new Error(`receipts export failed: ${receipts.error.message}`);
  if (notes.error) throw new Error(`credit notes export failed: ${notes.error.message}`);

  const rows: Row[] = [
    ...(receipts.data ?? []).map((r) => {
      const inv = one(r.invoices as { number: string; company_key: string } | { number: string; company_key: string }[] | null);
      return {
        company: inv?.company_key as CompanyKey,
        date: r.payment_date,
        type: 'Payment' as const,
        document: r.number,
        invoice: inv?.number ?? '',
        bookingId: r.booking_id,
        ...bookingFields(one(r.bookings as BookingJoin | BookingJoin[] | null)),
        paymentType: KIND[r.kind] ?? r.kind,
        method: METHOD[r.method] ?? r.method,
        handledBy: companyName(r.collected_by),
        reference: r.processor_reference ?? '',
        amount: num(r.amount),
        roomTax: num(r.room_tax),
      };
    }),
    ...(notes.data ?? []).map((n) => {
      const inv = one(n.invoices as { number: string } | { number: string }[] | null);
      return {
        company: n.company_key as CompanyKey,
        date: n.issue_date,
        type: 'Refund' as const,
        document: n.number,
        invoice: inv?.number ?? '',
        bookingId: n.booking_id,
        ...bookingFields(one(n.bookings as BookingJoin | BookingJoin[] | null)),
        paymentType: 'Credit note',
        method: n.refund_method ? METHOD[n.refund_method] ?? n.refund_method : '',
        handledBy: companyName(n.refunded_by),
        reference: n.refund_reference ?? '',
        amount: -num(n.amount),
        roomTax: -num(n.room_tax),
      };
    }),
  ];

  return rows
    .filter((r) => !company || r.company === company)
    .sort((a, b) => a.company.localeCompare(b.company) || a.date.localeCompare(b.date) || a.document.localeCompare(b.document));
}

function csvCell(v: string | number): string {
  const s = typeof v === 'number' ? v.toFixed(2) : v;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV (UTF-8 avec BOM pour Excel, séparateur virgule, point décimal). */
export function monthlyCsv(month: string, rows: Row[]): string {
  const header = [
    'Company', 'CRIB', 'Date', 'Type', 'Document no.', 'Invoice no.', 'Booking reference',
    'Property', 'Guest', 'Check-in', 'Check-out', 'Payment', 'Method',
    'Collected or refunded by', 'Transaction reference',
    'Amount incl. room tax (USD)', 'Room tax (USD)', 'Amount excl. room tax (USD)',
  ];
  const lines: (string | number)[][] = [header];

  for (const r of rows) {
    const seller = (SELLERS as Record<string, Seller>)[r.company];
    lines.push([
      seller?.name ?? r.company, seller?.crib ?? '', r.date, r.type, r.document, r.invoice, r.bookingId,
      r.property, r.guest, r.checkIn, r.checkOut, r.paymentType, r.method, r.handledBy, r.reference,
      r.amount, r.roomTax, round2(r.amount - r.roomTax),
    ]);
  }

  // Totaux par société émettrice, puis par société qui a encaissé
  const blank = (label: string, amount: number, roomTax: number): (string | number)[] =>
    [label, '', '', '', '', '', '', '', '', '', '', '', '', '', '', round2(amount), round2(roomTax), round2(amount - roomTax)];
  lines.push([]);
  lines.push([`Totals for ${month}`]);
  const companies = [...new Set(rows.map((r) => r.company))];
  if (!companies.length) lines.push(['No payments or refunds this month.']);
  for (const c of companies) {
    const rc = rows.filter((r) => r.company === c);
    const sum = (f: (r: Row) => boolean) => rc.filter(f).reduce((acc, r) => [acc[0] + r.amount, acc[1] + r.roomTax], [0, 0]);
    const [pa, pt] = sum((r) => r.type === 'Payment');
    const [ra, rt] = sum((r) => r.type === 'Refund');
    lines.push(blank(`${companyName(c)}: payments received`, pa, pt));
    lines.push(blank(`${companyName(c)}: refunds (credit notes)`, ra, rt));
    lines.push(blank(`${companyName(c)}: net (room tax to declare)`, pa + ra, pt + rt));
    for (const by of [...new Set(rc.map((r) => r.handledBy))]) {
      const [a, t] = sum((r) => r.handledBy === by);
      lines.push(blank(`${companyName(c)}: of which net handled by ${by}`, a, t));
    }
  }

  return '﻿' + lines.map((l) => l.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
