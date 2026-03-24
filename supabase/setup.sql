-- ============================================================
-- STMARTIN RENTALS — Script de création de la base de données
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Extension UUID (déjà activée sur Supabase, mais au cas où)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABLE: apartments
-- ============================================================
CREATE TABLE IF NOT EXISTS apartments (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                    TEXT UNIQUE NOT NULL,
  title_fr                TEXT NOT NULL DEFAULT '',
  title_en                TEXT NOT NULL DEFAULT '',
  short_description_fr    TEXT NOT NULL DEFAULT '',
  short_description_en    TEXT NOT NULL DEFAULT '',
  description_fr          TEXT NOT NULL DEFAULT '',
  description_en          TEXT NOT NULL DEFAULT '',
  location                TEXT NOT NULL DEFAULT '',
  price_per_night         NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency                TEXT NOT NULL DEFAULT 'EUR',
  bedrooms                INTEGER NOT NULL DEFAULT 1,
  bathrooms               INTEGER NOT NULL DEFAULT 1,
  max_guests              INTEGER NOT NULL DEFAULT 2,
  amenities               TEXT[] NOT NULL DEFAULT '{}',
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apartments_slug      ON apartments(slug);
CREATE INDEX IF NOT EXISTS idx_apartments_is_active ON apartments(is_active);

-- ============================================================
-- 2. TABLE: apartment_images
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
CREATE INDEX IF NOT EXISTS idx_apartment_images_position     ON apartment_images(apartment_id, position);

-- ============================================================
-- 3. TABLE: apartment_sections (guide digital)
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
-- 4. TABLE: bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apartment_id             UUID NOT NULL REFERENCES apartments(id),
  guest_name               TEXT NOT NULL,
  guest_email              TEXT NOT NULL,
  guest_phone              TEXT NOT NULL DEFAULT '',
  check_in                 DATE NOT NULL,
  check_out                DATE NOT NULL,
  guests_count             INTEGER NOT NULL DEFAULT 1,
  nights                   INTEGER NOT NULL DEFAULT 1,
  price_per_night          NUMERIC(10,2) NOT NULL,
  total_amount             NUMERIC(10,2) NOT NULL,
  deposit_amount           NUMERIC(10,2) NOT NULL DEFAULT 0,
  remaining_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_mode             TEXT NOT NULL DEFAULT 'full'    CHECK (payment_mode    IN ('deposit','full')),
  payment_status           TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status  IN ('pending','partial','paid','refunded')),
  booking_status           TEXT NOT NULL DEFAULT 'pending' CHECK (booking_status  IN ('pending','confirmed','cancelled','completed')),
  stripe_session_id        TEXT,
  stripe_payment_intent_id TEXT,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_apartment_id ON bookings(apartment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in     ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out    ON bookings(check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings(booking_status);

-- ============================================================
-- 5. TABLE: availability_blocks
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
CREATE INDEX IF NOT EXISTS idx_availability_blocks_dates        ON availability_blocks(apartment_id, start_date, end_date);

-- ============================================================
-- 6. TABLE: payment_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id               UUID NOT NULL REFERENCES bookings(id),
  stripe_session_id        TEXT,
  stripe_payment_intent_id TEXT,
  amount                   NUMERIC(10,2) NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'EUR',
  payment_mode             TEXT NOT NULL CHECK (payment_mode IN ('deposit','full')),
  status                   TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','refunded')),
  metadata                 JSONB,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id     ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_session ON payment_transactions(stripe_session_id);

-- ============================================================
-- 7. TABLE: site_settings
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
-- 8. TRIGGER: updated_at automatique
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_apartments_updated_at         ON apartments;
DROP TRIGGER IF EXISTS update_apartment_sections_updated_at ON apartment_sections;
DROP TRIGGER IF EXISTS update_bookings_updated_at           ON bookings;
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;

CREATE TRIGGER update_apartments_updated_at
  BEFORE UPDATE ON apartments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apartment_sections_updated_at
  BEFORE UPDATE ON apartment_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. RLS (Row Level Security)
-- ============================================================
ALTER TABLE apartments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_images     ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_sections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings        ENABLE ROW LEVEL SECURITY;

-- Lecture publique des appartements actifs
DROP POLICY IF EXISTS "Public read active apartments" ON apartments;
CREATE POLICY "Public read active apartments" ON apartments
  FOR SELECT USING (is_active = true);

-- Lecture publique des images (des appartements actifs)
DROP POLICY IF EXISTS "Public read apartment images" ON apartment_images;
CREATE POLICY "Public read apartment images" ON apartment_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM apartments WHERE id = apartment_images.apartment_id AND is_active = true)
  );

-- Lecture publique des sections (des appartements actifs)
DROP POLICY IF EXISTS "Public read apartment sections" ON apartment_sections;
CREATE POLICY "Public read apartment sections" ON apartment_sections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM apartments WHERE id = apartment_sections.apartment_id AND is_active = true)
  );

