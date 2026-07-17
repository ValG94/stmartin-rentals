import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDepositReminderEmail } from '@/lib/services/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron quotidien — relance les clients dont l'empreinte CB n'est pas encore
 * posée quand leur arrivée est dans 2 jours (fenêtre J-2 à J-1).
 *
 * Fenêtre : bookings avec check_in dans [aujourd'hui+1, aujourd'hui+3[
 *   → couvre J-1, J-2, quel que soit le jour d'exécution.
 *
 * Idempotence : `deposit_reminded_at` empêche l'envoi de plusieurs mails
 * à la même booking (une seule relance par cycle).
 *
 * Configuration Vercel : voir vercel.json (cron 0 9 * * *  = 09h UTC).
 * Auth : Bearer CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization');
  const querySecret = new URL(req.url).searchParams.get('secret');
  const provided = authHeader?.replace(/^Bearer\s+/i, '') || querySecret;
  if (provided !== secret) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fenêtre de dates : [demain, dans 3 jours[ — YYYY-MM-DD
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id, guest_name, guest_email, check_in, check_out, locale,
      security_deposit_amount, deposit_authorization_status,
      deposit_reminded_at,
      booking_status, payment_method,
      apartments:apartment_id (title_fr, title_en)
    `)
    .eq('booking_status', 'confirmed')
    .eq('payment_method', 'fygaro')
    .gte('check_in', fmt(tomorrow))
    .lt('check_in', fmt(in3Days))
    .gt('security_deposit_amount', 0)
    .is('deposit_reminded_at', null);

  if (error) {
    console.error('[cron deposit-reminders] query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://islandlivingsxm.com').replace(/\/+$/, '');
  const results: { bookingId: string; ok: boolean; error?: string }[] = [];

  for (const b of (bookings ?? [])) {
    // On filtre côté JS le statut caution — Supabase ne permet pas de
    // OR facilement sur "null OR != authorized".
    const st = (b as { deposit_authorization_status?: string | null }).deposit_authorization_status;
    if (st === 'authorized' || st === 'captured') continue;

    const locale: 'fr' | 'en' = (b as { locale?: string }).locale === 'fr' ? 'fr' : 'en';
    type ApartmentInfo = { title_fr?: string; title_en?: string };
    const apartmentsRaw = (b as { apartments?: ApartmentInfo | ApartmentInfo[] }).apartments;
    const apartments = Array.isArray(apartmentsRaw) ? apartmentsRaw[0] : apartmentsRaw;
    const villaName = locale === 'fr'
      ? (apartments?.title_fr || apartments?.title_en || 'Villa')
      : (apartments?.title_en || 'Villa');

    const bookingId = (b as { id: string }).id;
    const authorizeUrl = `${siteUrl}/${locale}/booking/fygaro-success?bookingId=${bookingId}&mode=booking`;

    try {
      await sendDepositReminderEmail({
        guestName: (b as { guest_name: string }).guest_name,
        guestEmail: (b as { guest_email: string }).guest_email,
        villaName,
        checkIn: (b as { check_in: string }).check_in,
        securityDepositAmount: Number((b as { security_deposit_amount: number }).security_deposit_amount) || 0,
        bookingId,
        authorizeUrl,
        locale,
      });
      await supabase
        .from('bookings')
        .update({ deposit_reminded_at: new Date().toISOString() })
        .eq('id', bookingId);
      results.push({ bookingId, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.error(`[cron deposit-reminders] booking ${bookingId}:`, msg);
      results.push({ bookingId, ok: false, error: msg });
    }
  }

  return NextResponse.json({
    windowStart: fmt(tomorrow),
    windowEnd: fmt(in3Days),
    processed: results.length,
    results,
  });
}
