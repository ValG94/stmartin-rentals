import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';
import { syncApartmentIcal, type IcalSource } from '@/lib/services/ical-sync';

// node-ical → Node-only deps qui plantent au build. Voir le commentaire
// dans /api/cron/sync-ical/route.ts.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/apartments/:id/sync-ical
//
// Déclenche un sync iCal manuel pour cette villa, toutes plateformes
// confondues (Airbnb + VRBO si configurés). Utilisé depuis le bouton
// "Synchroniser maintenant" de l'admin pour ne pas attendre le prochain
// cron run.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id: apartmentId } = await params;

  const { data: apt, error: aptErr } = await supabaseAdmin
    .from('apartments')
    .select('id, airbnb_ical_url, vrbo_ical_url')
    .eq('id', apartmentId)
    .single();

  if (aptErr || !apt) {
    return NextResponse.json({ error: 'Villa introuvable' }, { status: 404 });
  }

  const toSync: { source: IcalSource; url: string }[] = [];
  if (apt.airbnb_ical_url) toSync.push({ source: 'airbnb', url: apt.airbnb_ical_url });
  if (apt.vrbo_ical_url)   toSync.push({ source: 'vrbo',   url: apt.vrbo_ical_url });

  if (toSync.length === 0) {
    return NextResponse.json({
      ok: true,
      message: 'Aucune URL iCal configurée — rien à synchroniser',
      results: [],
    });
  }

  const results = [];
  for (const { source, url } of toSync) {
    results.push(await syncApartmentIcal(apartmentId, source, url));
  }

  // Revalide la fiche villa publique pour propager les nouvelles indispos
  revalidatePath('/[locale]/apartments/[slug]', 'page');

  return NextResponse.json({
    ok: true,
    summary: {
      upserted: results.reduce((s, r) => s + r.upserted, 0),
      deleted: results.reduce((s, r) => s + r.deleted, 0),
      errors: results.reduce((s, r) => s + r.errors.length, 0),
    },
    results,
  });
}
