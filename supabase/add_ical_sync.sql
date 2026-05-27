-- ============================================================
-- Synchronisation iCal — Airbnb / VRBO / Booking.com
-- ============================================================
--
-- Permet à chaque villa de :
--   1. Importer les réservations d'Airbnb/VRBO via leur flux iCal
--      → cron pull toutes les 30 min, upsert dans availability_blocks
--   2. Exporter ses propres réservations vers Airbnb/VRBO via un
--      flux iCal public exposé sur /api/ical/[slug]
--
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

-- 1. Colonnes URL iCal sur apartments (une par plateforme externe)
ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS airbnb_ical_url TEXT,
  ADD COLUMN IF NOT EXISTS vrbo_ical_url   TEXT,
  ADD COLUMN IF NOT EXISTS ical_last_sync_at TIMESTAMPTZ;

-- 2. Source + UID externe sur availability_blocks
--    - source : 'manual' (par défaut, créé depuis admin) ou nom de la plateforme
--    - external_uid : VEVENT UID Airbnb/VRBO, sert à upsert/détecter suppression
ALTER TABLE availability_blocks
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_uid TEXT;

-- Étendre la contrainte CHECK pour autoriser 'external' (réservation
-- importée depuis une plateforme tierce, traitée comme un bloc).
ALTER TABLE availability_blocks
  DROP CONSTRAINT IF EXISTS availability_blocks_block_type_check;
ALTER TABLE availability_blocks
  ADD CONSTRAINT availability_blocks_block_type_check
  CHECK (block_type IN ('booking','maintenance','owner','external'));

-- Contrainte CHECK sur source
ALTER TABLE availability_blocks
  DROP CONSTRAINT IF EXISTS availability_blocks_source_check;
ALTER TABLE availability_blocks
  ADD CONSTRAINT availability_blocks_source_check
  CHECK (source IN ('manual','airbnb','vrbo','booking_com'));

-- Index unique (apartment_id, source, external_uid) pour permettre l'upsert
-- propre lors du sync iCal (évite les doublons à chaque pull).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_availability_blocks_external
  ON availability_blocks (apartment_id, source, external_uid)
  WHERE external_uid IS NOT NULL;

-- Index pour requêtes par source
CREATE INDEX IF NOT EXISTS idx_availability_blocks_source
  ON availability_blocks (source);

-- Vérification
SELECT
  column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'apartments' AND column_name LIKE '%ical%'
ORDER BY column_name;

SELECT
  column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'availability_blocks' AND column_name IN ('source','external_uid')
ORDER BY column_name;
