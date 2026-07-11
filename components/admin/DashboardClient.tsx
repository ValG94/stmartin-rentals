'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Home, Calendar, TrendingUp, DollarSign, Clock, ChevronDown, Wallet,
  ChevronLeft, ChevronRight, Trash2, Loader2, X,
} from 'lucide-react';

interface BookingRow {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  booking_total: number;
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
  totalCollected: number;
}

const STATUS_CONFIG: Record<string, { label_fr: string; label_en: string; class: string }> = {
  confirmed: { label_fr: 'Confirmée',  label_en: 'Confirmed',  class: 'bg-green-100 text-green-700' },
  pending:   { label_fr: 'En attente', label_en: 'Pending',    class: 'bg-yellow-100 text-yellow-700' },
  cancelled: { label_fr: 'Annulée',    label_en: 'Cancelled',  class: 'bg-red-100 text-red-700' },
  completed: { label_fr: 'Terminée',   label_en: 'Completed',  class: 'bg-blue-100 text-blue-700' },
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
        <ChevronDown size={12} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
      </div>
    </div>
  );
}

import VillaPlanning from './VillaPlanning';
import type { ApartmentRow, PlanningBooking, PlanningBlock } from './DashboardData';

export default function DashboardClient({
  stats: initialStats,
  recentBookings: initialBookings,
  locale,
  apartments,
  planningBookings,
  planningBlocks,
}: {
  stats: DashboardStats;
  recentBookings: BookingRow[];
  locale: string;
  apartments: ApartmentRow[];
  planningBookings: PlanningBooking[];
  planningBlocks: PlanningBlock[];
}) {
  const isFr = locale === 'fr';
  const [stats, setStats] = useState(initialStats);
  const [bookings, setBookings] = useState(initialBookings);

  // ── Pagination + multi-select ────────────────────────────────────────
  // 10 par page. Multi-select géré via un Set d'IDs pour supporter la
  // sélection cross-page (le compteur reste juste même quand on paginate).
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchDeleteModal, setBatchDeleteModal] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState('');

  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const currentPageBookings = useMemo(
    () => bookings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [bookings, page]
  );

  // "Tout sélectionner" sur la page courante
  const allOnPageSelected =
    currentPageBookings.length > 0 &&
    currentPageBookings.every((b) => selected.has(b.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function togglePageAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        currentPageBookings.forEach((b) => next.delete(b.id));
      } else {
        currentPageBookings.forEach((b) => next.add(b.id));
      }
      return next;
    });
  }

  async function confirmBatchDelete() {
    setBatchLoading(true);
    setBatchError('');
    try {
      const res = await fetch('/api/admin/bookings/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch delete failed');
      // Retire les IDs supprimés de la liste locale sans recharger
      setBookings((prev) => prev.filter((b) => !selected.has(b.id)));
      setSelected(new Set());
      setBatchDeleteModal(false);
      // Rewind d'une page si la page courante est devenue vide
      const newTotalPages = Math.max(1, Math.ceil((bookings.length - data.deleted) / PAGE_SIZE));
      if (page >= newTotalPages) setPage(newTotalPages - 1);
    } catch (e: unknown) {
      setBatchError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBatchLoading(false);
    }
  }

  const handleStatusUpdate = (id: string, newStatus: string) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    const old = booking.booking_status;
    setBookings(prev => prev.map(b => b.id === id ? { ...b, booking_status: newStatus } : b));
    setStats(prev => ({
      ...prev,
      confirmedBookings: prev.confirmedBookings + (newStatus === 'confirmed' ? 1 : 0) - (old === 'confirmed' ? 1 : 0),
      pendingBookings:   prev.pendingBookings   + (newStatus === 'pending'   ? 1 : 0) - (old === 'pending'   ? 1 : 0),
      cancelledBookings: prev.cancelledBookings + (newStatus === 'cancelled' ? 1 : 0) - (old === 'cancelled' ? 1 : 0),
      totalRevenue: (() => {
        // CA total : booking_total (= prix complet du séjour), fallback total_amount
        const amount = booking.booking_total || booking.total_amount || 0;
        if (newStatus === 'confirmed' && old !== 'confirmed') return prev.totalRevenue + amount;
        if (old === 'confirmed' && newStatus !== 'confirmed') return prev.totalRevenue - amount;
        return prev.totalRevenue;
      })(),
    }));
  };

  const fmtDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const fmtMoney = (n: number) =>
    isFr ? `${n.toLocaleString('fr-FR')} $` : `$${n.toLocaleString('en-US')}`;

  // Chaque KPI card est un raccourci cliquable vers la page pertinente.
  // Les 3 cards liées aux résas confirmées (Confirmed, Confirmed revenue,
  // Collected) pointent vers /admin/bookings avec le filtre correspondant
  // pré-appliqué via query param.
  const kpis: Array<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    sub?: string;
    href: string;
  }> = [
    {
      label: isFr ? 'Appartements' : 'Apartments',
      value: stats.apartments,
      icon: <Home size={22} />,
      color: 'bg-blue-500',
      href: `/${locale}/admin/apartments`,
    },
    {
      label: isFr ? 'Réservations' : 'Bookings',
      value: stats.totalBookings,
      icon: <Calendar size={22} />,
      color: 'bg-green-500',
      href: `/${locale}/admin/bookings`,
    },
    {
      label: isFr ? 'Confirmées' : 'Confirmed',
      value: stats.confirmedBookings,
      icon: <TrendingUp size={22} />,
      color: 'bg-[#B08B52]',
      sub: stats.pendingBookings > 0 ? `${stats.pendingBookings} ${isFr ? 'en attente' : 'pending'}` : undefined,
      href: `/${locale}/admin/bookings?status=confirmed`,
    },
    {
      label: isFr ? 'CA confirmé ($)' : 'Confirmed revenue ($)',
      value: fmtMoney(stats.totalRevenue),
      icon: <DollarSign size={22} />,
      color: 'bg-amber-500',
      sub: isFr ? 'total des séjours confirmés' : 'total of confirmed stays',
      href: `/${locale}/admin/bookings?status=confirmed`,
    },
    {
      label: isFr ? 'Encaissé ($)' : 'Collected ($)',
      value: fmtMoney(stats.totalCollected),
      icon: <Wallet size={22} />,
      color: 'bg-emerald-600',
      sub: stats.totalRevenue > 0
        ? `${Math.round((stats.totalCollected / stats.totalRevenue) * 100)}% ${isFr ? 'du CA' : 'of revenue'}`
        : (isFr ? 'paiements reçus' : 'payments received'),
      href: `/${locale}/admin/bookings`,
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isFr ? 'Tableau de bord' : 'Dashboard'}
        </h1>
      </div>

      {/* KPIs — chaque card est un raccourci cliquable vers sa page */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <Link
            key={i}
            href={kpi.href}
            className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#B08B52]/40"
          >
            <div className={`w-10 h-10 ${kpi.color} rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform`}>
              {kpi.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
            <div className="text-sm text-gray-500 mt-1">{kpi.label}</div>
            {kpi.sub && <div className="text-xs text-gray-400 mt-0.5">{kpi.sub}</div>}
          </Link>
        ))}
      </div>

      {/* Planning des villas */}
      <div className="mb-8">
        <VillaPlanning
          apartments={apartments}
          bookings={planningBookings}
          blocks={planningBlocks}
          locale={locale}
        />
      </div>

      {/* Tableau réservations */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-bold text-gray-900 text-lg">
            {isFr ? 'Toutes les réservations' : 'All bookings'}
            <span className="ml-2 text-xs font-normal text-gray-400">({bookings.length})</span>
          </h2>
          {stats.pendingBookings > 0 && (
            <span className="flex items-center gap-1.5 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-full font-medium">
              <Clock size={12} />
              {stats.pendingBookings} {isFr ? 'en attente' : 'pending'}
            </span>
          )}
        </div>

        {/* Barre d'action batch — affichée uniquement si sélection active */}
        {selected.size > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-red-800 font-medium">
                {selected.size} {isFr ? 'sélectionnée(s)' : 'selected'}
              </span>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-red-600 hover:text-red-800 text-xs underline"
              >
                {isFr ? 'Tout désélectionner' : 'Clear selection'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setBatchDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
            >
              <Trash2 size={12} />
              {isFr ? 'Supprimer la sélection' : 'Delete selected'}
            </button>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>{isFr ? 'Aucune réservation pour le moment' : 'No bookings yet'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 pr-2 w-8">
                      <input
                        type="checkbox"
                        checked={allOnPageSelected}
                        onChange={togglePageAll}
                        aria-label={isFr ? 'Tout sélectionner sur cette page' : 'Select all on this page'}
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                    </th>
                    <th className="pb-3 font-medium">{isFr ? 'Client' : 'Guest'}</th>
                    <th className="pb-3 font-medium">Villa</th>
                    <th className="pb-3 font-medium">{isFr ? 'Arrivée' : 'Check-in'}</th>
                    <th className="pb-3 font-medium">{isFr ? 'Départ' : 'Check-out'}</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentPageBookings.map(b => {
                    const villaName = b.apartments
                      ? (isFr ? b.apartments.title_fr : b.apartments.title_en)
                      : b.apartment_id;
                    const isSelected = selected.has(b.id);
                    return (
                      <tr
                        key={b.id}
                        className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-red-50/50' : ''}`}
                      >
                        <td className="py-3 pr-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(b.id)}
                            aria-label={`${isFr ? 'Sélectionner' : 'Select'} ${b.guest_name}`}
                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3">
                          <div className="font-medium text-gray-900">{b.guest_name}</div>
                          <div className="text-xs text-gray-400">{b.guest_email}</div>
                        </td>
                        <td className="py-3 text-gray-600">{villaName}</td>
                        <td className="py-3 text-gray-600">{fmtDate(b.check_in)}</td>
                        <td className="py-3 text-gray-600">{fmtDate(b.check_out)}</td>
                        <td className="py-3 font-semibold text-gray-900">{fmtMoney(b.booking_total || b.total_amount)}</td>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
                <span>
                  {isFr
                    ? `Affichage ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, bookings.length)} sur ${bookings.length}`
                    : `Showing ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, bookings.length)} of ${bookings.length}`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={isFr ? 'Précédent' : 'Previous'}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs font-medium text-gray-600 min-w-[60px] text-center">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={isFr ? 'Suivant' : 'Next'}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de confirmation batch delete */}
      {batchDeleteModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
          onClick={() => !batchLoading && setBatchDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-xl text-night-600 leading-tight">
                  {isFr ? 'Supprimer définitivement' : 'Delete permanently'}
                </h3>
                <p className="text-sm text-night-400 mt-1">
                  {isFr
                    ? `${selected.size} réservation(s) vont être supprimées de la base. Les dates seront libérées. Cette action est irréversible.`
                    : `${selected.size} booking(s) will be permanently removed. Dates will be released. This action cannot be undone.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBatchDeleteModal(false)}
                disabled={batchLoading}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
              ⚠️ {isFr
                ? 'Aucun email ne sera envoyé aux voyageurs (contrairement au bouton « Annuler + email »). Utilise cette suppression pour les réservations obsolètes ou de test uniquement.'
                : 'No email will be sent to guests (unlike the "Cancel + email" button). Use this deletion for obsolete or test bookings only.'}
            </div>

            {batchError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                {batchError}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setBatchDeleteModal(false)}
                disabled={batchLoading}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isFr ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmBatchDelete}
                disabled={batchLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {batchLoading
                  ? <><Loader2 size={14} className="animate-spin" /> {isFr ? 'Suppression…' : 'Deleting…'}</>
                  : <><Trash2 size={14} /> {isFr ? 'Supprimer' : 'Delete'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
