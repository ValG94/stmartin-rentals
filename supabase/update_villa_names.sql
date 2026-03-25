-- ============================================================
-- Mise à jour des noms et slugs des villas dans Supabase
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

-- 1. Mettre à jour Villa Azur → La Villa Vanille
UPDATE apartments
SET
  slug = 'villa-vanille',
  title_fr = 'La Villa Vanille',
  title_en = 'La Villa Vanille',
  short_description_fr = 'Villa de prestige avec piscine à débordement et vue mer panoramique',
  short_description_en = 'Prestige villa with infinity pool and panoramic sea view',
  description_fr = 'Nichée sur les hauteurs de Saint-Martin, La Villa Vanille est une propriété d''exception offrant une vue imprenable sur la mer des Caraïbes. Avec sa piscine à débordement, ses grandes terrasses en bois et ses chambres lumineuses décorées avec soin, elle incarne le luxe tropical dans toute sa splendeur. La villa dispose de 4 chambres spacieuses, chacune dotée d''une salle de bain privative. Les espaces de vie ouverts sur l''extérieur créent une connexion permanente avec la nature et la mer.',
  description_en = 'Nestled in the heights of Saint-Martin, La Villa Vanille is an exceptional property offering breathtaking views of the Caribbean Sea. With its infinity pool, large wooden terraces and carefully decorated bright rooms, it embodies tropical luxury in all its splendor. The villa has 4 spacious bedrooms, each with a private bathroom.'
WHERE slug = 'villa-azur';

-- 2. Mettre à jour Villa Lagon → La Villa Blanche
UPDATE apartments
SET
  slug = 'villa-blanche',
  title_fr = 'La Villa Blanche',
  title_en = 'La Villa Blanche',
  short_description_fr = 'Villa intimiste avec piscine privée et vue sur le lagon turquoise',
  short_description_en = 'Intimate villa with private pool and turquoise lagoon view',
  description_fr = 'La Villa Blanche est un havre de paix idéal pour les couples et petites familles. Avec sa piscine privée et sa vue imprenable sur le lagon, elle offre une intimité totale dans un cadre naturel exceptionnel. Ses 2 chambres lumineuses, sa terrasse ombragée et son accès facile aux plages en font la retraite parfaite pour un séjour ressourçant à Saint-Martin.',
  description_en = 'La Villa Blanche is an ideal haven for couples and small families. With its private pool and breathtaking view of the lagoon, it offers complete privacy in an exceptional natural setting. Its 2 bright bedrooms, shaded terrace and easy access to the beaches make it the perfect retreat for a rejuvenating stay in Saint-Martin.'
WHERE slug = 'villa-lagon';

-- 3. Mettre à jour les images associées
UPDATE apartment_images
SET url = REPLACE(url, '/images/villa-azur/', '/images/villa-vanille/')
WHERE url LIKE '%/images/villa-azur/%';

UPDATE apartment_images
SET url = REPLACE(url, '/images/villa-lagon/', '/images/villa-blanche/')
WHERE url LIKE '%/images/villa-lagon/%';

-- 4. Mettre à jour les sections du guide
UPDATE apartment_sections
SET
  title_fr = REPLACE(title_fr, 'Villa Azur', 'La Villa Vanille'),
  title_en = REPLACE(title_en, 'Villa Azur', 'La Villa Vanille'),
  content_fr = REPLACE(content_fr, 'Villa Azur', 'La Villa Vanille'),
  content_en = REPLACE(content_en, 'Villa Azur', 'La Villa Vanille')
WHERE apartment_id = (SELECT id FROM apartments WHERE slug = 'villa-vanille');

UPDATE apartment_sections
SET
  title_fr = REPLACE(title_fr, 'Villa Lagon', 'La Villa Blanche'),
  title_en = REPLACE(title_en, 'Villa Lagon', 'La Villa Blanche'),
  content_fr = REPLACE(content_fr, 'Villa Lagon', 'La Villa Blanche'),
  content_en = REPLACE(content_en, 'Villa Lagon', 'La Villa Blanche')
WHERE apartment_id = (SELECT id FROM apartments WHERE slug = 'villa-blanche');

-- 5. Vérification finale
SELECT slug, title_fr, title_en FROM apartments ORDER BY created_at;
