'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, Download, FileText, Loader2, X } from 'lucide-react';
import type { BookingDocuments } from '@/lib/documents/credit-notes';
import type { Booking } from './BookingsClient';

const round2 = (n: number) => Math.round(n * 100) / 100;
const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Documents d'une réservation (facture, reçus, avoirs) et émission d'un
 * avoir pour un remboursement. La taxe de séjour remboursée est proposée au
 * prorata (taxe / total de la facture) et reste modifiable : la comptable
 * veut une revue manuelle de chaque remboursement.
 */
export default function DocumentsModal({
  booking, isFr, onClose,
}: {
  booking: Booking;
  isFr: boolean;
  onClose: () => void;
}) {
  const [docs, setDocs] = useState<BookingDocuments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState('');
  const [roomTax, setRoomTax] = useState('');
  const [roomTaxEdited, setRoomTaxEdited] = useState(false);
  // Date locale de l'admin (en-CA = AAAA-MM-JJ)
  const [issueDate, setIssueDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('');
  const [refundReference, setRefundReference] = useState('');
  const [sendEmail, setSendEmail] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/bookings/documents?bookingId=${booking.id}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setDocs(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function proratedTax(a: number): number {
    if (!docs?.invoice || docs.invoice.totalPayable <= 0) return 0;
    return round2(a * docs.invoice.roomTaxAmount / docs.invoice.totalPayable);
  }

  function openForm() {
    if (!docs) return;
    setAmount(String(docs.refundable));
    setRoomTax(String(proratedTax(docs.refundable)));
    setRoomTaxEdited(false);
    setSuccess('');
    setFormOpen(true);
  }

  function onAmountChange(v: string) {
    setAmount(v);
    if (!roomTaxEdited) setRoomTax(String(proratedTax(Number(v) || 0)));
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/bookings/credit-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookingId: booking.id,
          amount: Number(amount),
          roomTax: Number(roomTax),
          issueDate,
          reason: reason.trim() || undefined,
          refundMethod: refundMethod || undefined,
          refundReference: refundReference.trim() || undefined,
          sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setSuccess(isFr
        ? `Avoir ${data.number} émis${data.emailSent ? ' et envoyé au voyageur' : ''}.`
        : `Credit note ${data.number} issued${data.emailSent ? ' and sent to the guest' : ''}.`);
      setFormOpen(false);
      setReason('');
      setRefundReference('');
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  const typeLabel = {
    invoice: isFr ? 'Facture' : 'Invoice',
    receipt: isFr ? 'Reçu' : 'Receipt',
    credit_note: isFr ? 'Avoir' : 'Credit note',
  };
  const amountNum = Number(amount);
  const taxNum = Number(roomTax);
  const formValid = docs && amountNum > 0 && amountNum <= docs.refundable + 0.005
    && taxNum >= 0 && taxNum <= amountNum && /^\d{4}-\d{2}-\d{2}$/.test(issueDate);
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bronze-200 focus:border-bronze-300';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => !submitting && onClose()}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-bronze-50 flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-bronze-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl text-night-600 leading-tight">{isFr ? 'Documents comptables' : 'Accounting documents'}</h3>
            <p className="text-sm text-night-400 mt-1">
              {booking.guest_name} · {booking.apartments?.title_fr || booking.apartments?.title_en} · {booking.check_in} → {booking.check_out}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label={isFr ? 'Fermer' : 'Close'}>
            <X size={20} />
          </button>
        </div>

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700 flex items-center gap-2" role="status">
            <Check size={14} /> {success}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex items-center gap-2" role="alert">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-night-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {isFr ? 'Chargement…' : 'Loading…'}</p>
        ) : !docs?.invoice ? (
          <p className="text-sm text-night-400">
            {isFr
              ? 'Aucune facture pour cette réservation : elle est émise au premier paiement (réservations créées depuis la mise en place de la taxe de séjour).'
              : 'No invoice for this booking: it is issued on the first payment (bookings created since the room tax was introduced).'}
          </p>
        ) : (
          <>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-[10px] uppercase text-night-400 border-b border-gray-200" style={{ letterSpacing: '0.12em' }}>
                  <th className="py-2 font-medium">{isFr ? 'Document' : 'Document'}</th>
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium text-right">{isFr ? 'Montant' : 'Amount'}</th>
                  <th className="py-2 font-medium text-right">{isFr ? 'dont taxe' : 'incl. tax'}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {docs.documents.map((d) => (
                  <tr key={d.number} className="border-b border-gray-100">
                    <td className="py-2">
                      <span className="text-night-400 text-xs mr-2">{typeLabel[d.type]}</span>
                      <span className="font-mono text-night-600">{d.number}</span>
                    </td>
                    <td className="py-2 text-night-500">{d.date}</td>
                    <td className={`py-2 text-right ${d.amount < 0 ? 'text-red-600' : 'text-night-600'}`}>{usd(d.amount)}</td>
                    <td className="py-2 text-right text-night-400">{usd(d.roomTax)}</td>
                    <td className="py-2 text-right">
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-bronze-600 hover:text-bronze-700 text-xs" title={isFr ? 'Télécharger le PDF' : 'Download PDF'}>
                          <Download size={13} /> PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-sm grid grid-cols-3 gap-2">
              <div><p className="text-[10px] uppercase text-night-400">{isFr ? 'Encaissé' : 'Paid'}</p><p className="text-night-600 font-medium">{usd(docs.paidToDate)}</p></div>
              <div><p className="text-[10px] uppercase text-night-400">{isFr ? 'Avoirs' : 'Credited'}</p><p className="text-night-600 font-medium">{usd(-docs.creditedToDate)}</p></div>
              <div><p className="text-[10px] uppercase text-night-400">{isFr ? 'Remboursable' : 'Refundable'}</p><p className="text-night-600 font-medium">{usd(docs.refundable)}</p></div>
            </div>

            {docs.refundable > 0 && !formOpen && (
              <button
                type="button"
                onClick={openForm}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
              >
                {isFr ? 'Émettre un avoir (remboursement)' : 'Issue a credit note (refund)'}
              </button>
            )}

            {formOpen && (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-night-500 mb-4">
                  {isFr
                    ? "À émettre une fois le remboursement fait. L'avoir est numéroté et ne peut plus être modifié."
                    : 'Issue it once the refund has been made. The credit note is numbered and cannot be changed afterwards.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <label>
                    <span className={labelCls}>{isFr ? 'Montant remboursé' : 'Amount refunded'}</span>
                    <input type="number" step="0.01" min="0" max={docs.refundable} value={amount} onChange={(e) => onAmountChange(e.target.value)} className={inputCls} disabled={submitting} />
                  </label>
                  <label>
                    <span className={labelCls}>{isFr ? 'dont taxe de séjour' : 'incl. room tax'}</span>
                    <input type="number" step="0.01" min="0" value={roomTax} onChange={(e) => { setRoomTax(e.target.value); setRoomTaxEdited(true); }} className={inputCls} disabled={submitting} />
                  </label>
                  <label>
                    <span className={labelCls}>{isFr ? 'Date' : 'Date'}</span>
                    <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputCls} disabled={submitting} />
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <label>
                    <span className={labelCls}>{isFr ? 'Mode de remboursement' : 'Refund method'}</span>
                    <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className={inputCls} disabled={submitting}>
                      <option value="">{isFr ? 'Non précisé' : 'Not specified'}</option>
                      <option value="card">{isFr ? 'Carte bancaire' : 'Card'}</option>
                      <option value="bank_transfer">{isFr ? 'Virement bancaire' : 'Bank transfer'}</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </label>
                  <label>
                    <span className={labelCls}>{isFr ? 'Référence du remboursement' : 'Refund reference'}</span>
                    <input type="text" value={refundReference} onChange={(e) => setRefundReference(e.target.value)} className={inputCls} disabled={submitting} />
                  </label>
                </div>
                <label className="block mb-3">
                  <span className={labelCls}>{isFr ? 'Motif (figure sur l\'avoir)' : 'Reason (shown on the credit note)'}</span>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={isFr ? 'ex : Annulation plus de 30 jours avant l\'arrivée' : 'e.g. Cancellation more than 30 days before arrival'}
                    className={inputCls}
                    disabled={submitting}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-night-500 mb-4">
                  <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} disabled={submitting} />
                  {isFr ? 'Envoyer l\'avoir au voyageur (copie à l\'admin)' : 'Email the credit note to the guest (copy to admin)'}
                </label>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setFormOpen(false)} disabled={submitting} className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
                    {isFr ? 'Retour' : 'Back'}
                  </button>
                  <button type="button" onClick={submit} disabled={submitting || !formValid} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
                    {submitting ? <><Loader2 size={14} className="animate-spin" /> {isFr ? 'Émission…' : 'Issuing…'}</> : (isFr ? "Émettre l'avoir" : 'Issue credit note')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
