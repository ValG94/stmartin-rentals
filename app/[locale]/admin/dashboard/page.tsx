'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { Home, Calendar, TrendingUp, DollarSign, Clock, XCircle, RefreshCw, ChevronDown } from 'lucide-react';

interface BookingRow {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  booking_status: string;
  created_at: string;
  apartment_id: string;
  apartments?: { title_fr: string; title_en: string; slug: string } | null;
}

interface DashboardStats {
  apartments: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
}

const STATUS_CONFIG: Record<string, { label_fr: string; label_en: string; class: string }> = {
  confirmed: { label_fr: 'Confirmée', label_en: 'Confirmed', class: 'bg-green-100 text-green-700' },
  pending:   { label_fr: 'En attente', label_en: 'Pending',   class: 'bg-yellow-100 text-yellow-700' },
  cancelled: { label_fr: 'Annulée',   label_en: 'Cancelled', class: 'bg-red-100 text-red-700' },
  completed: { label_fr: 'Terminée',  label_en: 'Completed', class: 'bg-blue-100 text-blue-700' },
};

function StatusBadge({ status, locale }: { status: string; locale: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label_fr: status, label_en: status, class: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.class}`}>
      {locale === 'fr' ? cfg.label_fr : cfg.label_en}
    </span>
  );
}

function StatusSelect({
  bookingId, current, locale, onUpdate,
}: {
  bookingId: string; current: string; locale: string; onUpdate: (id: string, status: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleChange = async (newStatus: string) => {
    if (newStatus === current) return;
    setLoading(true);
    try {
      await fetch('/api/admin/bookings', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status: newStatus }),
      });
      onUpdate(bookingId, newStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-1">
      <StatusBadge status={current} locale={locale} />
      <div className="relative">
        <select
          value={current}
          onChange={(e) => handleChange(e.target.value)}
          disabled={loading}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
        >
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>
              {locale === 'fr' ? cfg.label_fr : cfg.label_en}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="text-gray-400" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const locale = useLocale();
  const isFr = locale === 'fr';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Le cookie admin_token (httpOnly) est envoyé automatiquement par le navigateur
      const res = await fetch('/api/admin/stats', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erreur de chargement');
      const json = await res.json();
      setStats(json.stats);
      setBookings(json.recentBookings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = (id: string, newStatus: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, booking_status: newStatus } : b))
    );
    // Mettre à jour les stats localement
    setStats((prev) => {
      if (!prev) return prev;
      const booking = bookings.find((b) => b.id === id);
      if (!booking) return prev;
      const oldStatus = booking.booking_status;
      return {
        ...prev,
        confirmedBookings:
          prev.confirmedBookings +
          (newStatus === 'confirmed' ? 1 : 0) -
          (oldStatus === 'confirmed' ? 1 : 0),
        pendingBookings:
          prev.pendingBookings +
          (newStatus === 'pending' ? 1 : 0) -
          (oldStatus === 'pending' ? 1 : 0),
        cancelledBookings:
          prev.cancelledBookings +
          (newStatus === 'cancelled' ? 1 : 0) -
          (oldStatus === 'cancelled' ? 1 : 0),
        totalRevenue:
          newStatus === 'confirmed' && oldStatus !== 'confirmed'
            ? prev.totalRevenue + (booking.total_amount || 0)
            : oldStatus === 'confirmed' && newStatus !== 'confirmed'
            ? prev.totalRevenue - (booking.total_amount || 0)
            : prev.totalRevenue,
      };
    });
  };

  const fmtDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const fmtMoney = (n: number) =>
    isFr
      ? `${n.toLocaleString('fr-FR')} $`
      : `$${n.toLocaleString('en-US')}`;

  const kpis = stats
    ? [
        {
          label: isFr ? 'Appartements' : 'Apartments',
          value: stats.apartments,
          icon: <Home size={22} />,
          color: 'bg-blue-500',
        },
        {
          label: isFr ? 'Réservations' : 'Bookings',
          value: stats.totalBookings,
          icon: <Calendar size={22} />,
          color: 'bg-green-500',
        },
        {
          label: isFr ? 'Confirmées' : 'Confirmed',
          value: stats.confirmedBookings,
          icon: <TrendingUp size={22} />,
          color: 'bg-[#B08B52]',
          sub: stats.pendingBookings > 0
            ? `${stats.pendingBookings} ${isFr ? 'en attente' : 'pending'}`
            : undefined,
        },
        {
          label: isFr ? 'Revenus ($)' : 'Revenue ($)',
          value: fmtMoney(stats.totalRevenue),
          icon: <DollarSign size={22} />,
          color: 'bg-amber-500',
          sub: isFr ? 'réservations confirmées' : 'confirmed bookings',
        },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isFr ? 'Tableau de bord' : 'Dashboard'}
        </h1>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {isFr ? 'Actualiser' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
          <XCircle size={16} />
          {error}
        </div>
      )}

      {/* KPIs */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-xl mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className={`w-10 h-10 ${kpi.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                {kpi.icon}
              </div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-sm text-gray-500 mt-1">{kpi.label}</div>
              {kpi.sub && (
                <div className="text-xs text-gray-400 mt-0.5">{kpi.sub}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tableau réservations */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-lg">
            {isFr ? 'Dernières réservations' : 'Recent bookings'}
          </h2>
          {stats && stats.pendingBookings > 0 && (
            <span className="flex items-center gap-1.5 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-full font-medium">
              <Clock size={12} />
              {stats.pendingBookings} {isFr ? 'en attente' : 'pending'}
            </span>
          )}
        </div>

        {loading && bookings.length === 0 ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>{isFr ? 'Aucune réservation pour le moment' : 'No bookings yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">{isFr ? 'Client' : 'Guest'}</th>
                  <th className="pb-3 font-medium">{isFr ? 'Villa' : 'Villa'}</th>
                  <th className="pb-3 font-medium">{isFr ? 'Arrivée' : 'Check-in'}</th>
                  <th className="pb-3 font-medium">{isFr ? 'Départ' : 'Check-out'}</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => {
                  const villaName = b.apartments
                    ? (isFr ? b.apartments.title_fr : b.apartments.title_en)
                    : b.apartment_id;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3">
                        <div className="font-medium text-gray-900">{b.guest_name}</div>
                        <div className="text-xs text-gray-400">{b.guest_email}</div>
                      </td>
                      <td className="py-3 text-gray-600">{villaName}</td>
                      <td className="py-3 text-gray-600">{fmtDate(b.check_in)}</td>
                      <td className="py-3 text-gray-600">{fmtDate(b.check_out)}</td>
                      <td className="py-3 font-semibold text-gray-900">
                        {fmtMoney(b.total_amount)}
                      </td>
                      <td className="py-3">
                        <StatusSelect
                          bookingId={b.id}
                          current={b.booking_status}
                          locale={locale}
                          onUpdate={handleStatusUpdate}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
