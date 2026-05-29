import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

// DELETE /api/admin/availability-blocks/[blockId]
//
// Supprime un blocage. On restreint aux blocs manuels (source = 'manual')
// pour éviter qu'on supprime par erreur un bloc Airbnb/VRBO importé
// (qui serait de toute façon recréé au prochain sync).
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { blockId } = await params;

  const { error } = await supabaseAdmin
    .from('availability_blocks')
    .delete()
    .eq('id', blockId)
    .eq('source', 'manual');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/[locale]/apartments/[slug]', 'page');
  return NextResponse.json({ success: true });
}
