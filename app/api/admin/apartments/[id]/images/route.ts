import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id: apartmentId } = await params;
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const altFr = (formData.get('alt_fr') as string) || '';
  const altEn = (formData.get('alt_en') as string) || '';
  const isCover = formData.get('is_cover') === 'true';
  const position = parseInt((formData.get('position') as string) || '0', 10);

  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });

  // Valider le type de fichier
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 });
  }

  // Valider la taille (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${apartmentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from('apartment-images')
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('apartment-images')
    .getPublicUrl(fileName);

  // Si is_cover, retirer is_cover des autres images
  if (isCover) {
    await supabaseAdmin
      .from('apartment_images')
      .update({ is_cover: false })
      .eq('apartment_id', apartmentId);
  }

  const { data, error } = await supabaseAdmin
    .from('apartment_images')
    .insert({
      apartment_id: apartmentId,
      url: urlData.publicUrl,
      storage_path: fileName,
      alt_fr: altFr,
      alt_en: altEn,
      is_cover: isCover,
      position,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
