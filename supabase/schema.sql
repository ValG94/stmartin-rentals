-- ============================================================
-- SCHEMA SQL - StMartin Rentals
-- Supabase / PostgreSQL
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: apartments
-- ============================================================
CREATE TABLE IF NOT EXISTS apartments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,
  title_fr      TEXT NOT NULL,
  title_en      TEXT NOT NULL,
  short_description_fr TEXT NOT NULL DEFAULT '',
  short_description_en TEXT NOT NULL DEFAULT '',
  description_fr TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  location      TEXT NOT NULL DEFAULT '',
  price_per_night NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'EUR',
  bedrooms      INTEGER NOT NULL DEFAULT 1,
  bathrooms     INTEGER NOT NULL DEFAULT 1,
  max_guests    INTEGER NOT NULL DEFAULT 2,
  amenities     TEXT[] NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apartments_slug ON apartments(slug);
CREATE INDEX IF NOT EXISTS idx_apartments_is_active ON apartments(is_active);

-- ============================================================
-- TABLE: apartment_images
-- ============================================================
CREATE TABLE IF NOT EXISTS apartment_images (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id  UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  storage_path  TEXT,
  alt_fr        TEXT NOT NULL DEFAULT '',
  alt_en        TEXT NOT NULL DEFAULT '',
  is_cover      BOOLEAN NOT NULL DEFAULT false,
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apartment_images_apartment_id ON apartment_images(apartment_id);
CREATE INDEX IF NOT EXISTS idx_apartment_images_position ON apartment_images(apartment_id, position);

-- ============================================================
-- TABLE: apartment_sections (guide digital)
-- ============================================================
CREATE TABLE IF NOT EXISTS apartment_sections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id  UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('welcome','access','wifi','rules','services','recommendations','emergency')),
  title_fr      TEXT NOT NULL DEFAULT '',
  title_en      TEXT NOT NULL DEFAULT '',
  content_fr    TEXT NOT NULL DEFAULT '',
  content_en    TEXT NOT NULL DEFAULT '',
  icon          TEXT NOT NULL DEFAULT '📋',
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apartment_sections_apartment_id ON apartment_sections(apartment_id);

-- ============================================================
-- TABLE: bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id    UUID NOT NULL REFERENCES apartments(id),
  guest_name      TEXT NOT NULL,
  guest_email     TEXT NOT NULL,
  guest_phone     TEXT NOT NULL DEFAULT '',
  check_in        DATE NOT NULL,
  check_out       DATE NOT NULL,
  guests_count    INTEGER NOT NULL DEFAULT 1,
  nights          INTEGER NOT NULL DEFAULT 1,
  price_per_night NUMERIC(10,2) NOT NULL,
  total_amount    NUMERIC(10,2) NOT NULL,
  deposit_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_mode    TEXT NOT NULL DEFAULT 'full' CHECK (payment_mode IN ('deposit','full')),
  payment_status  TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','partial','paid','refunded')),
  booking_status  TEXT NOT NULL DEFAULT 'pending' CHECK (booking_status IN ('pending','confirmed','cancelled','completed')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_apartment_id ON bookings(apartment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON bookings(check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);

-- ============================================================
-- TABLE: availability_blocks
-- ============================================================
CREATE TABLE IF NOT EXISTS availability_blocks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id  UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  block_type    TEXT NOT NULL DEFAULT 'owner' CHECK (block_type IN ('booking','maintenance','owner')),
  label         TEXT,
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_availability_blocks_apartment_id ON availability_blocks(apartment_id);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_dates ON availability_blocks(apartment_id, start_date, end_date);

-- ============================================================
-- TABLE: payment_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id          UUID NOT NULL REFERENCES bookings(id),
  stripe_session_id   TEXT,
  stripe_payment_intent_id TEXT,
  amount              NUMERIC(10,2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'EUR',
  payment_mode        TEXT NOT NULL CHECK (payment_mode IN ('deposit','full')),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','refunded')),
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_session ON payment_transactions(stripe_session_id);

-- ============================================================
-- TABLE: site_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_email         TEXT NOT NULL DEFAULT '',
  contact_phone         TEXT NOT NULL DEFAULT '',
  contact_whatsapp      TEXT NOT NULL DEFAULT '',
  deposit_percentage    INTEGER NOT NULL DEFAULT 30,
  site_name_fr          TEXT NOT NULL DEFAULT 'StMartin Rentals',
  site_name_en          TEXT NOT NULL DEFAULT 'StMartin Rentals',
  meta_description_fr   TEXT NOT NULL DEFAULT '',
  meta_description_en   TEXT NOT NULL DEFAULT '',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGER: updated_at automatique
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_apartments_updated_at BEFORE UPDATE ON apartments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apartment_sections_updated_at BEFORE UPDATE ON apartment_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Lecture publique des appartements actifs
CREATE POLICY "Public read active apartments" ON apartments
  FOR SELECT USING (is_active = true);

-- Lecture publique des images
CREATE POLICY "Public read apartment images" ON apartment_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM apartments WHERE id = apartment_images.apartment_id AND is_active = true)
  );

-- Lecture publique des sections
CREATE POLICY "Public read apartment sections" ON apartment_sections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM apartments WHERE id = apartment_sections.apartment_id AND is_active = true)
  );

