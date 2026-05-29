import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth-admin';

// Types de blocage manuels autorisés (source = 'manual')
const ALLOWED_TYPES = ['booking', 'owner', 'maintenance'] as const;
type ManualBlockType = (typeof ALLOWED_TYPES)[number];

// POST /api/admin/availability-blocks
// Body : { apartment_id, start_date, end_date, block_type, label? }
//
// Crée un blocage manuel (résa directe / propriétaire / maintenance).
// Bloque les dates côté formulaire public ET sera exporté vers Airbnb
// via le flux iCal (/api/ical/[slug]).
export async function POST(req: NextRequest) {
  const auth = verifyAdminToken(req);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const body = await req.json();
  const { apartment_id, start_date, end_date, block_type, label } = body;

  if (!apartment_id || !start_date || !end_date) {
    return NextResponse.json({ error: 'apartment_id, start_date et end_date requis' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(block_type)) {
    return NextResponse.json({ error: `block_type invalide (${ALLOWED_TYPES.join(', ')})` }, { status: 400 });
  }
  if (end_date < start_date) {
    return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('availability_blocks')
    .insert({
      apartment_id,
      start_date,
      end_date,
      block_type: block_type as ManualBlockType,
      source: 'manual',
      label: (label || '').slice(0, 200) || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath('/[locale]/apartments/[slug]', 'page');
  return NextResponse.json(data, { status: 201 });
}
