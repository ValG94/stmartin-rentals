import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

// GET /api/admin/homepage-destination-media
// Liste tous les médias (publiés ET masqués) pour l'admin.
export async function GET(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('homepage_destination_media')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/homepage-destination-media
// Deux flows :
//  1. Image upload : FormData multipart avec `file` → upload bucket apartment-images
//  2. Média pré-uploadé (vidéo via signed URL OU image externe) : FormData
//     avec `media_url` (+ storage_path optionnel) → simple insert
//
// Champs additionnels : media_type, title_*, caption_*, alt_*, is_published, thumbnail_url
export async function POST(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const preUploadedUrl = ((formData.get('media_url') as string) || '').trim();
  const preUploadedPath = ((formData.get('storage_path') as string) || '').trim();
  const mediaType = ((formData.get('media_type') as string) || 'image').trim();
  const thumbnailUrl = ((formData.get('thumbnail_url') as string) || '').trim();

  if (!['image', 'video'].includes(mediaType)) {
    return NextResponse.json({ error: 'media_type doit être image ou video' }, { status: 400 });
  }

  // Position : à la fin de la liste actuelle
  const { data: existing } = await supabaseAdmin
    .from('homepage_destination_media')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

  const commonFields = {
    media_type: mediaType,
    title_fr: ((formData.get('title_fr') as string) || '').trim() || null,
    title_en: ((formData.get('title_en') as string) || '').trim() || null,
    caption_fr: ((formData.get('caption_fr') as string) || '').trim() || null,
    caption_en: ((formData.get('caption_en') as string) || '').trim() || null,
    alt_fr: ((formData.get('alt_fr') as string) || '').trim() || null,
    alt_en: ((formData.get('alt_en') as string) || '').trim() || null,
    thumbnail_url: thumbnailUrl || null,
    is_published: (formData.get('is_published') as string) !== 'false',
    display_order: nextOrder,
  };

  // ── Cas 1 : média pré-uploadé (vidéo ou image avec URL externe) ─────────
  if (!file && preUploadedUrl) {
    const { data, error } = await supabaseAdmin
      .from('homepage_destination_media')
      .insert({
        ...commonFields,
        media_url: preUploadedUrl,
        storage_path: preUploadedPath || null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath('/[locale]', 'page');
    return NextResponse.json(data, { status: 201 });
  }

  // ── Cas 2 : upload image direct (FormData) ──────────────────────────────
  if (!file) {
    return NextResponse.json({ error: 'Fichier ou media_url requis' }, { status: 400 });
  }

  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedImageTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Type image non autorisé (JPG, PNG, WebP, GIF)' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image trop volumineuse (max 10 MB)' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `homepage-destination/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from('apartment-images')
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage
    .from('apartment-images')
    .getPublicUrl(path);

  const { data, error } = await supabaseAdmin
    .from('homepage_destination_media')
    .insert({
      ...commonFields,
      media_url: urlData.publicUrl,
      storage_path: path,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath('/[locale]', 'page');
  return NextResponse.json(data, { status: 201 });
}
