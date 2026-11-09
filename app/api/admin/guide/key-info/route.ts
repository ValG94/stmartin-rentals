import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminTokenAsync } from '@/lib/auth-admin';

// Infos clés d'une villa (dont mot de passe Wi-Fi et codes) : lues et
// écrites uniquement côté serveur, la clé publique n'y a plus accès
// (supabase/protect_guest_access_codes.sql).

const EDITABLE = [
  'wifi_name', 'wifi_password', 'gate_code', 'alarm_code',
  'parking_info_fr', 'parking_info_en', 'address_text_fr', 'address_text_en', 'map_link',
  'host_phone', 'emergency_phone', 'fire_phone', 'whatsapp',
  'checkin_time', 'checkout_time', 'checkin_note_fr', 'checkin_note_en', 'checkout_note_fr', 'checkout_note_en',
  'hero_image_url', 'hero_tagline_fr', 'hero_tagline_en', 'hero_tagline_color', 'hero_tagline_italic',
] as const;

export async function GET(req: NextRequest) {
  if (!(await verifyAdminTokenAsync(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const apartmentId = req.nextUrl.searchParams.get('apartmentId');
  if (!apartmentId) return NextResponse.json({ error: 'apartmentId required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('apartment_key_info')
    .select('*')
    .eq('apartment_id', apartmentId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keyInfo: data ?? {} });
}

export async function PUT(req: NextRequest) {
  if (!(await verifyAdminTokenAsync(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null) as { apartmentId?: string; keyInfo?: Record<string, unknown> } | null;
  if (!body?.apartmentId || !body.keyInfo) return NextResponse.json({ error: 'apartmentId and keyInfo required' }, { status: 400 });

  const row: Record<string, unknown> = { apartment_id: body.apartmentId };
  for (const key of EDITABLE) if (key in body.keyInfo) row[key] = body.keyInfo[key];

  const { error } = await supabaseAdmin
    .from('apartment_key_info')
    .upsert(row, { onConflict: 'apartment_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
