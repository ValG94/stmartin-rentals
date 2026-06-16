import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

// POST /api/admin/homepage-destination-media/reorder
// Body : { ids: string[] }
// Met à jour display_order de chaque média selon l'ordre du tableau.
// Appelé après un drag-and-drop côté admin.
export async function POST(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { ids } = await req.json();
  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: 'ids doit être un tableau' }, { status: 400 });
  }

  // Update séquentiel — petit volume (max ~20 slides typiquement)
  const errors: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    const { error } = await supabaseAdmin
      .from('homepage_destination_media')
      .update({ display_order: i })
      .eq('id', ids[i]);
    if (error) errors.push(`${ids[i]}: ${error.message}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 500 });
  }

  revalidatePath('/[locale]', 'page');
  return NextResponse.json({ success: true, reordered: ids.length });
}
