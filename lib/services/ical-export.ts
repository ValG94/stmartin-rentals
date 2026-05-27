// ============================================================
// Export iCal — génère un flux .ics des réservations d'une villa
// pour qu'Airbnb/VRBO/etc. l'importent et bloquent les dates
// ============================================================
//
// Inclut :
//   - bookings 'confirmed', 'partially_paid', 'pending_bank_transfer'
//   - availability_blocks 'manual' (maintenance, owner) — pour que
//     les plateformes externes voient aussi les blocages locaux
//
// Ne ré-inclut PAS les blocs déjà importés depuis Airbnb (source != 'manual')
// pour éviter qu'Airbnb re-importe ses propres réservations en boucle.
// ============================================================

import { createEvents, type EventAttributes, type DateArray } from 'ics';
import { supabaseAdmin } from '@/lib/supabase';

export async function buildApartmentIcal(slug: string): Promise<string | null> {
  // 1. Trouver l'apartment
  const { data: apartment, error: aptErr } = await supabaseAdmin
    .from('apartments')
    .select('id, slug, title_en, title_fr')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (aptErr || !apartment) return null;

  const apartmentId = apartment.id;
  const name = apartment.title_en || apartment.title_fr;

  const today = new Date().toISOString().slice(0, 10);

  // 2. Réservations engagées (futures uniquement)
  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('id, check_in, check_out, booking_status, guest_name')
    .eq('apartment_id', apartmentId)
    .in('booking_status', ['confirmed', 'partially_paid', 'pending_bank_transfer'])
    .gte('check_out', today);

  // 3. Blocs manuels (maintenance, propriétaire). On exclut les blocs
  //    importés depuis Airbnb/VRBO pour ne pas re-broadcaster.
  const { data: blocks } = await supabaseAdmin
    .from('availability_blocks')
    .select('id, start_date, end_date, block_type, label')
    .eq('apartment_id', apartmentId)
    .eq('source', 'manual')
    .gte('end_date', today);

  const events: EventAttributes[] = [];

  for (const b of bookings ?? []) {
    events.push({
      uid: `booking-${b.id}@islandlivingsxm.com`,
      title: `Reserved — ${name}`,
      description: `Reservation #${b.id.slice(0, 8)} (${b.booking_status})`,
      start: dateToArray(b.check_in),
      end: dateToArray(b.check_out),
    });
  }

  for (const b of blocks ?? []) {
    events.push({
      uid: `block-${b.id}@islandlivingsxm.com`,
      title: b.label || `Blocked — ${name}`,
      description: `Manual block (${b.block_type})`,
      start: dateToArray(b.start_date),
      end: dateToArray(b.end_date),
    });
  }

  // Si aucun event, retourne un calendrier vide valide
  if (events.length === 0) {
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Island Living SXM//Booking Calendar//EN',
      'CALSCALE:GREGORIAN',
      `NAME:Island Living SXM — ${name}`,
      `X-WR-CALNAME:Island Living SXM — ${name}`,
      'END:VCALENDAR',
      '',
    ].join('\r\n');
  }

  const { value, error } = createEvents(events, {
    productId: '-//Island Living SXM//Booking Calendar//EN',
    calName: `Island Living SXM — ${name}`,
  });

  if (error || !value) {
    console.error('[ical-export] createEvents error:', error);
    return null;
  }

  return value;
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Convertit 'YYYY-MM-DD' en DateArray [Y, M, D] attendu par ics.
 * Les events all-day n'ont pas d'heure.
 */
function dateToArray(isoDate: string): DateArray {
  const [y, m, d] = isoDate.split('-').map(Number);
  return [y, m, d];
}
