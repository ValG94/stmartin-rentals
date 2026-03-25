-- ============================================================
-- MISE À JOUR : Devise USD + Prix corrects + Nouvelles commodités
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Mettre à jour la devise des appartements en USD
UPDATE apartments SET currency = 'USD' WHERE currency = 'EUR';

-- 2. Corriger les prix de base (en USD)
UPDATE apartments SET price_per_night = 1500 WHERE slug = 'villa-vanille';
UPDATE apartments SET price_per_night = 480 WHERE slug = 'villa-blanche';

-- 3. Mettre à jour les commodités de la Villa Vanille
UPDATE apartments SET amenities = ARRAY[
  'pool', 'wifi', 'ac', 'parking', 'sea_view', 'terrace', 'bbq', 'kitchen',
  'tv', 'jacuzzi', 'washing_machine', 'hair_dryer', 'bed_linen', 'beach_towels', 'massage_room'
]
WHERE slug = 'villa-vanille';

-- 4. Mettre à jour les commodités de la Villa Blanche
UPDATE apartments SET amenities = ARRAY[
  'pool', 'wifi', 'ac', 'parking', 'lagoon_view', 'terrace', 'bbq', 'kitchen',
  'tv', 'hair_dryer', 'bed_linen', 'beach_towels'
]
WHERE slug = 'villa-blanche';

-- 5. Mettre à jour les prix saisonniers en USD pour la Villa Vanille
UPDATE seasonal_prices sp
SET price_per_night = 
  CASE
    WHEN sp.name_fr ILIKE '%basse%' THEN 1500
    WHEN sp.name_fr ILIKE '%estiv%' OR sp.name_fr ILIKE '%été%' THEN 1800
    WHEN sp.name_fr ILIKE '%haute%' OR sp.name_fr ILIKE '%noël%' OR sp.name_fr ILIKE '%noel%' THEN 2500
    ELSE 1500
  END
FROM apartments a
WHERE sp.apartment_id = a.id AND a.slug = 'villa-vanille';

-- 6. Mettre à jour les prix saisonniers en USD pour la Villa Blanche
UPDATE seasonal_prices sp
SET price_per_night = 
  CASE
    WHEN sp.name_fr ILIKE '%basse%' THEN 480
    WHEN sp.name_fr ILIKE '%estiv%' OR sp.name_fr ILIKE '%été%' THEN 580
    WHEN sp.name_fr ILIKE '%haute%' OR sp.name_fr ILIKE '%noël%' OR sp.name_fr ILIKE '%noel%' THEN 750
    ELSE 480
  END
FROM apartments a
WHERE sp.apartment_id = a.id AND a.slug = 'villa-blanche';

SELECT 'Mise à jour USD et commodités effectuée avec succès ✅' AS result;
