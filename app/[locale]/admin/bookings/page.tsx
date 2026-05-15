'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@supabase/supabase-js';
import { Check, X, Clock, Mail, DollarSign, Building2, RefreshCw, Banknote, AlertCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests: number;
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
  apartments?: { name_fr: string; name_en: string; slug: string };
}

export default function AdminBookingsPage() {
  const locale = useLocale();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, guest_name, guest_email, check_in, check_out, guests,
        booking_status, payment_status, payment_method, payment_option,
        booking_total, deposit_amount, remaining_balance, total_amount,
        currency, created_at,
        apartments:apartment_id (name_fr, name_en, slug)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) setBookings(data.map((b: Record<string, unknown>) => ({ ...b, apartments: Array.isArray(b.apartments) ? b.apartments[0] : b.apartments })) as Booking[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.booking_status === filter);

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    confirmed:             { label: locale === 'fr' ? 'Confirmée' : 'Confirmed',           color: 'bg-green-100 text-green-700',   icon: <Check size={13} /> },
    pending:               { label: locale === 'fr' ? 'En attente' : 'Pending',            color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={13} /> },
    pending_bank_transfer: { label: locale === 'fr' ? 'Virement en attente' : 'Awaiting transfer', color: 'bg-blue-100 text-blue-700', icon: <Banknote size={13} /> },
    cancelled:             { label: locale === 'fr' ? 'Annulée' : 'Cancelled',             color: 'bg-red-100 text-red-700',       icon: <X size={13} /> },
    completed:             { label: locale === 'fr' ? 'Terminée' : 'Completed',            color: 'bg-gray-100 text-gray-600',     icon: <Check size={13} /> },
  };

  const paymentStatusConfig: Record<string, { label: string; color: string }> = {
    paid:                  { label: 'Paid',              color: 'text-green-600' },
    partially_paid:        { label: '40% paid',          color: 'text-amber-600' },
    pending:               { label: 'Pending',           color: 'text-gray-400' },
    pending_bank_transfer: { label: 'Awaiting transfer', color: 'text-blue-600' },
    failed:                { label: 'Failed',            color: 'text-red-500' },
    cancelled:             { label: 'Cancelled',         color: 'text-red-400' },
  };

  async function markBankTransferReceived(bookingId: string) {
    setActionLoading(bookingId);
    try {
      const res = await fetch('/api/admin/bookings/mark-transfer-received', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setSuccessMsg(`Booking ${bookingId.slice(0, 8)}... confirmed ✓`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchBookings();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setActionLoading(null);
    }
  }

  async function updateStatus(bookingId: string, newStatus: string) {
    setActionLoading(bookingId);
    await supabase
      .from('bookings')
      .update({ booking_status: newStatus })
      .eq('id', bookingId);
    setActionLoading(null);
    fetchBookings();
  }

  function formatAmount(booking: Booking): string {
    const amount = booking.booking_total || booking.total_amount || 0;
    const currency = booking.currency || 'USD';
    return currency === 'USD' ? `$${amount.toLocaleString()}` : `${amount.toLocaleString()} €`;
  }

  const filterButtons = ['all', 'confirmed', 'pending', 'pending_bank_transfer', 'cancelled', 'completed'];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {locale === 'fr' ? 'Réservations' : 'Bookings'}
          {!loading && <span className="ml-2 text-sm font-normal text-gray-400">({bookings.length})</span>}
        </h1>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {locale === 'fr' ? 'Actualiser' : 'Refresh'}
        </button>
      </div>

      {/* Message de succès */}
      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <Check size={16} />
          {successMsg}
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-6">
        {filterButtons.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
              ${filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            {f === 'all'
              ? (locale === 'fr' ? 'Toutes' : 'All')
              : (statusConfig[f]?.label || f)}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-5 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
          <p>{locale === 'fr' ? 'Aucune réservation' : 'No bookings found'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => {
            const status = statusConfig[booking.booking_status] || statusConfig['pending'];
            const payStatus = paymentStatusConfig[booking.payment_status] || { label: booking.payment_status, color: 'text-gray-400' };
            const villaName = locale === 'fr'
              ? (booking.apartments?.name_fr || 'Villa')
              : (booking.apartments?.name_en || 'Villa');

            return (
              <div key={booking.id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-50">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Infos voyageur */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base">{booking.guest_name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      {booking.payment_method === 'bank_transfer' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600">
                          <Banknote size={11} /> Wire transfer
                        </span>
                      )}
                      {booking.payment_method === 'paypal' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-600">
                          PayPal
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">{locale === 'fr' ? 'Villa' : 'Villa'}</div>
                        <div className="font-medium flex items-center gap-1">
                          <Building2 size={12} className="text-amber-500" />
                          {villaName}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">{locale === 'fr' ? 'Arrivée' : 'Check-in'}</div>
                        <div className="font-medium">{booking.check_in}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">{locale === 'fr' ? 'Départ' : 'Check-out'}</div>
                        <div className="font-medium">{booking.check_out}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">{locale === 'fr' ? 'Voyageurs' : 'Guests'}</div>
                        <div className="font-medium">{booking.guests} {locale === 'fr' ? 'pers.' : 'pax'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Mail size={12} /> {booking.guest_email}</span>
                    </div>

                    <div className="mt-2 text-xs text-gray-400">
                      Ref: <span className="font-mono">{booking.id.slice(0, 8)}...</span>
                      {' · '}
                      {new Date(booking.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                    </div>
                  </div>

                  {/* Montants + actions */}
                  <div className="md:text-right md:ml-4 flex flex-col items-start md:items-end gap-2">
                    <div className="text-xl font-bold text-gray-900 flex items-center gap-1">
                      <DollarSign size={16} className="text-amber-500" />
                      {formatAmount(booking)}
                    </div>
                    <div className={`text-xs font-medium ${payStatus.color}`}>
                      {payStatus.label}
                      {booking.payment_option === 'deposit_40' && booking.remaining_balance > 0 && (
                        <span className="text-gray-400 ml-1">
                          (balance: ${booking.remaining_balance?.toLocaleString()})
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap mt-1">
                      {/* Virement en attente → Marquer comme reçu */}
                      {booking.booking_status === 'pending_bank_transfer' && (
                        <button
                          onClick={() => markBankTransferReceived(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Banknote size={12} />
                          {actionLoading === booking.id ? '...' : (locale === 'fr' ? 'Virement reçu ✓' : 'Transfer received ✓')}
                        </button>
                      )}

                      {/* Pending → Confirmer / Refuser */}
                      {booking.booking_status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(booking.id, 'confirmed')}
                            disabled={actionLoading === booking.id}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {locale === 'fr' ? 'Confirmer' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => updateStatus(booking.id, 'cancelled')}
                            disabled={actionLoading === booking.id}
                            className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-medium rounded-lg hover:bg-red-200 disabled:opacity-50"
                          >
                            {locale === 'fr' ? 'Refuser' : 'Decline'}
                          </button>
                        </>
                      )}

                      {/* Confirmed → Marquer terminée */}
                      {booking.booking_status === 'confirmed' && (
                        <button
                          onClick={() => updateStatus(booking.id, 'completed')}
                          disabled={actionLoading === booking.id}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
                        >
                          {locale === 'fr' ? 'Marquer terminée' : 'Mark completed'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
