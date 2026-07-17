-- ============================================================
-- Ajoute 'fygaro' aux valeurs autorisées de bookings.payment_method
-- ============================================================
--
-- La contrainte CHECK d'origine (voir update_bookings_schema.sql) date
-- d'avant l'intégration Fygaro et n'accepte que 'paypal',
-- 'bank_transfer' et 'stripe_disabled'. Elle bloque donc l'insertion
-- d'une nouvelle booking Fygaro avec l'erreur :
--   "new row for relation "bookings" violates check constraint
--    "bookings_payment_method_check""
--
-- On drop la contrainte existante et on la recrée en ajoutant 'fygaro'
-- (+ garde 'stripe_disabled' pour rétrocompat au cas où d'anciennes
-- rows historiques l'utilisent).
--
-- À exécuter dans Supabase SQL Editor. Non destructif — aucune donnée
-- existante n'est modifiée.
-- ============================================================

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_method_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_payment_method_check
  CHECK (payment_method IN ('paypal', 'bank_transfer', 'fygaro', 'stripe_disabled'));

-- Vérification : liste des payment_method distincts déjà présents en base,
-- utile pour repérer d'éventuelles valeurs non-standard historiques.
SELECT payment_method, COUNT(*) AS n
FROM bookings
GROUP BY payment_method
ORDER BY n DESC;
