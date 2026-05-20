'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { ApartmentRow, PlanningBooking, PlanningBlock } from './DashboardData';

interface Props {
  apartments: ApartmentRow[];
  bookings: PlanningBooking[];
  blocks: PlanningBlock[];
  locale: string;
}

type CellType = 'free' | 'confirmed' | 'partially_paid' | 'pending_bank_transfer' | 'pending' | 'blocked';

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
      type = 'blocked';
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
    case 'blocked':                return 'bg-night-100 text-night-600 border-night-200';
    default:                        return 'bg-white text-night-500 border-transparent';
  }
}

// ─────────────────────────────────────────────────────────────
// Component principal
// ─────────────────────────────────────────────────────────────
export default function VillaPlanning({ apartments, bookings, blocks, locale }: Props) {
  const isFr = locale === 'fr';
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

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

        {/* Navigation mois */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
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
          />
        ))}
      </div>

      {/* Légende */}
      <div className="mt-6 pt-5 border-t border-bronze-100">
        <p className="text-[10px] uppercase font-medium text-night-400 mb-3" style={{ letterSpacing: '0.15em' }}>
          {isFr ? 'Légende' : 'Legend'}
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-night-500 font-light">
          <LegendItem color="bg-green-100 border-green-200" label={isFr ? 'Confirmée' : 'Confirmed'} />
          <LegendItem color="bg-bronze-200 border-bronze-300" label={isFr ? 'Acompte payé' : '40% paid'} />
          <LegendItem color="bg-amber-100 border-amber-200" label={isFr ? 'Virement en attente' : 'Awaiting transfer'} />
          <LegendItem color="bg-blue-50 border-blue-200" label={isFr ? 'PayPal en cours' : 'PayPal pending'} />
          <LegendItem color="bg-night-100 border-night-200" label={isFr ? 'Bloqué' : 'Blocked'} />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Sous-composant : calendrier d'une villa
// ─────────────────────────────────────────────────────────────
function VillaCalendar({
  apartment, year, month, bookings, blocks, dayNames, isFr,
}: {
  apartment: ApartmentRow;
  year: number;
  month: number;
  bookings: PlanningBooking[];
  blocks: PlanningBlock[];
  dayNames: string[];
  isFr: boolean;
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
            ? cell.block.reason || (isFr ? 'Bloqué' : 'Blocked')
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
        isFr={isFr}
      />
    </div>
  );
}

function MonthBookingsList({ bookings, isFr }: { bookings: PlanningBooking[]; isFr: boolean }) {
  if (bookings.length === 0) {
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
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3 h-3 rounded border ${color}`} />
      {label}
    </span>
  );
}
