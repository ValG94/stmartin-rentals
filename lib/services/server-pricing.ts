// ============================================================
// Server-only pricing — calcule les montants depuis la base
// ============================================================
//
// Ce module N'EST JAMAIS importé côté client. Il sert à recalculer
// les montants d'une réservation à partir de la DB, sans faire
// confiance aux valeurs envoyées par le navigateur.
//
// Règle de sécurité : aucune route /api/booking/* ni /api/paypal/*
// ne doit accepter de prix venant du client. Le client n'envoie que
// (apartmentId, checkIn, checkOut, paymentOption). Le reste est
// recalculé ici.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { calculatePricing, type PricingResult } from './pricing';

let _admin: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL must be set');
  }
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

export interface ServerPricing extends PricingResult {
  apartmentSlug: string;
  apartmentName: string;
  effectiveNightlyRate: number;
  amountDue: number;
}

/**
 * Recalcule le pricing pour une réservation à partir des données serveur.
 *
 * @throws si l'apparte n'existe pas, les dates sont invalides, ou la
 *         période demandée chevauche déjà une réservation/un blocage.
 */
export async function computeServerPricing(args: {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  paymentOption: 'full' | 'deposit_40';
}): Promise<ServerPricing> {
  const { apartmentId, checkIn, checkOut, paymentOption } = args;

  // 1. Validation basique des dates
  if (!checkIn || !checkOut) throw new Error('checkIn and checkOut are required');
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (Number.isNaN(ci.getTime()) || Number.isNaN(co.getTime())) {
    throw new Error('Invalid dates');
  }
  if (co.getTime() <= ci.getTime()) {
    throw new Error('check-out must be after check-in');
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (ci.getTime() < today.getTime()) {
    throw new Error('check-in cannot be in the past');
  }

  // 2. Récupérer l'appartement (slug + prix de base)
  const sb = admin();
  const { data: apt, error: aptErr } = await sb
    .from('apartments')
    .select('id, slug, title_en, price_per_night')
    .eq('id', apartmentId)
    .single();

  if (aptErr || !apt) throw new Error('Apartment not found');

  // 3. Tarif saisonnier (le premier qui chevauche la période)
  const { data: seasonal } = await sb
    .from('seasonal_prices')
    .select('price_per_night, date_from, date_to')
    .eq('apartment_id', apartmentId)
    .eq('is_active', true)
    .lte('date_from', checkOut)
    .gte('date_to', checkIn)
    .order('price_per_night', { ascending: false }) // prend le plus haut si chevauchement multiple
    .limit(1)
    .maybeSingle();

  const effectiveNightlyRate = seasonal
    ? Number(seasonal.price_per_night)
    : Number(apt.price_per_night);

  if (!Number.isFinite(effectiveNightlyRate) || effectiveNightlyRate <= 0) {
    throw new Error('Invalid nightly rate for this apartment');
  }

  // 4. Vérification disponibilité (anti double-booking)
  await assertAvailable(sb, apartmentId, checkIn, checkOut);

  // 5. Calcul des montants
  const pricing = calculatePricing(apt.slug, checkIn, checkOut, effectiveNightlyRate);
  const amountDue = paymentOption === 'full' ? pricing.bookingTotal : pricing.depositAmount;

  return {
    ...pricing,
    apartmentSlug: apt.slug,
    apartmentName: apt.title_en,
    effectiveNightlyRate,
    amountDue,
  };
}

/**
 * Throw si les dates demandées chevauchent une réservation pending/confirmed
 * ou un blocage de disponibilité.
 */
async function assertAvailable(
  sb: SupabaseClient,
  apartmentId: string,
  checkIn: string,
  checkOut: string,
): Promise<void> {
  // Conflit avec d'autres bookings (status actifs)
  const { data: conflicts, error: err1 } = await sb
    .from('bookings')
    .select('id, booking_status, check_in, check_out')
    .eq('apartment_id', apartmentId)
    .in('booking_status', ['pending', 'pending_bank_transfer', 'confirmed', 'partially_paid'])
    .lt('check_in', checkOut)
    .gt('check_out', checkIn);

  if (err1) throw new Error(`Availability check failed: ${err1.message}`);
  if (conflicts && conflicts.length > 0) {
    const e = new Error('Dates no longer available') as Error & { code?: string };
    e.code = 'DATES_UNAVAILABLE';
    throw e;
  }

  // Conflit avec un blocage manuel
  const { data: blocks, error: err2 } = await sb
    .from('availability_blocks')
    .select('id, start_date, end_date')
    .eq('apartment_id', apartmentId)
    .lt('start_date', checkOut)
    .gt('end_date', checkIn);

  if (err2) throw new Error(`Availability check failed: ${err2.message}`);
  if (blocks && blocks.length > 0) {
    const e = new Error('Dates no longer available') as Error & { code?: string };
    e.code = 'DATES_UNAVAILABLE';
    throw e;
  }
}

export function getServerSupabase(): SupabaseClient {
  return admin();
}
