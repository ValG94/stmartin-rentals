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
  const auth = verifyAdminToken(req);
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
