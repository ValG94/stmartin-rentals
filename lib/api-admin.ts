/**
 * API Admin — opérations CRUD via service_role (bypass RLS)
 * Utilisé uniquement dans les Route Handlers (serveur)
 */

import { supabaseAdmin } from './supabase';
import { Apartment, ApartmentImage, GuideSection, ApiResponse } from '@/types';

// ============================================================
// APPARTEMENTS — CRUD ADMIN
// ============================================================

export async function adminGetAllApartments(): Promise<ApiResponse<Apartment[]>> {
  const { data, error } = await supabaseAdmin
    .from('apartments')
    .select(`
      *,
      apartment_images(id, url, alt_fr, alt_en, is_cover, position, storage_path),
      apartment_sections(id, type, title_fr, title_en, content_fr, content_en, icon, position)
    `)
    .order('created_at', { ascending: true });

  if (error) return { data: null, error: error.message, success: false };
  return { data: data as unknown as Apartment[], error: null, success: true };
}

export async function adminGetApartmentById(id: string): Promise<ApiResponse<Apartment>> {
  const { data, error } = await supabaseAdmin
    .from('apartments')
    .select(`
      *,
      apartment_images(id, url, alt_fr, alt_en, is_cover, position, storage_path),
      apartment_sections(id, type, title_fr, title_en, content_fr, content_en, icon, position)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return { data: null, error: 'Appartement introuvable', success: false };
  return { data: data as unknown as Apartment, error: null, success: true };
}

export async function adminUpdateApartment(
  id: string,
  updates: Partial<Omit<Apartment, 'id' | 'images' | 'sections' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<Apartment>> {
  const { data, error } = await supabaseAdmin
    .from('apartments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return { data: null, error: error.message, success: false };
  return { data: data as unknown as Apartment, error: null, success: true };
}

export async function adminCreateApartment(
  apt: Omit<Apartment, 'id' | 'images' | 'sections' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<Apartment>> {
  const { data, error } = await supabaseAdmin
    .from('apartments')
    .insert(apt)
    .select()
    .single();

  if (error) return { data: null, error: error.message, success: false };
  return { data: data as unknown as Apartment, error: null, success: true };
}

// ============================================================
// IMAGES — CRUD ADMIN
// ============================================================

export async function adminUploadImage(
  apartmentId: string,
  file: File,
  altFr: string,
  altEn: string,
  isCover: boolean,
  position: number
): Promise<ApiResponse<ApartmentImage>> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${apartmentId}/${Date.now()}.${ext}`;

  // Upload vers Supabase Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from('apartment-images')
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (uploadError) return { data: null, error: uploadError.message, success: false };

  // URL publique
  const { data: urlData } = supabaseAdmin.storage
    .from('apartment-images')
    .getPublicUrl(fileName);

  // Enregistrement en base
  const { data, error } = await supabaseAdmin
    .from('apartment_images')
    .insert({
      apartment_id: apartmentId,
      url: urlData.publicUrl,
      storage_path: fileName,
      alt_fr: altFr,
      alt_en: altEn,
      is_cover: isCover,
      position,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message, success: false };
  return { data: data as ApartmentImage, error: null, success: true };
}

export async function adminDeleteImage(imageId: string): Promise<ApiResponse<null>> {
  // Récupérer le storage_path
  const { data: img } = await supabaseAdmin
    .from('apartment_images')
    .select('storage_path')
    .eq('id', imageId)
    .single();

  if (img?.storage_path) {
    await supabaseAdmin.storage
      .from('apartment-images')
      .remove([img.storage_path]);
  }

  const { error } = await supabaseAdmin
    .from('apartment_images')
    .delete()
    .eq('id', imageId);

  if (error) return { data: null, error: error.message, success: false };
  return { data: null, error: null, success: true };
}

export async function adminSetCoverImage(
  apartmentId: string,
  imageId: string
): Promise<ApiResponse<null>> {
  // Retirer is_cover de toutes les images
  await supabaseAdmin
    .from('apartment_images')
    .update({ is_cover: false })
    .eq('apartment_id', apartmentId);

  // Définir la nouvelle image de couverture
  const { error } = await supabaseAdmin
    .from('apartment_images')
    .update({ is_cover: true })
    .eq('id', imageId);

  if (error) return { data: null, error: error.message, success: false };
  return { data: null, error: null, success: true };
}

export async function adminUpdateImagePosition(
  imageId: string,
  position: number
): Promise<ApiResponse<null>> {
  const { error } = await supabaseAdmin
    .from('apartment_images')
    .update({ position })
    .eq('id', imageId);

  if (error) return { data: null, error: error.message, success: false };
  return { data: null, error: null, success: true };
}

// ============================================================
// SECTIONS DU GUIDE — CRUD ADMIN
// ============================================================

export async function adminUpsertSection(
  section: Omit<GuideSection, 'created_at' | 'updated_at'>
): Promise<ApiResponse<GuideSection>> {
  const { data, error } = await supabaseAdmin
    .from('apartment_sections')
    .upsert(section, { onConflict: 'id' })
    .select()
    .single();

  if (error) return { data: null, error: error.message, success: false };
  return { data: data as GuideSection, error: null, success: true };
}

export async function adminDeleteSection(sectionId: string): Promise<ApiResponse<null>> {
  const { error } = await supabaseAdmin
    .from('apartment_sections')
    .delete()
    .eq('id', sectionId);

  if (error) return { data: null, error: error.message, success: false };
  return { data: null, error: null, success: true };
}

// ============================================================
// RÉSERVATIONS — LECTURE ADMIN
// ============================================================

export async function adminGetBookings(): Promise<ApiResponse<unknown[]>> {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*, apartments(title_fr, title_en, slug)')
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message, success: false };
  return { data: data || [], error: null, success: true };
}

export async function adminUpdateBookingStatus(
  bookingId: string,
  status: string
): Promise<ApiResponse<null>> {
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ booking_status: status })
    .eq('id', bookingId);

  if (error) return { data: null, error: error.message, success: false };
  return { data: null, error: null, success: true };
}
