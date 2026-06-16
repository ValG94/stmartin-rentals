import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

const ALLOWED_MIME = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

// POST /api/admin/homepage-destination-media/videos/sign-upload
// Génère une URL signée pour upload direct browser → Supabase Storage,
// pour contourner la limite de 4.5 MB des serverless functions Vercel.
//
// Body : { fileName: string, fileSize: number, fileType: string }
// Returns : { signedUrl, token, storage_path, public_url }
export async function POST(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { fileName, fileSize, fileType } = await req.json();

  if (!fileName || typeof fileSize !== 'number' || !fileType) {
    return NextResponse.json({ error: 'fileName, fileSize, fileType requis' }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(fileType)) {
    return NextResponse.json(
      { error: `Type non autorisé. Acceptés : ${ALLOWED_MIME.join(', ')}` },
      { status: 400 }
    );
  }
  if (fileSize > MAX_BYTES) {
    return NextResponse.json(
      { error: `Fichier trop volumineux (max ${MAX_BYTES / 1024 / 1024} MB)` },
      { status: 400 }
    );
  }

  const ext = (fileName.split('.').pop() || 'mp4').toLowerCase();
  const path = `homepage-destination/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from('apartment-videos')
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Échec création URL' }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('apartment-videos')
    .getPublicUrl(path);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    storage_path: path,
    public_url: urlData.publicUrl,
  });
}
