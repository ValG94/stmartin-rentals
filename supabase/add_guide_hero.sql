-- Migration : ajout des colonnes hero du guide dans apartment_key_info
-- À exécuter dans le SQL Editor de Supabase

ALTER TABLE apartment_key_info
  ADD COLUMN IF NOT EXISTS hero_image_url    TEXT,
  ADD COLUMN IF NOT EXISTS hero_tagline_fr   TEXT,
  ADD COLUMN IF NOT EXISTS hero_tagline_en   TEXT,
  ADD COLUMN IF NOT EXISTS hero_tagline_color TEXT DEFAULT '#B08B52',
  ADD COLUMN IF NOT EXISTS hero_tagline_italic BOOLEAN DEFAULT false;
