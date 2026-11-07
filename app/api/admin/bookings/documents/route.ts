import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminTokenAsync } from '@/lib/auth-admin';
import { listBookingDocuments } from '@/lib/documents/credit-notes';

/**
 * GET /api/admin/bookings/documents?bookingId=…
 *
 * Facture, reçus et avoirs d'une réservation, avec liens de
 * téléchargement signés (1 h) et le montant encore remboursable.
 */
export async function GET(req: NextRequest) {
  if (!(await verifyAdminTokenAsync(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const bookingId = req.nextUrl.searchParams.get('bookingId');
  if (!bookingId) return NextResponse.json({ error: 'bookingId requis' }, { status: 400 });

  try {
    return NextResponse.json(await listBookingDocuments(supabaseAdmin, bookingId));
  } catch (err) {
    console.error('[admin/documents]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
