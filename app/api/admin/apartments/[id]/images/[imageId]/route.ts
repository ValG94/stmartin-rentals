import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id: apartmentId, imageId } = await params;
  const body = await req.json();

  // Si on définit is_cover = true, retirer des autres
  if (body.is_cover === true) {
    await supabaseAdmin
      .from('apartment_images')
      .update({ is_cover: false })
      .eq('apartment_id', apartmentId);
  }

  const { data, error } = await supabaseAdmin
    .from('apartment_images')
    .update(body)
    .eq('id', imageId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { imageId } = await params;

  // Récupérer le storage_path pour supprimer le fichier
  const { data: img } = await supabaseAdmin
    .from('apartment_images')
    .select('storage_path')
    .eq('id', imageId)
    .single();

  if (img?.storage_path) {
    await supabaseAdmin.storage
      .from('apartment-images')
      .remove([img.storage_path]);
  }

  const { error } = await supabaseAdmin
    .from('apartment_images')
    .delete()
    .eq('id', imageId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
