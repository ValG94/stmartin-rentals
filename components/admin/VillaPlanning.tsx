'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar, Plus, Trash2, X, Loader2 } from 'lucide-react';
import type { ApartmentRow, PlanningBooking, PlanningBlock } from './DashboardData';

interface Props {
  apartments: ApartmentRow[];
  bookings: PlanningBooking[];
  blocks: PlanningBlock[];
  locale: string;
}

type CellType = 'free' | 'confirmed' | 'partially_paid' | 'pending_bank_transfer' | 'pending' | 'blocked' | 'external' | 'direct' | 'maintenance';

interface DayCell {
  date: string;       // YYYY-MM-DD
  inMonth: boolean;
  type: CellType;
  booking?: PlanningBooking;
  block?: PlanningBlock;
  isStart?: boolean;
  isEnd?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Helpers de date
// ─────────────────────────────────────────────────────────────
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isDayInRange(day: string, start: string, end: string): boolean {
  // Une booking 2025-05-24 → 2025-05-29 occupe les nuits du 24, 25, 26, 27, 28
  // (le checkout = jour de départ, pas une nuit occupée)
  return day >= start && day < end;
}

// ─────────────────────────────────────────────────────────────
// Calcul de la grille du mois
// ─────────────────────────────────────────────────────────────
function buildMonthGrid(
  year: number,
  month: number,
  apartmentId: string,
  bookings: PlanningBooking[],
  blocks: PlanningBlock[],
): DayCell[] {
  const firstOfMonth = new Date(year, month, 1);
  // 0=lun ... 6=dim
  const firstDow = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: DayCell[] = [];

  // Cellules vides avant le 1er
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthDays - i);
    cells.push({ date: toDateStr(d), inMonth: false, type: 'free' });
  }

  // Jours du mois
  for (let day = 1; day <= daysInMonth; day++) {
    const date = toDateStr(new Date(year, month, day));
    const booking = bookings.find(
      (b) => b.apartment_id === apartmentId && isDayInRange(date, b.check_in, b.check_out),
    );
    const block = blocks.find(
      (bk) => bk.apartment_id === apartmentId && isDayInRange(date, bk.start_date, bk.end_date),
    );

    let type: CellType = 'free';
    if (booking) {
      type = booking.booking_status as CellType;
    } else if (block) {
      if (block.source && block.source !== 'manual') type = 'external';      // Airbnb / VRBO
      else if (block.block_type === 'booking') type = 'direct';              // résa directe
      else if (block.block_type === 'maintenance') type = 'maintenance';
      else type = 'blocked';                                                 // propriétaire
    }

    cells.push({
      date,
      inMonth: true,
      type,
      booking,
      block,
      isStart: booking ? date === booking.check_in : block ? date === block.start_date : false,
      isEnd: booking ? date === toDateStr(new Date(parseDate(booking.check_out).getTime() - 86400000)) : false,
    });
  }

  // Compléter la dernière rangée avec le mois suivant
  while (cells.length % 7 !== 0) {
    const lastDate = parseDate(cells[cells.length - 1].date);
    lastDate.setDate(lastDate.getDate() + 1);
    cells.push({ date: toDateStr(lastDate), inMonth: false, type: 'free' });
  }

  return cells;
}

// ─────────────────────────────────────────────────────────────
// Styles par type de cellule
// ─────────────────────────────────────────────────────────────
function cellClasses(type: CellType, inMonth: boolean): string {
  if (!inMonth) return 'bg-transparent text-night-200';
  switch (type) {
    case 'confirmed':              return 'bg-green-100 text-green-800 border-green-200';
    case 'partially_paid':         return 'bg-bronze-200 text-bronze-700 border-bronze-300';
    case 'pending_bank_transfer':  return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'pending':                return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'blocked':                return 'bg-slate-200 text-slate-600 border-slate-300';
    case 'external':               return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'direct':                 return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'maintenance':            return 'bg-orange-100 text-orange-700 border-orange-200';
    default:                        return 'bg-white text-night-500 border-transparent';
  }
}

