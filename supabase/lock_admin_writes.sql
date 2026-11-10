-- ============================================================
-- Ferme l'écriture avec la clé publique (anon) sur les tables admin
-- ============================================================
--
-- Constat du 10/11/2026 (pg_policies) : des policies FOR ALL USING (true)
-- WITH CHECK (true), sans clause TO, ouvraient l'écriture à tout le monde :
--   guide_sections, guide_items, optional_partner_contacts, seasonal_prices.
-- bookings avait aussi un UPDATE et deux INSERT ouverts au public.
--
-- Toutes ces écritures passent désormais par les routes /api/admin/* et
-- /api/booking/*, avec le service role (qui contourne la RLS) :
--   - guide : /api/admin/guide/[table] et /api/admin/guide/key-info
--   - tarifs saisonniers : /api/admin/apartments/[id]/seasonal-prices
--   - réservations : créées et modifiées uniquement côté serveur
-- Les lectures publiques (contenus publiés, tarifs, villas) ne changent pas.
--
-- PRÉREQUIS : le code correspondant est déployé.
-- À exécuter dans Supabase SQL Editor. Idempotent.
-- ============================================================

DROP POLICY IF EXISTS "guide_sections_service_write" ON guide_sections;
DROP POLICY IF EXISTS "guide_items_service_write" ON guide_items;
DROP POLICY IF EXISTS "partners_service_write" ON optional_partner_contacts;
DROP POLICY IF EXISTS "Service role all seasonal_prices" ON seasonal_prices;

DROP POLICY IF EXISTS "Allow admin update bookings" ON bookings;
DROP POLICY IF EXISTS "Allow public insert bookings" ON bookings;
DROP POLICY IF EXISTS "Public insert bookings" ON bookings;

-- Double sécurité : plus aucun droit d'écriture pour anon sur ces tables
REVOKE INSERT, UPDATE, DELETE ON guide_sections, guide_items, optional_partner_contacts, seasonal_prices, bookings FROM anon;

-- Vérification : il ne doit rester aucune policy d'écriture ouverte à {public}
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd <> 'SELECT'
  AND roles @> ARRAY['public']::name[]
ORDER BY tablename;
