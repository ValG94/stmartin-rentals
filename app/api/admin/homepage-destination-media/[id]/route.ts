import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

// PATCH /api/admin/homepage-destination-media/[id]
// Met à jour n'importe quel champ éditable : titres, légendes, alt,
// is_published, thumbnail_url, display_order.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Whitelist explicite des champs modifiables
  const allowed = [
    'title_fr', 'title_en',
    'caption_fr', 'caption_en',
    'alt_fr', 'alt_en',
    'thumbnail_url',
    'is_published',
    'display_order',
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('homepage_destination_media')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  revalidatePath('/[locale]', 'page');
  return NextResponse.json(data);
}

// DELETE /api/admin/homepage-destination-media/[id]
// Supprime la row + le fichier dans le bon bucket (auto-détecté par URL).
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = await params;

  // Récupère le storage_path pour cleanup
  const { data: row } = await supabaseAdmin
    .from('homepage_destination_media')
    .select('storage_path, media_url')
    .eq('id', id)
    .single();

  if (row?.storage_path) {
    const bucket = (row.media_url || '').includes('/apartment-videos/')
      ? 'apartment-videos'
      : 'apartment-images';
    await supabaseAdmin.storage.from(bucket).remove([row.storage_path]);
  }

  const { error } = await supabaseAdmin
    .from('homepage_destination_media')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  revalidatePath('/[locale]', 'page');
  return NextResponse.json({ success: true });
}
