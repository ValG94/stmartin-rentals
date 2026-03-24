/**
 * API mockée - À remplacer par des appels Supabase
 * Toutes les fonctions retournent des Promises pour faciliter la migration
 */

import {
  Apartment,
  AvailabilityBlock,
  Booking,
  BookingFormData,
  ApiResponse,
} from '@/types';
import {
  MOCK_APARTMENTS,
  MOCK_AVAILABILITY_BLOCKS,
  MOCK_BOOKINGS,
} from './mock-data';

// --- Appartements ---

export async function getApartments(): Promise<ApiResponse<Apartment[]>> {
  await delay(100);
  return { data: MOCK_APARTMENTS.filter((a) => a.is_active), error: null, success: true };
}

export async function getApartmentBySlug(slug: string): Promise<ApiResponse<Apartment>> {
  await delay(100);
  const apt = MOCK_APARTMENTS.find((a) => a.slug === slug && a.is_active);
  if (!apt) return { data: null, error: 'Apartment not found', success: false };
  return { data: apt, error: null, success: true };
}

export async function getApartmentById(id: string): Promise<ApiResponse<Apartment>> {
  await delay(100);
  const apt = MOCK_APARTMENTS.find((a) => a.id === id);
  if (!apt) return { data: null, error: 'Apartment not found', success: false };
  return { data: apt, error: null, success: true };
}

// --- Disponibilités ---

export async function getAvailabilityBlocks(
  apartmentId: string
): Promise<ApiResponse<AvailabilityBlock[]>> {
  await delay(100);
  const blocks = MOCK_AVAILABILITY_BLOCKS.filter((b) => b.apartment_id === apartmentId);
  return { data: blocks, error: null, success: true };
}

export async function checkAvailability(
  apartmentId: string,
  checkIn: string,
  checkOut: string
): Promise<ApiResponse<boolean>> {
  await delay(200);
  const blocks = MOCK_AVAILABILITY_BLOCKS.filter((b) => b.apartment_id === apartmentId);
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const isBlocked = blocks.some((block) => {
    const blockStart = new Date(block.start_date);
    const blockEnd = new Date(block.end_date);
    return checkInDate < blockEnd && checkOutDate > blockStart;
  });

  return { data: !isBlocked, error: null, success: true };
}

// --- Réservations ---

export async function getBookings(): Promise<ApiResponse<Booking[]>> {
  await delay(100);
  const bookingsWithApartments = MOCK_BOOKINGS.map((b) => ({
    ...b,
    apartment: MOCK_APARTMENTS.find((a) => a.id === b.apartment_id),
  }));
  return { data: bookingsWithApartments, error: null, success: true };
}

export async function createBooking(
  formData: BookingFormData
): Promise<ApiResponse<Booking>> {
  await delay(500);

  const apt = MOCK_APARTMENTS.find((a) => a.id === formData.apartment_id);
  if (!apt) return { data: null, error: 'Apartment not found', success: false };

  const checkIn = new Date(formData.check_in);
  const checkOut = new Date(formData.check_out);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalAmount = nights * apt.price_per_night;
  const depositAmount = Math.round(totalAmount * 0.3);

  const newBooking: Booking = {
    id: `r${Date.now()}`,
    apartment_id: formData.apartment_id,
    guest_name: formData.guest_name,
    guest_email: formData.guest_email,
    guest_phone: formData.guest_phone,
    check_in: formData.check_in,
    check_out: formData.check_out,
    guests_count: formData.guests_count,
    nights,
    price_per_night: apt.price_per_night,
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    remaining_amount: formData.payment_mode === 'full' ? 0 : totalAmount - depositAmount,
    payment_mode: formData.payment_mode,
    payment_status: 'pending',
    booking_status: 'pending',
    notes: formData.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { data: newBooking, error: null, success: true };
}

// --- Utilitaires ---

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