-- Lecture publique des blocs de disponibilité
CREATE POLICY "Public read availability blocks" ON availability_blocks
  FOR SELECT USING (true);

-- Lecture publique des paramètres du site
CREATE POLICY "Public read site settings" ON site_settings
  FOR SELECT USING (true);

-- Toutes les opérations admin via service_role (bypass RLS)
-- Le service_role contourne automatiquement le RLS dans Supabase

-- ============================================================
-- STORAGE BUCKET: apartment-images
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apartment-images',
  'apartment-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Politique de lecture publique sur le bucket
CREATE POLICY "Public read apartment images storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'apartment-images');

-- Upload uniquement via service_role (admin)
CREATE POLICY "Service role upload apartment images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'apartment-images');

CREATE POLICY "Service role delete apartment images" ON storage.objects
  FOR DELETE USING (bucket_id = 'apartment-images');

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================

-- Paramètres du site
INSERT INTO site_settings (contact_email, contact_phone, contact_whatsapp, deposit_percentage, site_name_fr, site_name_en)
VALUES ('contact@stmartin-rentals.com', '+590 690 00 00 00', '+590690000000', 30, 'StMartin Rentals', 'StMartin Rentals')
ON CONFLICT DO NOTHING;

-- Villa Azur
INSERT INTO apartments (id, slug, title_fr, title_en, short_description_fr, short_description_en, description_fr, description_en, location, price_per_night, bedrooms, bathrooms, max_guests, amenities)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'villa-azur',
  'Villa Azur',
  'Villa Azur',
  'Villa de luxe avec piscine à débordement et vue mer panoramique',
  'Luxury villa with infinity pool and panoramic sea view',
  'La Villa Azur est une propriété d''exception nichée à Terres Basses, offrant une vue mer panoramique époustouflante. Avec sa piscine à débordement, ses 4 chambres spacieuses et ses finitions haut de gamme, elle représente le summum du luxe caribéen.',
  'Villa Azur is an exceptional property nestled in Terres Basses, offering a breathtaking panoramic sea view. With its infinity pool, 4 spacious bedrooms and high-end finishes, it represents the pinnacle of Caribbean luxury.',
  'Terres Basses, Saint-Martin',
  650,
  4,
  4,
  8,
  ARRAY['Piscine à débordement', 'Vue mer panoramique', 'Cuisine équipée', 'Climatisation', 'Wi-Fi haut débit', 'Parking privé', 'Terrasse', 'BBQ', 'Linge de maison', 'Ménage inclus']
) ON CONFLICT (slug) DO NOTHING;

-- Villa Lagon
INSERT INTO apartments (id, slug, title_fr, title_en, short_description_fr, short_description_en, description_fr, description_en, location, price_per_night, bedrooms, bathrooms, max_guests, amenities)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000002',
  'villa-lagon',
  'Villa Lagon',
  'Villa Lagon',
  'Charmante villa avec piscine privée et vue sur le lagon turquoise',
  'Charming villa with private pool and turquoise lagoon view',
  'La Villa Lagon est un havre de paix à Sandy Ground, avec une vue imprenable sur le lagon turquoise de Saint-Martin. Idéale pour les couples ou les familles, elle dispose de 2 chambres confortables et d''une piscine privée.',
  'Villa Lagon is a haven of peace in Sandy Ground, with a stunning view of the turquoise lagoon of Saint-Martin. Ideal for couples or families, it has 2 comfortable bedrooms and a private pool.',
  'Sandy Ground, Saint-Martin',
  320,
  2,
  2,
  4,
  ARRAY['Piscine privée', 'Vue lagon', 'Cuisine équipée', 'Climatisation', 'Wi-Fi', 'Parking', 'Terrasse', 'Kayaks disponibles', 'Linge de maison']
) ON CONFLICT (slug) DO NOTHING;
