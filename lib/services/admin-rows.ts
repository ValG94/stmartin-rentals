// Applique les modifications d'une liste éditée dans l'admin (tarifs
// saisonniers, sections de fiche villa) : suppressions, créations, mises à
// jour, limitées aux colonnes autorisées et à la villa concernée.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface RowChanges {
  deleted?: string[];
  created?: Record<string, unknown>[];
  updated?: (Record<string, unknown> & { id: string })[];
}

const pick = (row: Record<string, unknown>, fields: string[]) =>
  Object.fromEntries(fields.filter((f) => f in row).map((f) => [f, row[f]]));

/** Renvoie le message d'erreur, ou null si tout est passé. */
export async function applyRowChanges(
  sb: SupabaseClient,
  table: string,
  apartmentId: string,
  fields: string[],
  changes: RowChanges,
): Promise<string | null> {
  if (changes.deleted?.length) {
    const { error } = await sb.from(table).delete().in('id', changes.deleted).eq('apartment_id', apartmentId);
    if (error) return error.message;
  }
  if (changes.created?.length) {
    const rows = changes.created.map((r) => ({ ...pick(r, fields), apartment_id: apartmentId }));
    const { error } = await sb.from(table).insert(rows);
    if (error) return error.message;
  }
  for (const r of changes.updated ?? []) {
    const { error } = await sb.from(table).update(pick(r, fields)).eq('id', r.id).eq('apartment_id', apartmentId);
    if (error) return error.message;
  }
  return null;
}