// ─────────────────────────────────────────────────────────────
// Component principal
// ─────────────────────────────────────────────────────────────
export default function VillaPlanning({ apartments, bookings, blocks, locale }: Props) {
  const isFr = locale === 'fr';
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDeleteBlock(id: string) {
    if (!confirm(isFr ? 'Supprimer ce blocage ?' : 'Delete this block?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/availability-blocks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('delete failed');
      router.refresh();
    } catch {
      alert(isFr ? 'Suppression échouée' : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  const monthNames = isFr
    ? ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
    : ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = isFr
    ? ['Lu','Ma','Me','Je','Ve','Sa','Di']
    : ['Mo','Tu','We','Th','Fr','Sa','Su'];

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <section className="bg-white rounded-2xl border border-bronze-100 p-6 lg:p-8 shadow-sm">
      {/* En-tête de la section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-bronze-500" />
          <div>
            <p className="text-[10px] font-medium text-bronze-500 uppercase mb-0.5" style={{ letterSpacing: '0.2em' }}>
              {isFr ? 'Vue d\'ensemble' : 'Overview'}
            </p>
            <h2 className="font-serif font-light text-night-600 text-xl md:text-2xl leading-tight">
              {isFr ? 'Planning des villas' : 'Villa Planning'}
            </h2>
          </div>
        </div>

        {/* Navigation mois + ajout blocage */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            onClick={() => setBlockModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-night-600 text-cream-100 rounded-lg text-xs font-medium hover:bg-night-500 transition-colors"
            style={{ letterSpacing: '0.05em' }}
          >
            <Plus size={14} />
            {isFr ? 'Bloquer des dates' : 'Block dates'}
          </button>
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-bronze-50 rounded-full transition-colors text-night-500"
            aria-label={isFr ? 'Mois précédent' : 'Previous month'}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center min-w-[160px]">
            <p className="font-serif text-lg text-night-600">{monthNames[month]} {year}</p>
            {!isCurrentMonth && (
              <button
                onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}
                className="text-[10px] uppercase text-bronze-500 hover:text-bronze-600 transition-colors"
                style={{ letterSpacing: '0.15em' }}
              >
                {isFr ? 'Aujourd\'hui' : 'Today'}
              </button>
            )}
          </div>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-bronze-50 rounded-full transition-colors text-night-500"
            aria-label={isFr ? 'Mois suivant' : 'Next month'}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Une carte par villa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {apartments.map((apt) => (
          <VillaCalendar
            key={apt.id}
            apartment={apt}
            year={year}
            month={month}
            bookings={bookings}
            blocks={blocks}
            dayNames={dayNames}
            isFr={isFr}
            onDeleteBlock={handleDeleteBlock}
            deletingId={deletingId}
          />
        ))}
      </div>

      {/* Légende */}
      <div className="mt-6 pt-5 border-t border-bronze-100">
        <p className="text-[10px] uppercase font-medium text-night-400 mb-3" style={{ letterSpacing: '0.15em' }}>
          {isFr ? 'Légende' : 'Legend'}
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-night-500 font-light">
          <LegendItem color="bg-green-100 border-green-200" label={isFr ? 'Confirmée (site)' : 'Confirmed (site)'} />
          <LegendItem color="bg-bronze-200 border-bronze-300" label={isFr ? 'Acompte payé' : '40% paid'} />
          <LegendItem color="bg-amber-100 border-amber-200" label={isFr ? 'Virement en attente' : 'Awaiting transfer'} />
          <LegendItem color="bg-blue-50 border-blue-200" label={isFr ? 'PayPal en cours' : 'PayPal pending'} />
          <LegendItem color="bg-rose-100 border-rose-200" label="Airbnb / VRBO" />
          <LegendItem color="bg-indigo-100 border-indigo-200" label={isFr ? 'Réservation directe' : 'Direct booking'} />
          <LegendItem color="bg-slate-200 border-slate-300" label={isFr ? 'Propriétaire' : 'Owner'} />
          <LegendItem color="bg-orange-100 border-orange-200" label="Maintenance" />
        </div>
      </div>

      {blockModalOpen && (
        <BlockDatesModal
          apartments={apartments}
          isFr={isFr}
          onClose={() => setBlockModalOpen(false)}
          onCreated={() => { setBlockModalOpen(false); router.refresh(); }}
        />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Sous-composant : calendrier d'une villa
// ─────────────────────────────────────────────────────────────
function VillaCalendar({
  apartment, year, month, bookings, blocks, dayNames, isFr, onDeleteBlock, deletingId,
}: {
  apartment: ApartmentRow;
  year: number;
  month: number;
  bookings: PlanningBooking[];
  blocks: PlanningBlock[];
  dayNames: string[];
  isFr: boolean;
  onDeleteBlock: (id: string) => void;
  deletingId: string | null;
}) {
  const grid = useMemo(
    () => buildMonthGrid(year, month, apartment.id, bookings, blocks),
    [year, month, apartment.id, bookings, blocks],
  );

  const villaName = isFr ? apartment.title_fr : apartment.title_en;

  // Calcul occupation du mois
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const bookedNights = grid.filter(c => c.inMonth && c.type !== 'free').length;
  const occupancyPct = Math.round((bookedNights / daysInMonth) * 100);

  const today = new Date();
  const todayStr = toDateStr(today);

  return (
    <div className="bg-cream-50 rounded-xl border border-bronze-100 p-5">
      {/* Header villa */}
      <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-bronze-100">
        <h3 className="font-serif text-lg text-night-600">{villaName}</h3>
        <div className="text-right">
          <p className="font-serif text-2xl font-light text-bronze-500 leading-none">{bookedNights}</p>
          <p className="text-[10px] uppercase text-night-400" style={{ letterSpacing: '0.15em' }}>
            {isFr ? `nuits / ${daysInMonth}` : `nights / ${daysInMonth}`}
          </p>
          <p className="text-[10px] text-bronze-500 font-medium mt-0.5">{occupancyPct}%</p>
        </div>
      </div>

      {/* En-têtes jours */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-[10px] uppercase font-medium text-night-300 py-1" style={{ letterSpacing: '0.15em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((cell, i) => {
          const isToday = cell.date === todayStr;
          const tooltip = cell.booking
            ? `${cell.booking.guest_name} · ${cell.booking.check_in} → ${cell.booking.check_out}${cell.booking.payment_method ? ` · ${cell.booking.payment_method}` : ''}`
            : cell.block
            ? `${cell.block.label || (isFr ? 'Bloqué' : 'Blocked')} · ${cell.block.start_date} → ${cell.block.end_date}`
            : '';

          const dayNum = parseDate(cell.date).getDate();

          return (
            <div
              key={`${cell.date}-${i}`}
              title={tooltip}
              className={`relative aspect-square flex items-center justify-center text-xs font-medium border rounded ${cellClasses(cell.type, cell.inMonth)} ${isToday ? 'ring-2 ring-bronze-400 ring-offset-1' : ''}`}
            >
              {dayNum}
              {cell.isStart && cell.inMonth && cell.type !== 'free' && cell.type !== 'blocked' && (
                <span className="absolute -top-0.5 left-0.5 w-1 h-1 rounded-full bg-bronze-500" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      {/* Réservations du mois (compact) */}
      <MonthBookingsList
        bookings={bookings.filter(b =>
          b.apartment_id === apartment.id
          && (
            (parseDate(b.check_in).getFullYear() === year && parseDate(b.check_in).getMonth() === month)
            || (parseDate(b.check_out).getFullYear() === year && parseDate(b.check_out).getMonth() === month)
          )
        )}
        blocks={blocks.filter(bk =>
          bk.apartment_id === apartment.id
          && (
            (parseDate(bk.start_date).getFullYear() === year && parseDate(bk.start_date).getMonth() === month)
            || (parseDate(bk.end_date).getFullYear() === year && parseDate(bk.end_date).getMonth() === month)
          )
        )}
        isFr={isFr}
        onDeleteBlock={onDeleteBlock}
        deletingId={deletingId}
      />
    </div>
  );
}

function MonthBookingsList({
  bookings,
  blocks,
  isFr,
  onDeleteBlock,
  deletingId,
}: {
  bookings: PlanningBooking[];
  blocks: PlanningBlock[];
  isFr: boolean;
  onDeleteBlock: (id: string) => void;
  deletingId: string | null;
}) {
  if (bookings.length === 0 && blocks.length === 0) {
    return (
      <p className="mt-4 pt-4 border-t border-bronze-100 text-[11px] text-night-400 font-light italic text-center">
        {isFr ? 'Aucune réservation ce mois-ci' : 'No bookings this month'}
      </p>
    );
  }
  return (
    <div className="mt-4 pt-4 border-t border-bronze-100 space-y-1.5">
      {bookings.map(b => (
        <div key={b.id} className="flex items-center justify-between text-[11px] gap-2">
          <span className="text-night-600 font-medium truncate">{b.guest_name}</span>
          <span className="text-night-400 font-light whitespace-nowrap">
            {b.check_in.slice(5)} → {b.check_out.slice(5)}
          </span>
        </div>
      ))}
      {blocks.map(b => {
        const badge = blockBadge(b, isFr);
        const isManual = !b.source || b.source === 'manual';
        return (
          <div key={b.id} className="flex items-center justify-between text-[11px] gap-2 group">
            <span className="inline-flex items-center gap-1.5 truncate">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold ${badge.class}`} style={{ letterSpacing: '0.05em' }}>
                {badge.label}
              </span>
              <span className="text-night-500 font-light truncate">{b.label || (isFr ? 'Réservé' : 'Reserved')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-night-400 font-light">
                {b.start_date.slice(5)} → {b.end_date.slice(5)}
              </span>
              {isManual && (
                <button
                  onClick={() => onDeleteBlock(b.id)}
                  disabled={deletingId === b.id}
                  className="p-1 text-night-300 hover:text-red-500 transition-colors disabled:opacity-50"
                  title={isFr ? 'Supprimer' : 'Delete'}
                  aria-label={isFr ? 'Supprimer le blocage' : 'Delete block'}
                >
                  {deletingId === b.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                </button>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Badge (label + couleur) selon source + block_type
function blockBadge(b: PlanningBlock, isFr: boolean): { label: string; class: string } {
  if (b.source === 'airbnb') return { label: 'Airbnb', class: 'bg-rose-100 text-rose-700' };
  if (b.source === 'vrbo') return { label: 'VRBO', class: 'bg-rose-100 text-rose-700' };
  if (b.source === 'booking_com') return { label: 'Booking', class: 'bg-rose-100 text-rose-700' };
  switch (b.block_type) {
    case 'booking':     return { label: isFr ? 'Direct' : 'Direct', class: 'bg-indigo-100 text-indigo-700' };
    case 'maintenance': return { label: 'Maintenance', class: 'bg-orange-100 text-orange-700' };
    default:            return { label: isFr ? 'Propriétaire' : 'Owner', class: 'bg-slate-200 text-slate-600' };
  }
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded border ${color}`} />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal : bloquer des dates manuellement (résa directe / proprio / maintenance)
// ─────────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { value: 'booking',     label_fr: 'Réservation directe', label_en: 'Direct booking' },
  { value: 'owner',       label_fr: 'Blocage propriétaire', label_en: 'Owner block' },
  { value: 'maintenance', label_fr: 'Maintenance',          label_en: 'Maintenance' },
] as const;

function BlockDatesModal({
  apartments,
  isFr,
  onClose,
  onCreated,
}: {
  apartments: ApartmentRow[];
  isFr: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [apartmentId, setApartmentId] = useState(apartments[0]?.id ?? '');
  const [blockType, setBlockType] = useState<string>('booking');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!apartmentId || !startDate || !endDate) {
      setError(isFr ? 'Villa, date de début et date de fin obligatoires' : 'Villa, start and end dates required');
      return;
    }
    if (endDate <= startDate) {
      setError(isFr ? 'La date de fin (départ) doit être après la date de début' : 'End date must be after start date');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/availability-blocks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartment_id: apartmentId,
          start_date: startDate,
          end_date: endDate,
          block_type: blockType,
          label: label.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Échec (${res.status})`);
      }
      onCreated();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-xl text-night-600">{isFr ? 'Bloquer des dates' : 'Block dates'}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <div className="space-y-4">
          {/* Villa */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Villa</label>
            <select
              value={apartmentId}
              onChange={(e) => setApartmentId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
            >
              {apartments.map((a) => (
                <option key={a.id} value={a.id}>{isFr ? a.title_fr : a.title_en}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{isFr ? 'Type' : 'Type'}</label>
            <div className="grid grid-cols-3 gap-2">
              {BLOCK_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setBlockType(t.value)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    blockType === t.value
                      ? 'border-[#B08B52] bg-[#B08B52]/10 text-[#0D1B2A]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {isFr ? t.label_fr : t.label_en}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{isFr ? 'Arrivée' : 'Check-in'}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{isFr ? 'Départ' : 'Check-out'}</label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {isFr ? 'Note (nom du client, motif…)' : 'Note (guest name, reason…)'} <span className="text-gray-300 normal-case">— {isFr ? 'optionnel' : 'optional'}</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={isFr ? 'ex : Famille Martin (bouche-à-oreille)' : 'e.g. Martin family (word of mouth)'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08B52]/30 focus:border-[#B08B52]"
            />
          </div>

          <p className="text-xs text-gray-400">
            {isFr
              ? 'Ces dates seront bloquées sur le site et exportées vers Airbnb/VRBO.'
              : 'These dates will be blocked on the site and exported to Airbnb/VRBO.'}
          </p>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#0D1B2A] text-white py-3 rounded-xl font-semibold hover:bg-[#1a2f45] transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {saving ? (isFr ? 'Création…' : 'Creating…') : (isFr ? 'Bloquer ces dates' : 'Block these dates')}
          </button>
        </div>
      </div>
    </div>
  );
}
