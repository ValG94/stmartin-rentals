import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminTokenAsync } from '@/lib/auth-admin';
import { applyRowChanges, type RowChanges } from '@/lib/services/admin-rows';

// Tarifs saisonniers d'une villa : écrits par le service role uniquement
// (la clé publique n'a plus que la lecture, supabase/lock_admin_writes.sql).

const FIELDS = ['name_fr', 'name_en', 'price_per_night', 'date_from', 'date_to', 'is_active'];

/** PUT { deleted: id[], created: row[], updated: row[] } → liste à jour */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminTokenAsync(req))) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const { id: apartmentId } = await params;
  const changes = (await req.json().catch(() => null)) as RowChanges | null;
  if (!changes) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const error = await applyRowChanges(supabaseAdmin, 'seasonal_prices', apartmentId, FIELDS, changes);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { data } = await supabaseAdmin
    .from('seasonal_prices').select('*')
    .eq('apartment_id', apartmentId).order('date_from', { ascending: true });

  // Prix affichés sur l'accueil, la liste et la fiche villa
  revalidatePath('/[locale]', 'page');
  revalidatePath('/[locale]/apartments', 'page');
  revalidatePath('/[locale]/apartments/[slug]', 'page');
  return NextResponse.json({ data: data ?? [] });
}
