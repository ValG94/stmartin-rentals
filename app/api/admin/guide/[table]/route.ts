import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminTokenAsync } from '@/lib/auth-admin';

// Lecture et écriture des sections et items du guide pour l'admin.
// Passe par le service role : la clé publique n'a plus que la lecture des
// contenus publiés (supabase/lock_admin_writes.sql).

const TABLES = new Set(['guide_sections', 'guide_items']);
// Colonnes gérées par la base, jamais écrites depuis l'admin
const READ_ONLY = ['id', 'created_at', 'updated_at'];

type Ctx = { params: Promise<{ table: string }> };

async function guard(req: NextRequest, ctx: Ctx): Promise<{ error: NextResponse; table?: undefined } | { error?: undefined; table: string }> {
  if (!(await verifyAdminTokenAsync(req))) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const { table } = await ctx.params;
  if (!TABLES.has(table)) return { error: NextResponse.json({ error: 'Unknown table' }, { status: 404 }) };
  return { table };
}

const clean = (row: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(row).filter(([k]) => !READ_ONLY.includes(k)));

/** GET ?apartmentId=… (sections partagées + de la villa) ou ?sectionId=… (items) */
export async function GET(req: NextRequest, ctx: Ctx) {
  const g = await guard(req, ctx);
  if (g.error) return g.error;
  const sp = req.nextUrl.searchParams;
  let query = supabaseAdmin.from(g.table).select('*').order('display_order', { ascending: true });
  if (g.table === 'guide_sections') {
    const apartmentId = sp.get('apartmentId');
    if (!apartmentId) return NextResponse.json({ error: 'apartmentId required' }, { status: 400 });
    query = query.or(`scope.eq.shared,apartment_id.eq.${apartmentId}`);
  } else {
    const sectionId = sp.get('sectionId');
    if (!sectionId) return NextResponse.json({ error: 'sectionId required' }, { status: 400 });
    query = query.eq('section_id', sectionId);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const g = await guard(req, ctx);
  if (g.error) return g.error;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const { error } = await supabaseAdmin.from(g.table).insert(clean(body));
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

/** PATCH ?id=… avec les champs à modifier */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const g = await guard(req, ctx);
  if (g.error) return g.error;
  const id = req.nextUrl.searchParams.get('id');
  const body = await req.json().catch(() => null);
  if (!id || !body || typeof body !== 'object') return NextResponse.json({ error: 'id and body required' }, { status: 400 });
  const { error } = await supabaseAdmin.from(g.table).update(clean(body)).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

/** DELETE ?id=… */
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const g = await guard(req, ctx);
  if (g.error) return g.error;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const { error } = await supabaseAdmin.from(g.table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
