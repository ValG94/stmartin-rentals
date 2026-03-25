// ============================================================
// TYPES PRINCIPAUX - StMartin Rentals
// Prêts à connecter à Supabase
// ============================================================

export type Locale = 'fr' | 'en';

// --- Prix saisonnier ---
export interface SeasonalPrice {
  id: string;
  apartment_id: string;
  name_fr: string;
  name_en: string;
  price_per_night: number;
  date_from: string;
  date_to: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Appartement ---
export interface Apartment {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  short_description_fr: string;
  short_description_en: string;
  description_fr: string;
  description_en: string;
  location: string;
  price_per_night: number;
  current_price?: number; // Prix saisonnier actif (calculé à partir de seasonal_prices)
  currency: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  images: ApartmentImage[];
  sections: GuideSection[];
  seasonal_prices?: SeasonalPrice[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Image ---
export interface ApartmentImage {
  id: string;
  apartment_id: string;
  url: string;
  storage_path?: string;
  alt_fr: string;
  alt_en: string;
  is_cover: boolean;
  position: number;
}

// --- Section du guide ---
export type GuideSectionType =
  | 'welcome'
  | 'access'
  | 'wifi'
  | 'rules'
  | 'services'
  | 'recommendations'
  | 'emergency';

export interface GuideSection {
  id: string;
  apartment_id: string;
  type: GuideSectionType;
  title_fr: string;
  title_en: string;
  content_fr: string;
  content_en: string;
  icon: string;
  position: number;
}

// --- Réservation ---
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentMode = 'deposit' | 'full';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';

export interface Booking {
  id: string;
  apartment_id: string;
  apartment?: Apartment;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  nights: number;
  price_per_night: number;
  total_amount: number;
  deposit_amount: number;
  remaining_amount: number;
  payment_mode: PaymentMode;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  stripe_session_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Disponibilité ---
export type BlockType = 'booking' | 'maintenance' | 'owner';

export interface AvailabilityBlock {
  id: string;
  apartment_id: string;
  start_date: string;
  end_date: string;
  block_type: BlockType;
  label?: string;
}

// --- Formulaire de réservation ---
export interface BookingFormData {
  apartment_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  payment_mode: PaymentMode;
  notes?: string;
}

// --- Paramètres du site ---
export interface SiteSettings {
  id: string;
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  deposit_percentage: number;
  site_name_fr: string;
  site_name_en: string;
  meta_description_fr: string;
  meta_description_en: string;
}

// --- Réponse API générique ---
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