-- Lecture publique des blocs de disponibilité
DROP POLICY IF EXISTS "Public read availability blocks" ON availability_blocks;
CREATE POLICY "Public read availability blocks" ON availability_blocks
  FOR SELECT USING (true);

-- Lecture publique des paramètres du site
DROP POLICY IF EXISTS "Public read site settings" ON site_settings;
CREATE POLICY "Public read site settings" ON site_settings
  FOR SELECT USING (true);

-- Création de réservation publique (formulaire de réservation)
DROP POLICY IF EXISTS "Public insert bookings" ON bookings;
CREATE POLICY "Public insert bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 10. STORAGE BUCKET: apartment-images
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apartment-images',
  'apartment-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Lecture publique des images dans le bucket
DROP POLICY IF EXISTS "Public read apartment images storage" ON storage.objects;
CREATE POLICY "Public read apartment images storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'apartment-images');

-- Upload via service_role uniquement (admin)
DROP POLICY IF EXISTS "Admin upload apartment images" ON storage.objects;
CREATE POLICY "Admin upload apartment images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'apartment-images');

DROP POLICY IF EXISTS "Admin update apartment images" ON storage.objects;
CREATE POLICY "Admin update apartment images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'apartment-images');

DROP POLICY IF EXISTS "Admin delete apartment images" ON storage.objects;
CREATE POLICY "Admin delete apartment images" ON storage.objects
  FOR DELETE USING (bucket_id = 'apartment-images');

-- ============================================================
-- 11. DONNÉES INITIALES
-- ============================================================

-- Paramètres du site (1 seule ligne)
INSERT INTO site_settings (contact_email, contact_phone, contact_whatsapp, deposit_percentage, site_name_fr, site_name_en, meta_description_fr, meta_description_en)
VALUES (
  'contact@stmartin-rentals.com',
  '+590 690 00 00 00',
  '+590690000000',
  30,
  'StMartin Rentals',
  'StMartin Rentals',
  'Location de villas de luxe à Saint-Martin — piscine privée, vue mer et lagon',
  'Luxury villa rentals in Saint-Martin — private pool, sea and lagoon views'
)
ON CONFLICT DO NOTHING;

-- La Villa Vanille
INSERT INTO apartments (
  id, slug, title_fr, title_en,
  short_description_fr, short_description_en,
  description_fr, description_en,
  location, price_per_night, bedrooms, bathrooms, max_guests, amenities, is_active
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'villa-vanille',
  'La Villa Vanille',
  'La Villa Vanille',
  'Villa de luxe avec piscine à débordement et vue mer panoramique',
  'Luxury villa with infinity pool and panoramic sea view',
  'La La Villa Vanille est une propriété d''exception nichée à Terres Basses, offrant une vue mer panoramique époustouflante. Avec sa piscine à débordement, ses 4 chambres spacieuses et ses finitions haut de gamme, elle représente le summum du luxe caribéen.',
  'La Villa Vanille is an exceptional property nestled in Terres Basses, offering a breathtaking panoramic sea view. With its infinity pool, 4 spacious bedrooms and high-end finishes, it represents the pinnacle of Caribbean luxury.',
  'Terres Basses, Saint-Martin',
  650, 4, 4, 8,
  ARRAY['Piscine à débordement', 'Vue mer panoramique', 'Cuisine équipée', 'Climatisation', 'Wi-Fi haut débit', 'Parking privé', 'Terrasse', 'BBQ', 'Linge de maison', 'Ménage inclus'],
  true
) ON CONFLICT (slug) DO NOTHING;

-- La Villa Blanche
INSERT INTO apartments (
  id, slug, title_fr, title_en,
  short_description_fr, short_description_en,
  description_fr, description_en,
  location, price_per_night, bedrooms, bathrooms, max_guests, amenities, is_active
) VALUES (
  'a1b2c3d4-0000-0000-0000-000000000002',
  'villa-blanche',
  'La Villa Blanche',
  'La Villa Blanche',
  'Charmante villa avec piscine privée et vue sur le lagon turquoise',
  'Charming villa with private pool and turquoise lagoon view',
  'La La Villa Blanche est un havre de paix à Sandy Ground, avec une vue imprenable sur le lagon turquoise de Saint-Martin. Idéale pour les couples ou les familles, elle dispose de 2 chambres confortables et d''une piscine privée.',
  'La Villa Blanche is a haven of peace in Sandy Ground, with a stunning view of the turquoise lagoon of Saint-Martin. Ideal for couples or families, it has 2 comfortable bedrooms and a private pool.',
  'Sandy Ground, Saint-Martin',
  320, 2, 2, 4,
  ARRAY['Piscine privée', 'Vue lagon', 'Cuisine équipée', 'Climatisation', 'Wi-Fi', 'Parking', 'Terrasse', 'Kayaks disponibles', 'Linge de maison'],
  true
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
SELECT 'Tables créées avec succès ✅' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
