import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

/**
 * POST /api/admin/bookings/batch-delete
 *
 * Supprime DÉFINITIVEMENT plusieurs bookings (hard delete + cascade sur
 * availability_blocks et payment_transactions). Utilisé pour le
 * "nettoyage" des réservations échues ou obsolètes depuis le dashboard.
 *
 * ⚠️ IRRÉVERSIBLE — le UI doit demander confirmation explicite.
 *
 * Body : { ids: string[] }
 */
export async function POST(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Array `ids` requis (non vide)' }, { status: 400 });
  }
  // Garde-fou : max 100 par appel pour éviter les timeout Vercel
  if (ids.length > 100) {
    return NextResponse.json({ error: 'Max 100 par batch' }, { status: 400 });
  }

  // Validation basique UUID (évite l'injection accidentelle de chaînes bizarres)
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const cleanIds = ids.filter((id: unknown) => typeof id === 'string' && uuidRe.test(id));
  if (cleanIds.length === 0) {
    return NextResponse.json({ error: 'Aucun ID valide' }, { status: 400 });
  }

  // 1. Supprime d'abord les availability_blocks liés (libère les dates)
  const { error: blocksErr } = await supabaseAdmin
    .from('availability_blocks')
    .delete()
    .in('booking_id', cleanIds);
  if (blocksErr) {
    console.error('[batch-delete] blocks:', blocksErr);
    return NextResponse.json({ error: `Libération dates échouée : ${blocksErr.message}` }, { status: 500 });
  }

  // 2. Supprime les payment_transactions liées
  const { error: paymentsErr } = await supabaseAdmin
    .from('payment_transactions')
    .delete()
    .in('booking_id', cleanIds);
  if (paymentsErr) {
    // Non-bloquant : la table peut ne pas contenir de rows pour ces bookings
    console.warn('[batch-delete] payments:', paymentsErr);
  }

  // 3. Supprime les bookings elles-mêmes
  const { error: bookingsErr } = await supabaseAdmin
    .from('bookings')
    .delete()
    .in('id', cleanIds);
  if (bookingsErr) {
    return NextResponse.json({ error: `Suppression bookings échouée : ${bookingsErr.message}` }, { status: 500 });
  }

  // Revalide les fiches villa pour propager la libération des dates
  revalidatePath('/[locale]/apartments/[slug]', 'page');

  return NextResponse.json({
    success: true,
    deleted: cleanIds.length,
    skipped: ids.length - cleanIds.length,
  });
}
