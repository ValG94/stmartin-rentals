-- ============================================================
-- ADD fire_phone TO apartment_key_info
-- À exécuter dans Supabase SQL Editor si la table
-- apartment_key_info a déjà été créée sans cette colonne.
-- ============================================================
ALTER TABLE apartment_key_info
  ADD COLUMN IF NOT EXISTS fire_phone TEXT;
