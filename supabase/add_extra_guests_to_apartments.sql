-- ============================================================
-- Ajoute la prise en charge des voyageurs supplémentaires payants
-- ============================================================
--
-- Permet à chaque villa de définir :
--   - combien de voyageurs supplémentaires sont autorisés au-delà
--     de sa capacité de base (max_guests) ;
--   - le tarif par voyageur supplémentaire par nuit.
--
-- Exemple : Maison Blanche capacité 4 + extra_guests_max 2 +
-- extra_guest_price_per_night 80 → jusqu'à 6 personnes, les 2 en
-- plus à 80 USD/nuit chacune.
--
-- Defaults à 0 / 0 pour ne rien changer aux villas existantes
-- (Villa Vanille n'aura pas cette option par défaut).
--
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

ALTER TABLE apartments
  ADD COLUMN IF NOT EXISTS extra_guests_max INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_guest_price_per_night NUMERIC NOT NULL DEFAULT 0;

-- Configuration initiale : Maison Blanche → +2 voyageurs à 80 USD/nuit
UPDATE apartments
SET
  extra_guests_max = 2,
  extra_guest_price_per_night = 80,
  updated_at = NOW()
WHERE slug = 'maison-blanche';

-- Vérification
SELECT slug, title_en, max_guests, extra_guests_max, extra_guest_price_per_night
FROM apartments
ORDER BY title_en;
