'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import {
  Check, X, Clock, Mail, Building2, RefreshCw, Banknote,
  AlertCircle, Calendar, Users, CreditCard,
} from 'lucide-react';

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights?: number;
  booking_status: string;
  payment_status: string;
  payment_method: string;
  payment_option: string;
  booking_total: number;
  deposit_amount: number;
  remaining_balance: number;
  total_amount: number;
  currency: string;
  created_at: string;
  apartments?: { name_fr?: string; name_en?: string; title_fr?: string; title_en?: string; slug?: string };
}

export default function AdminBookingsPage() {
  const locale = useLocale();
  const isFr = locale === 'fr';
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_bank_transfer' | 'confirmed' | 'pending' | 'cancelled' | 'completed'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load bookings');
      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : [])
        .map((b: Record<string, unknown>) => ({
          ...b,
          apartments: Array.isArray(b.apartments) ? b.apartments[0] : b.apartments,
        })) as Booking[];
      setBookings(normalized);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const pendingTransfers = bookings.filter(b => b.booking_status === 'pending_bank_transfer');
  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.booking_status === filter);

  async function markBankTransferReceived(bookingId: string) {
    setActionLoading(bookingId);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/bookings/mark-transfer-received', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setSuccessMsg(isFr
        ? `Virement confirmé pour la réservation ${bookingId.slice(0, 8)}…`
        : `Transfer confirmed for booking ${bookingId.slice(0, 8)}…`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchBookings();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setActionLoading(null);
    }
  }

  async function updateStatus(bookingId: string, newStatus: string) {
    setActionLoading(bookingId);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: bookingId, status: newStatus }),
      });
      if (!res.ok) throw new Error('Update failed');
      fetchBookings();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setActionLoading(null);
    }
  }

  function formatAmount(b: Booking): string {
    const amount = b.booking_total || b.total_amount || 0;
    const currency = b.currency || 'USD';
    return currency === 'USD'
      ? `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
      : `${amount.toLocaleString('fr-FR')} €`;
  }

  function getVillaName(b: Booking): string {
    const apt = b.apartments;
    if (!apt) return 'Villa';
    return isFr
      ? (apt.title_fr || apt.name_fr || 'Villa')
      : (apt.title_en || apt.name_en || 'Villa');
  }

  const filterButtons: Array<{ value: typeof filter; label: string }> = [
    { value: 'all', label: isFr ? 'Toutes' : 'All' },
    { value: 'pending_bank_transfer', label: isFr ? 'Virements en attente' : 'Awaiting transfer' },
    { value: 'confirmed', label: isFr ? 'Confirmées' : 'Confirmed' },
    { value: 'pending', label: isFr ? 'En attente' : 'Pending' },
    { value: 'cancelled', label: isFr ? 'Annulées' : 'Cancelled' },
    { value: 'completed', label: isFr ? 'Terminées' : 'Completed' },
  ];

  return (
    <div className="p-6 lg:p-10 bg-sand-100 min-h-full">

      {/* ── En-tête ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="section-label mb-2">{isFr ? 'Back-office' : 'Back-office'}</p>
          <h1 className="font-serif font-light text-night-600 text-3xl md:text-4xl leading-tight">
            {isFr ? 'Réservations' : 'Bookings'}
            {!loading && <span className="ml-3 text-base text-night-300 font-light">({bookings.length})</span>}
          </h1>
        </div>
        <button
          onClick={fetchBookings}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase font-medium text-night-500 bg-cream-100 border border-bronze-100 hover:border-bronze-400 hover:text-bronze-500 transition-all rounded-md"
          style={{ letterSpacing: '0.15em' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          {isFr ? 'Actualiser' : 'Refresh'}
        </button>
      </div>

      {/* ── Messages ──────────────────────────────────────────────── */}
      {successMsg && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2" role="status">
          <Check size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2" role="alert">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* ── Section "À traiter" : virements en attente ─────────── */}
      {pendingTransfers.length > 0 && filter === 'all' && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Banknote size={18} className="text-bronze-500" />
            <p className="section-label">{isFr ? `À traiter — ${pendingTransfers.length} virement${pendingTransfers.length > 1 ? 's' : ''} en attente` : `To process — ${pendingTransfers.length} pending transfer${pendingTransfers.length > 1 ? 's' : ''}`}</p>
          </div>
          <div className="space-y-3">
            {pendingTransfers.map(b => (
              <PendingTransferCard
                key={b.id}
                booking={b}
                villaName={getVillaName(b)}
                amount={formatAmount(b)}
                isFr={isFr}
                onConfirm={() => markBankTransferReceived(b.id)}
                loading={actionLoading === b.id}
              />
            ))}
          </div>
          <div className="my-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-bronze-100" />
            <div className="w-1 h-1 rounded-full bg-bronze-200" />
            <div className="h-px w-8 bg-bronze-100" />
          </div>
        </section>
      )}

      {/* ── Filtres ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filterButtons.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-[11px] uppercase font-medium transition-all rounded-md whitespace-nowrap ${
              filter === f.value
                ? 'bg-night-600 text-cream-100'
                : 'bg-cream-100 text-night-500 border border-bronze-100 hover:border-bronze-300'
            }`}
            style={{ letterSpacing: '0.12em' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Liste ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-cream-100 rounded-xl p-6 border border-bronze-100 animate-pulse">
              <div className="h-5 bg-sand-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-sand-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-cream-100 rounded-xl border border-bronze-100">
          <AlertCircle size={28} className="mx-auto mb-3 text-bronze-300" />
          <p className="text-night-400 font-light">{isFr ? 'Aucune réservation' : 'No bookings'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              villaName={getVillaName(b)}
              amount={formatAmount(b)}
              isFr={isFr}
              actionLoading={actionLoading === b.id}
              onMarkTransfer={() => markBankTransferReceived(b.id)}
              onConfirm={() => updateStatus(b.id, 'confirmed')}
              onCancel={() => updateStatus(b.id, 'cancelled')}
              onComplete={() => updateStatus(b.id, 'completed')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── PendingTransferCard : mise en avant des virements à confirmer ────────
function PendingTransferCard({
  booking, villaName, amount, isFr, onConfirm, loading,
}: {
  booking: Booking;
  villaName: string;
  amount: string;
  isFr: boolean;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="bg-night-600 text-cream-100 rounded-xl p-6 border border-night-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="font-serif text-lg text-cream-100">{booking.guest_name}</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-bronze-500/30 text-bronze-200 rounded text-[10px] uppercase font-medium" style={{ letterSpacing: '0.1em' }}>
              <Banknote size={11} /> {isFr ? 'Virement en attente' : 'Awaiting transfer'}
            </span>
          </div>
          <div className="text-sm text-cream-100/80 flex flex-wrap gap-x-5 gap-y-1 font-light">
            <span className="flex items-center gap-1.5"><Building2 size={12} className="text-bronze-300" /> {villaName}</span>
            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-bronze-300" /> {booking.check_in} → {booking.check_out}</span>
            <span className="flex items-center gap-1.5"><Users size={12} className="text-bronze-300" /> {booking.guests}</span>
            <span className="flex items-center gap-1.5"><Mail size={12} className="text-bronze-300" /> {booking.guest_email}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <p className="text-[10px] uppercase text-bronze-300 mb-0.5" style={{ letterSpacing: '0.15em' }}>
              {isFr ? 'À recevoir' : 'Expected'}
            </p>
            <p className="font-serif font-light text-2xl">{amount}</p>
          </div>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-bronze-400 text-cream-100 hover:bg-bronze-500 transition-colors text-xs font-medium uppercase rounded-md disabled:opacity-50 disabled:cursor-wait"
            style={{ letterSpacing: '0.12em' }}
          >
            <Check size={14} />
            {loading
              ? (isFr ? 'Traitement…' : 'Processing…')
              : (isFr ? 'Virement reçu' : 'Transfer received')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BookingCard : carte standard ──────────────────────────────────────────
function BookingCard({
  booking, villaName, amount, isFr,
  actionLoading, onMarkTransfer, onConfirm, onCancel, onComplete,
}: {
  booking: Booking;
  villaName: string;
  amount: string;
  isFr: boolean;
  actionLoading: boolean;
  onMarkTransfer: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
}) {
  const statusConfig: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
    confirmed:             { label: isFr ? 'Confirmée' : 'Confirmed',                   classes: 'bg-green-50 text-green-700 border-green-200',     icon: <Check size={11} /> },
    pending:               { label: isFr ? 'En attente' : 'Pending',                    classes: 'bg-amber-50 text-amber-700 border-amber-200',     icon: <Clock size={11} /> },
    pending_bank_transfer: { label: isFr ? 'Virement en attente' : 'Awaiting transfer', classes: 'bg-bronze-50 text-bronze-600 border-bronze-200',  icon: <Banknote size={11} /> },
    cancelled:             { label: isFr ? 'Annulée' : 'Cancelled',                     classes: 'bg-red-50 text-red-600 border-red-200',           icon: <X size={11} /> },
    completed:             { label: isFr ? 'Terminée' : 'Completed',                    classes: 'bg-night-50 text-night-500 border-night-100',     icon: <Check size={11} /> },
  };
  const status = statusConfig[booking.booking_status] || statusConfig.pending;

  const paymentStatusLabel: Record<string, string> = {
    paid:                  isFr ? 'Payée' : 'Paid',
    partially_paid:        isFr ? 'Acompte payé' : '40% paid',
    pending:               isFr ? 'En attente' : 'Pending',
    pending_bank_transfer: isFr ? 'Virement en attente' : 'Awaiting transfer',
    failed:                isFr ? 'Échec' : 'Failed',
    cancelled:             isFr ? 'Annulé' : 'Cancelled',
    mismatch:              isFr ? 'Montant incohérent' : 'Amount mismatch',
  };

  return (
    <div className="bg-cream-100 rounded-xl border border-bronze-100 p-6 hover:border-bronze-200 transition-colors">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <h3 className="font-serif text-lg text-night-600">{booking.guest_name}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded text-[10px] uppercase font-medium ${status.classes}`} style={{ letterSpacing: '0.1em' }}>
              {status.icon}
              {status.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cream-50 border border-bronze-100 text-night-500 rounded text-[10px] uppercase font-medium" style={{ letterSpacing: '0.1em' }}>
              {booking.payment_method === 'bank_transfer' ? <Banknote size={10} /> : <CreditCard size={10} />}
              {booking.payment_method === 'bank_transfer' ? (isFr ? 'Virement' : 'Wire') : 'PayPal'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
            <Field label={isFr ? 'Villa' : 'Villa'} value={villaName} />
            <Field label={isFr ? 'Arrivée' : 'Check-in'} value={booking.check_in} />
            <Field label={isFr ? 'Départ' : 'Check-out'} value={booking.check_out} />
            <Field label={isFr ? 'Voyageurs' : 'Guests'} value={`${booking.guests}`} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-night-400 font-light">
            <span className="inline-flex items-center gap-1"><Mail size={11} className="text-bronze-400" /> {booking.guest_email}</span>
            <span className="text-night-300">·</span>
            <span className="font-mono text-night-300">{booking.id.slice(0, 8)}…</span>
            <span className="text-night-300">·</span>
            <span>{new Date(booking.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</span>
          </div>
        </div>

        <div className="md:text-right flex flex-col items-start md:items-end gap-3 md:ml-4 flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase text-night-400 mb-0.5" style={{ letterSpacing: '0.15em' }}>
              {isFr ? 'Montant' : 'Amount'}
            </p>
            <p className="font-serif text-2xl text-night-600 leading-none">{amount}</p>
            <p className="text-xs text-bronze-500 mt-1 font-medium">
              {paymentStatusLabel[booking.payment_status] || booking.payment_status}
            </p>
            {booking.payment_option === 'deposit_40' && booking.remaining_balance > 0 && (
              <p className="text-[10px] text-night-400 mt-0.5 font-light">
                {isFr ? 'Solde' : 'Balance'} : ${booking.remaining_balance?.toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            {booking.booking_status === 'pending_bank_transfer' && (
              <button
                onClick={onMarkTransfer}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-bronze-400 text-cream-100 hover:bg-bronze-500 transition-colors text-[11px] uppercase font-medium rounded disabled:opacity-50"
                style={{ letterSpacing: '0.1em' }}
              >
                <Banknote size={12} />
                {actionLoading ? '…' : (isFr ? 'Virement reçu' : 'Transfer received')}
              </button>
            )}
            {booking.booking_status === 'pending' && (
              <>
                <button
                  onClick={onConfirm}
                  disabled={actionLoading}
                  className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors text-[11px] uppercase font-medium rounded disabled:opacity-50"
                  style={{ letterSpacing: '0.1em' }}
                >
                  {isFr ? 'Confirmer' : 'Confirm'}
                </button>
                <button
                  onClick={onCancel}
                  disabled={actionLoading}
                  className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-[11px] uppercase font-medium rounded disabled:opacity-50"
                  style={{ letterSpacing: '0.1em' }}
                >
                  {isFr ? 'Refuser' : 'Decline'}
                </button>
              </>
            )}
            {booking.booking_status === 'confirmed' && (
              <button
                onClick={onComplete}
                disabled={actionLoading}
                className="px-3 py-2 border border-bronze-200 text-night-500 hover:bg-cream-50 hover:border-bronze-300 transition-colors text-[11px] uppercase font-medium rounded disabled:opacity-50"
                style={{ letterSpacing: '0.1em' }}
              >
                {isFr ? 'Marquer terminée' : 'Mark completed'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-night-400 mb-0.5" style={{ letterSpacing: '0.15em' }}>{label}</p>
      <p className="text-night-600 font-medium">{value}</p>
    </div>
  );
}
