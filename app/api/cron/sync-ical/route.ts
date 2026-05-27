import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { syncAllApartments } from '@/lib/services/ical-sync';

// node-ical embarque des deps Node-only (BigInt côté init de certains
// chunks) qui plantent si Next.js tente de pré-évaluer la route au build.
// On force le runtime Node + dynamic pour court-circuiter la phase
// "Collecting page data".
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Endpoint cron — appelé toutes les 30 min par Vercel Cron OU cron-job.org.
// Auth via Bearer token (env CRON_SECRET) ou query ?secret=...
//
// Configuration Vercel : voir vercel.json (cron */30 * * * *)
// Alternative gratuite : cron-job.org → header Authorization: Bearer ...
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  const querySecret = new URL(req.url).searchParams.get('secret');
  const provided = authHeader?.replace(/^Bearer\s+/i, '') || querySecret;

  if (provided !== secret) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const startedAt = Date.now();
  const results = await syncAllApartments();
  const elapsedMs = Date.now() - startedAt;

  // Si au moins un import a fait bouger des blocs → revalider la fiche villa
  // pour que les nouvelles indisponibilités apparaissent côté front.
  const touched = results.some((r) => r.upserted > 0 || r.deleted > 0);
  if (touched) {
    revalidatePath('/[locale]/apartments/[slug]', 'page');
  }

  return NextResponse.json({
    ok: true,
    elapsedMs,
    summary: {
      total: results.length,
      upserted: results.reduce((s, r) => s + r.upserted, 0),
      deleted: results.reduce((s, r) => s + r.deleted, 0),
      errors: results.reduce((s, r) => s + r.errors.length, 0),
    },
    results,
  });
}
