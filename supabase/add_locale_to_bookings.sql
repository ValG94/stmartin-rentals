-- ============================================================
-- Ajoute la langue (FR/EN) du voyageur à la table bookings
-- ============================================================
--
-- Permet de générer les emails (confirmation, instructions virement,
-- confirmation virement reçu, etc.) dans la langue choisie par le
-- voyageur au moment de la réservation — y compris bien plus tard
-- (mark-transfer-received n'a pas accès à la session HTTP du voyageur).
--
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en'
  CHECK (locale IN ('fr', 'en'));

-- Vérification
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'locale';
