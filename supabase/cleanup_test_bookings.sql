-- ============================================================
-- CLEANUP : réservations de test avant livraison production
-- ============================================================
--
-- Supprime toutes les bookings créées lors de la phase de dev (à ton nom
-- ou avec ton email), leurs blocs de calendrier associés et leurs
-- transactions de paiement. La cliente Sonia part sur un dashboard clean.
--
-- ORDRE D'EXÉCUTION IMPORTANT :
--   1. availability_blocks (FK booking_id, ON DELETE SET NULL → sinon
--      les blocs orphelins traînent avec booking_id = NULL)
--   2. payment_transactions (FK booking_id, à supprimer avant bookings)
--   3. bookings (dernière étape)
--
-- FILTRE : email exact `valerygarrec@gmail.com` OU nom contenant `garrec`
-- (case-insensitive). Ajuste WHERE ci-dessous si besoin.
--
-- 🛑 REGARDER D'ABORD ce qui sera supprimé avec le SELECT en tête, PUIS
-- décommenter le bloc DELETE, PUIS exécuter dans Supabase SQL Editor.
-- ============================================================

-- ── 1. Pré-visualisation : qu'est-ce qui va sauter ? ────────────────────
SELECT
  id,
  guest_name,
  guest_email,
  check_in,
  check_out,
  booking_status,
  payment_status,
  created_at
FROM bookings
WHERE guest_email ILIKE 'valerygarrec@gmail.com'
   OR guest_name ILIKE '%garrec%'
ORDER BY created_at DESC;

-- ── 2. DELETE cascade (décommenter après vérif ci-dessus) ──────────────
/*
BEGIN;

-- 2a. Libère les blocs de calendrier créés pour ces bookings
DELETE FROM availability_blocks
WHERE booking_id IN (
  SELECT id FROM bookings
  WHERE guest_email ILIKE 'valerygarrec@gmail.com'
     OR guest_name ILIKE '%garrec%'
);

-- 2b. Supprime les transactions PayPal / Fygaro / etc. liées
DELETE FROM payment_transactions
WHERE booking_id IN (
  SELECT id FROM bookings
  WHERE guest_email ILIKE 'valerygarrec@gmail.com'
     OR guest_name ILIKE '%garrec%'
);

-- 2c. Supprime les bookings elles-mêmes
DELETE FROM bookings
WHERE guest_email ILIKE 'valerygarrec@gmail.com'
   OR guest_name ILIKE '%garrec%';

COMMIT;
*/

-- ── 3. Vérif post-cleanup (doit retourner 0 rows) ──────────────────────
SELECT COUNT(*) AS remaining_test_bookings
FROM bookings
WHERE guest_email ILIKE 'valerygarrec@gmail.com'
   OR guest_name ILIKE '%garrec%';

SELECT COUNT(*) AS orphan_test_blocks
FROM availability_blocks ab
WHERE ab.booking_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.id = ab.booking_id);
