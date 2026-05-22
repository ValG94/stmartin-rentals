import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { adminGetApartmentById, adminUpdateApartment } from '@/lib/api-admin';
import { verifyAdminToken } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const result = await adminGetApartmentById(id);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json(result.data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const result = await adminUpdateApartment(id, body);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

  // Invalide le cache des pages publiques (homepage + liste + fiche villa)
  // pour que toute modification (titre, prix, activation/désactivation, etc.)
  // soit visible immédiatement côté visiteur.
  revalidatePath('/[locale]', 'page');
  revalidatePath('/[locale]/apartments', 'page');
  revalidatePath('/[locale]/apartments/[slug]', 'page');

  return NextResponse.json(result.data);
}

/**
 * DELETE /api/admin/apartments/[id]
 *
 * Suppression d'une villa et de toutes ses ressources liées.
 *
 * Refusée si la villa a la moindre booking (peu importe le statut) :
 * on protège l'historique financier et la traçabilité. Pour "retirer"
 * une villa qui a déjà été réservée, l'admin doit la masquer (toggle
 * is_active=false) plutôt que de la supprimer.
 *
 * Si aucune booking n'existe : suppression en cascade explicite des
 * tables dépendantes (les FK n'ont pas ON DELETE CASCADE en base),
 * puis suppression de la ligne apartments. Les fichiers du Storage
 * sont aussi nettoyés pour ne pas laisser d'images orphelines.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;

  // 1. Vérifier l'absence de bookings (toutes statuts, on garde l'historique)
  const { count: bookingsCount, error: countErr } = await supabaseAdmin
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('apartment_id', id);

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }
  if ((bookingsCount ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `Impossible de supprimer : ${bookingsCount} réservation(s) liée(s) à cette villa. Masquez-la plutôt (toggle "Publié").`,
        code: 'HAS_BOOKINGS',
      },
      { status: 409 },
    );
  }

  // 2. Récupérer les storage_path des images pour suppression du Storage
  const { data: images } = await supabaseAdmin
    .from('apartment_images')
    .select('storage_path')
    .eq('apartment_id', id);

  const storagePaths = (images ?? [])
    .map((img) => img.storage_path as string | null)
    .filter((p): p is string => Boolean(p));

  if (storagePaths.length > 0) {
    await supabaseAdmin.storage.from('apartment-images').remove(storagePaths);
  }

  // 3. Récupérer les guide_sections pour cascader vers guide_items
  const { data: guideSections } = await supabaseAdmin
    .from('guide_sections')
    .select('id')
    .eq('apartment_id', id);

  const sectionIds = (guideSections ?? []).map((s) => s.id as string);
  if (sectionIds.length > 0) {
    await supabaseAdmin.from('guide_items').delete().in('section_id', sectionIds);
  }

  // 4. Cascade DELETE explicite des tables dépendantes
  //    (FK n'ont pas ON DELETE CASCADE en base, on fait à la main)
  const cascadeTables = [
    'availability_blocks',
    'apartment_sections',
    'apartment_key_info',
    'apartment_images',
    'seasonal_prices',
    'guide_sections',
    'optional_partner_contacts',
  ];

  for (const table of cascadeTables) {
    const { error } = await supabaseAdmin.from(table).delete().eq('apartment_id', id);
    if (error) {
      console.error(`[apartments/delete] failed to clean ${table}:`, error.message);
      // On ne stoppe pas — on tente quand même la suppression principale
    }
  }

  // 5. Suppression de la villa elle-même
  const { error: deleteErr } = await supabaseAdmin
    .from('apartments')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  // Invalide le cache public + dashboard
  revalidatePath('/[locale]', 'page');
  revalidatePath('/[locale]/apartments', 'page');

  return NextResponse.json({ success: true });
}
