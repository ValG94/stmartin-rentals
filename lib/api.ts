/**
 * API connectée à Supabase
 */

import { supabase } from './supabase';
import {
  Apartment,
  ApartmentImage,
  GuideSection,
  AvailabilityBlock,
  Booking,
  BookingFormData,
  ApiResponse,
} from '@/types';

// ============================================================
// HELPERS
// ============================================================

function mapApartment(row: Record<string, unknown>): Apartment {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title_fr: row.title_fr as string,
    title_en: row.title_en as string,
    short_description_fr: row.short_description_fr as string,
    short_description_en: row.short_description_en as string,
    description_fr: row.description_fr as string,
    description_en: row.description_en as string,
    location: row.location as string,
    price_per_night: Number(row.price_per_night),
    currency: (row.currency as string) || 'EUR',
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    max_guests: Number(row.max_guests),
    amenities: (row.amenities as string[]) || [],
    images: (row.apartment_images as ApartmentImage[]) || [],
    sections: (row.apartment_sections as GuideSection[]) || [],
    is_active: row.is_active as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// ============================================================
// APPARTEMENTS (lecture publique)
// ============================================================

export async function getApartments(): Promise<ApiResponse<Apartment[]>> {
  const { data, error } = await supabase
    .from('apartments')
    .select(`
      *,
      apartment_images(id, url, alt_fr, alt_en, is_cover, position, storage_path),
      apartment_sections(id, type, title_fr, title_en, content_fr, content_en, icon, position)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) return { data: null, error: error.message, success: false };
  return {
    data: (data || []).map((row) => mapApartment(row as Record<string, unknown>)),
    error: null,
    success: true,
  };
}

export async function getApartmentBySlug(slug: string): Promise<ApiResponse<Apartment>> {
  const { data, error } = await supabase
    .from('apartments')
    .select(`
      *,
      apartment_images(id, url, alt_fr, alt_en, is_cover, position, storage_path),
      apartment_sections(id, type, title_fr, title_en, content_fr, content_en, icon, position)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return { data: null, error: 'Appartement introuvable', success: false };
  return { data: mapApartment(data as Record<string, unknown>), error: null, success: true };
}

export async function getApartmentById(id: string): Promise<ApiResponse<Apartment>> {
  const { data, error } = await supabase
    .from('apartments')
    .select(`
      *,
      apartment_images(id, url, alt_fr, alt_en, is_cover, position, storage_path),
      apartment_sections(id, type, title_fr, title_en, content_fr, content_en, icon, position)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return { data: null, error: 'Appartement introuvable', success: false };
  return { data: mapApartment(data as Record<string, unknown>), error: null, success: true };
}

// ============================================================
// DISPONIBILITÉS (lecture publique)
// ============================================================

export async function getAvailabilityBlocks(
  apartmentId: string
): Promise<ApiResponse<AvailabilityBlock[]>> {
  const { data, error } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('apartment_id', apartmentId)
    .gte('end_date', new Date().toISOString().split('T')[0]);

  if (error) return { data: null, error: error.message, success: false };
  return { data: data || [], error: null, success: true };
}

export async function checkAvailability(
  apartmentId: string,
  checkIn: string,
  checkOut: string
): Promise<ApiResponse<boolean>> {
  const { data, error } = await supabase
    .from('availability_blocks')
    .select('id')
    .eq('apartment_id', apartmentId)
    .lt('start_date', checkOut)
    .gt('end_date', checkIn);

  if (error) return { data: null, error: error.message, success: false };
  return { data: (data || []).length === 0, error: null, success: true };
}

// ============================================================
// RÉSERVATIONS (écriture publique)
// ============================================================

export async function getBookings(): Promise<ApiResponse<Booking[]>> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, apartments(title_fr, title_en, slug)')
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message, success: false };
  return { data: (data || []) as Booking[], error: null, success: true };
}

export async function createBooking(
  formData: BookingFormData
): Promise<ApiResponse<Booking>> {
  const checkIn = new Date(formData.check_in);
  const checkOut = new Date(formData.check_out);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  const { data: apt } = await supabase
    .from('apartments')
    .select('price_per_night')
    .eq('id', formData.apartment_id)
    .single();

  if (!apt) return { data: null, error: 'Appartement introuvable', success: false };

  const pricePerNight = Number(apt.price_per_night);
  const totalAmount = pricePerNight * nights;
  const depositAmount = formData.payment_mode === 'deposit'
    ? Math.round(totalAmount * 0.3)
    : totalAmount;
  const remainingAmount = totalAmount - depositAmount;

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      apartment_id: formData.apartment_id,
      guest_name: formData.guest_name,
      guest_email: formData.guest_email,
      guest_phone: formData.guest_phone,
      check_in: formData.check_in,
      check_out: formData.check_out,
      guests_count: formData.guests_count,
      nights,
      price_per_night: pricePerNight,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      remaining_amount: remainingAmount,
      payment_mode: formData.payment_mode,
      notes: formData.notes,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message, success: false };
  return { data: data as Booking, error: null, success: true };
}

// ============================================================
// UTILITAIRES
// ============================================================

export function calculateBookingPrice(
  pricePerNight: number,
  checkIn: string,
  checkOut: string,
  depositPercentage = 30
) {
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
  const total = nights * pricePerNight;
  const deposit = Math.round(total * (depositPercentage / 100));
  return { nights, total, deposit, remaining: total - deposit };
}
