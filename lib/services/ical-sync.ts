// ============================================================
// Synchronisation iCal — import Airbnb/VRBO → availability_blocks
// ============================================================
//
// Flow :
//   1. fetch() de l'URL iCal de la plateforme
//   2. parse via node-ical
//   3. upsert chaque VEVENT dans availability_blocks (clé d'unicité :
//      apartment_id + source + external_uid)
//   4. delete les blocs précédemment importés qui n'apparaissent plus
//      dans le flux (= réservation annulée chez la plateforme)
//
// La date de fin (DTEND) iCal est exclusive (jour de check-out non
// inclus dans le séjour). On stocke end_date = DTEND tel quel — c'est
// la même convention que pour bookings.check_out (la nuit du jour X
// n'est pas dormie sur place).
// ============================================================

import * as ical from 'node-ical';
import { supabaseAdmin } from '@/lib/supabase';

export type IcalSource = 'airbnb' | 'vrbo' | 'booking_com';

export interface SyncResult {
  source: IcalSource;
  apartmentId: string;
  fetched: number;
  upserted: number;
  deleted: number;
  errors: string[];
}

/**
 * Synchronise un flux iCal externe vers availability_blocks.
 *
 * @param apartmentId UUID de la villa
 * @param source nom de la plateforme ('airbnb', 'vrbo', ...)
 * @param url URL publique du flux iCal
 */
export async function syncApartmentIcal(
  apartmentId: string,
  source: IcalSource,
  url: string
): Promise<SyncResult> {
  const result: SyncResult = {
    source,
    apartmentId,
    fetched: 0,
    upserted: 0,
    deleted: 0,
    errors: [],
  };

  // 1. Fetch
  let icalText: string;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'IslandLivingSXM-iCalSync/1.0' },
      cache: 'no-store',
    });
    if (!res.ok) {
      result.errors.push(`HTTP ${res.status} sur ${source}`);
      return result;
    }
    icalText = await res.text();
  } catch (e: unknown) {
    result.errors.push(`Fetch error : ${e instanceof Error ? e.message : 'unknown'}`);
    return result;
  }

  // 2. Parse
  let parsed: ical.CalendarResponse;
  try {
    parsed = ical.sync.parseICS(icalText);
  } catch (e: unknown) {
    result.errors.push(`Parse error : ${e instanceof Error ? e.message : 'unknown'}`);
    return result;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events: { uid: string; startDate: string; endDate: string; summary: string }[] = [];
  for (const key in parsed) {
    const comp = parsed[key];
    if (!comp || comp.type !== 'VEVENT') continue;
    const ev = comp as ical.VEvent;
    if (!ev.uid || !ev.start || !ev.end) continue;

    // iCal DTEND est exclusive — pour Airbnb, c'est le jour de check-out
    const startDate = toISODate(ev.start);
    const endDate = toISODate(ev.end);
    if (!startDate || !endDate) continue;

    // Skip historique
    if (new Date(endDate) < today) continue;

    events.push({
      uid: ev.uid,
      startDate,
      endDate,
      summary: String(ev.summary ?? 'Reserved'),
    });
  }

  result.fetched = events.length;

  // 3. Upsert chaque événement (clé : apartment_id + source + external_uid)
  if (events.length > 0) {
    const rows = events.map((ev) => ({
      apartment_id: apartmentId,
      source,
      external_uid: ev.uid,
      start_date: ev.startDate,
      end_date: ev.endDate,
      block_type: 'external' as const,
      label: `${labelForSource(source)} : ${ev.summary}`.slice(0, 200),
    }));
    const { error: upsertErr } = await supabaseAdmin
      .from('availability_blocks')
      .upsert(rows, { onConflict: 'apartment_id,source,external_uid' });
    if (upsertErr) {
      result.errors.push(`Upsert error : ${upsertErr.message}`);
    } else {
      result.upserted = rows.length;
    }
  }

  // 4. Delete les blocs précédemment importés qui ne sont plus dans le flux
  //    (réservations annulées chez la plateforme externe)
  const currentUids = events.map((e) => e.uid);
  const { data: existing, error: listErr } = await supabaseAdmin
    .from('availability_blocks')
    .select('id, external_uid, end_date')
    .eq('apartment_id', apartmentId)
    .eq('source', source);

  if (!listErr && existing) {
    const todayStr = today.toISOString().slice(0, 10);
    const toDelete = existing
      .filter((b) => b.external_uid && !currentUids.includes(b.external_uid))
      // ne supprime que les blocs futurs/en cours — on garde l'historique
      .filter((b) => b.end_date >= todayStr)
      .map((b) => b.id);

    if (toDelete.length > 0) {
      const { error: delErr } = await supabaseAdmin
        .from('availability_blocks')
        .delete()
        .in('id', toDelete);
      if (delErr) {
        result.errors.push(`Delete error : ${delErr.message}`);
      } else {
        result.deleted = toDelete.length;
      }
    }
  }

  // 5. Update timestamp sur l'apartment
  await supabaseAdmin
    .from('apartments')
    .update({ ical_last_sync_at: new Date().toISOString() })
    .eq('id', apartmentId);

  return result;
}

/**
 * Synchronise tous les flux iCal configurés sur toutes les villas actives.
 * Appelé par le cron job (toutes les 30 min).
 */
export async function syncAllApartments(): Promise<SyncResult[]> {
  const { data: apartments, error } = await supabaseAdmin
    .from('apartments')
    .select('id, slug, airbnb_ical_url, vrbo_ical_url')
    .eq('is_active', true);

  if (error || !apartments) {
    console.error('[ical-sync] failed to load apartments:', error);
    return [];
  }

  const results: SyncResult[] = [];
  for (const apt of apartments) {
    if (apt.airbnb_ical_url) {
      results.push(await syncApartmentIcal(apt.id, 'airbnb', apt.airbnb_ical_url));
    }
    if (apt.vrbo_ical_url) {
      results.push(await syncApartmentIcal(apt.id, 'vrbo', apt.vrbo_ical_url));
    }
  }
  return results;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function toISODate(d: Date | string): string | null {
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return null;
  // Conserve la date UTC pour éviter tout décalage de timezone (les iCal
  // d'Airbnb sont en VALUE=DATE, donc déjà sans heure ni TZ)
  return date.toISOString().slice(0, 10);
}

function labelForSource(source: IcalSource): string {
  switch (source) {
    case 'airbnb': return 'Airbnb';
    case 'vrbo': return 'VRBO';
    case 'booking_com': return 'Booking.com';
  }
}
