'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface BlockedRange {
  start: string;
  end: string;
  type: string;
}

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  apartmentId: string;
  locale?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // 0=lun ... 6=dim
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isDateInRanges(dateStr: string, ranges: BlockedRange[]): boolean {
  const d = parseDate(dateStr).getTime();
  for (const r of ranges) {
    const start = parseDate(r.start).getTime();
    const end = parseDate(r.end).getTime();
    if (d >= start && d < end) return true;
  }
  return false;
}

function isRangeContainsBlocked(
  startStr: string,
  endStr: string,
  ranges: BlockedRange[]
): boolean {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const cur = new Date(start);
  while (cur < end) {
    if (isDateInRanges(toDateStr(cur), ranges)) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}

// ── Composant calendrier d'un mois ───────────────────────────────────────────

interface MonthCalendarProps {
  year: number;
  month: number;
  checkIn: string;
  checkOut: string;
  hoveredDate: string | null;
  blockedRanges: BlockedRange[];
  onDayClick: (dateStr: string) => void;
  onDayHover: (dateStr: string | null) => void;
  locale: string;
}

function MonthCalendar({
  year, month, checkIn, checkOut, hoveredDate,
  blockedRanges, onDayClick, onDayHover, locale,
}: MonthCalendarProps) {
  const isFr = locale === 'fr';
  const monthNames = isFr
    ? ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
    : ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = isFr
    ? ['Lu','Ma','Me','Je','Ve','Sa','Di']
    : ['Mo','Tu','We','Th','Fr','Sa','Su'];

  const today = toDateStr(new Date());
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);

  const cells: (string | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return toDateStr(d);
    }),
  ];

  // Compléter pour avoir des rangées complètes
  while (cells.length % 7 !== 0) cells.push(null);

  const endDisplay = hoveredDate && !checkOut ? hoveredDate : checkOut;

  return (
    <div className="select-none">
      <div className="text-center font-serif font-light text-night-600 mb-3 text-base">
        {monthNames[month]} {year}
      </div>
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-[10px] uppercase font-medium text-night-300 py-1" style={{ letterSpacing: '0.15em' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={i} />;

          const isPast = dateStr < today;
          const isBlocked = isDateInRanges(dateStr, blockedRanges);
          const isDisabled = isPast || isBlocked;

          const isStart = dateStr === checkIn;
          const isEnd = dateStr === checkOut;
          const inRange =
            checkIn && endDisplay && dateStr > checkIn && dateStr < endDisplay;

          // Si on a un checkIn et on survole, vérifier si la plage contient des dates bloquées
          const wouldContainBlocked =
            checkIn && !checkOut && hoveredDate && dateStr === hoveredDate
              ? isRangeContainsBlocked(checkIn, hoveredDate, blockedRanges)
              : false;

          const isToday = dateStr === today;

          let cellClass =
            'relative flex items-center justify-center h-9 text-sm cursor-pointer transition-colors ';

          if (isDisabled) {
            cellClass += 'text-night-200 cursor-not-allowed line-through ';
          } else if (isStart || isEnd) {
            cellClass += 'bg-bronze-400 text-cream-100 font-medium rounded-full z-10 ';
          } else if (inRange) {
            cellClass += 'bg-bronze-400/15 text-night-600 ';
          } else if (wouldContainBlocked) {
            cellClass += 'text-night-300 cursor-not-allowed ';
          } else if (isToday) {
            cellClass += 'text-bronze-500 font-semibold hover:bg-bronze-50 rounded-full ';
          } else {
            cellClass += 'text-night-500 hover:bg-bronze-50 hover:rounded-full ';
          }

          // Fond de range (demi-cercles aux extrémités)
          const rangeClass = inRange
            ? isStart
              ? 'rounded-l-full'
              : isEnd
              ? 'rounded-r-full'
              : ''
            : '';

          return (
            <div
              key={dateStr}
              className={`${cellClass} ${rangeClass}`}
              onClick={() => !isDisabled && onDayClick(dateStr)}
              onMouseEnter={() => !isDisabled && onDayHover(dateStr)}
              onMouseLeave={() => onDayHover(null)}
            >
              {dateStr.split('-')[2].replace(/^0/, '')}
              {isBlocked && !isPast && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-red-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

export default function DateRangePicker({
  checkIn, checkOut, onCheckInChange, onCheckOutChange,
  apartmentId, locale = 'en',
}: DateRangePickerProps) {
  const isFr = locale === 'fr';
  const [open, setOpen] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const ref = useRef<HTMLDivElement>(null);

  // Charger les disponibilités
  useEffect(() => {
    if (!apartmentId) return;
    setLoading(true);
    fetch(`/api/availability?apartmentId=${apartmentId}`)
      .then((r) => r.json())
      .then((data) => {
        setBlockedRanges(data.blockedRanges ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apartmentId]);

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDayClick = (dateStr: string) => {
    if (!checkIn || (checkIn && checkOut)) {
      // Démarrer une nouvelle sélection
      onCheckInChange(dateStr);
      onCheckOutChange('');
    } else {
      // checkIn défini, pas de checkOut
      if (dateStr <= checkIn) {
        onCheckInChange(dateStr);
        onCheckOutChange('');
      } else if (isRangeContainsBlocked(checkIn, dateStr, blockedRanges)) {
        // La plage contient des dates bloquées → recommencer
        onCheckInChange(dateStr);
        onCheckOutChange('');
      } else {
        onCheckOutChange(dateStr);
        setOpen(false);
      }
    }
  };

  const nextMonth = addMonths(currentMonth, 1);

  const formatDisplay = (d: string) => {
    if (!d) return isFr ? 'Choisir' : 'Select';
    const date = parseDate(d);
    return date.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.round(
          (parseDate(checkOut).getTime() - parseDate(checkIn).getTime()) / 86400000
        ))
      : 0;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div
        className="grid grid-cols-2 gap-2 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="bg-cream-50 border border-bronze-100 rounded-md px-4 py-3 hover:border-bronze-400 transition-colors">
          <div className="text-[10px] font-medium text-bronze-500 uppercase mb-1 flex items-center gap-1.5" style={{ letterSpacing: '0.15em' }}>
            <Calendar size={10} />
            {isFr ? 'Arrivée' : 'Check-in'}
          </div>
          <div className={`text-sm ${checkIn ? 'text-night-600 font-medium' : 'text-night-300 font-light'}`}>
            {formatDisplay(checkIn)}
          </div>
        </div>
        <div className="bg-cream-50 border border-bronze-100 rounded-md px-4 py-3 hover:border-bronze-400 transition-colors">
          <div className="text-[10px] font-medium text-bronze-500 uppercase mb-1 flex items-center gap-1.5" style={{ letterSpacing: '0.15em' }}>
            <Calendar size={10} />
            {isFr ? 'Départ' : 'Check-out'}
          </div>
          <div className={`text-sm ${checkOut ? 'text-night-600 font-medium' : 'text-night-300 font-light'}`}>
            {formatDisplay(checkOut)}
          </div>
        </div>
      </div>

      {/* Résumé nuits */}
      {nights > 0 && (
        <div className="mt-2 text-xs text-center text-bronze-500 font-medium uppercase" style={{ letterSpacing: '0.15em' }}>
          {nights} {isFr ? (nights > 1 ? 'nuits' : 'nuit') : (nights > 1 ? 'nights' : 'night')}
        </div>
      )}

      {/* Calendrier déroulant — inline pour ne jamais déborder du viewport */}
      {open && (
        <div className="mt-3 bg-cream-50 rounded-xl border border-bronze-100 p-5 w-full">
          {loading && (
            <div className="text-center text-xs text-night-300 mb-2 font-light">
              {isFr ? 'Chargement des disponibilités…' : 'Loading availability…'}
            </div>
          )}

          {/* Légende */}
          <div className="flex items-center gap-4 mb-4 text-[10px] uppercase text-night-400 font-light" style={{ letterSpacing: '0.1em' }}>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-bronze-400 inline-block" />
              {isFr ? 'Sélectionné' : 'Selected'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
              {isFr ? 'Indisponible' : 'Unavailable'}
            </span>
            <span className="flex items-center gap-1.5 line-through text-night-200">
              {isFr ? 'Passé' : 'Past'}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentMonth((m) => addMonths(m, -1)); }}
              className="p-2 hover:bg-bronze-50 rounded-full transition-colors"
              aria-label={isFr ? 'Mois précédent' : 'Previous month'}
            >
              <ChevronLeft size={18} className="text-night-500" />
            </button>
            <div className="flex-1" />
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentMonth((m) => addMonths(m, 1)); }}
              className="p-2 hover:bg-bronze-50 rounded-full transition-colors"
              aria-label={isFr ? 'Mois suivant' : 'Next month'}
            >
              <ChevronRight size={18} className="text-night-500" />
            </button>
          </div>

          {/* Un mois visible avec navigation */}
          <MonthCalendar
            year={currentMonth.getFullYear()}
            month={currentMonth.getMonth()}
            checkIn={checkIn}
            checkOut={checkOut}
            hoveredDate={hoveredDate}
            blockedRanges={blockedRanges}
            onDayClick={handleDayClick}
            onDayHover={setHoveredDate}
            locale={locale}
          />

          {/* Bouton reset */}
          {(checkIn || checkOut) && (
            <div className="mt-4 text-center">
              <button
                onClick={() => { onCheckInChange(''); onCheckOutChange(''); }}
                className="text-[10px] uppercase text-night-400 hover:text-bronze-500 transition-colors font-medium"
                style={{ letterSpacing: '0.15em' }}
              >
                {isFr ? 'Effacer les dates' : 'Clear dates'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
