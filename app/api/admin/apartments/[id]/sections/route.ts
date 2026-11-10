import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminTokenAsync } from '@/lib/auth-admin';
import { applyRowChanges, type RowChanges } from '@/lib/services/admin-rows';

/**
 * PATCH { deleted: id[], created: row[], updated: row[] } → liste à jour.
 * Utilisé par la page d'édition de villa (la clé publique n'écrit pas).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminTokenAsync(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id: apartmentId } = await params;
  const changes = (await req.json().catch(() => null)) as RowChanges | null;
  if (!changes) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const error = await applyRowChanges(supabaseAdmin, 'apartment_sections', apartmentId,
    ['title_fr', 'title_en', 'content_fr', 'content_en', 'icon', 'position'], changes);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { data } = await supabaseAdmin
    .from('apartment_sections').select('*')
    .eq('apartment_id', apartmentId).order('position', { ascending: true });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminTokenAsync(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id: apartmentId } = await params;
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from('apartment_sections')
    .upsert({ ...body, apartment_id: apartmentId }, { onConflict: 'id' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminTokenAsync(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id: apartmentId } = await params;
  const body = await req.json(); // Array de sections

  // Remplacer toutes les sections de l'appartement
  await supabaseAdmin
    .from('apartment_sections')
    .delete()
    .eq('apartment_id', apartmentId);

  if (body.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('apartment_sections')
      .insert(body.map((s: Record<string, unknown>, i: number) => ({
        ...s,
        apartment_id: apartmentId,
        position: i,
      })))
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  return NextResponse.json([]);
}
