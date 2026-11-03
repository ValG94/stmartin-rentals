-- ============================================================
-- Configuration RIB USD — Golden Island Luxury Rentals Inc.
-- Banque bénéficiaire : RBC Caribbean — Philipsburg Branch
-- ============================================================
--
-- Recommandation de la comptable (03/11/2026) : les virements des
-- voyageurs de Villa Vanille vont directement sur le compte de Golden
-- Island. Coordonnées transmises par Sonia le 03/11/2026.
--
-- PRÉREQUIS : add_room_tax_invoices.sql exécuté (colonne company_key) ET
-- branche feat/room-tax-invoices déployée. L'ancienne route de virement
-- lit UNE seule ligne active (.single()) : avec deux lignes actives, les
-- réservations par virement échoueraient.
--
-- Banque correspondante non communiquée (le RIB Chenille passe par
-- Wells Fargo New York) : à compléter après confirmation de RBC.
--
-- À exécuter dans Supabase SQL Editor. Ré-exécutable.
-- ============================================================

-- 1. Remplacer une éventuelle ligne Golden Island existante
DELETE FROM bank_transfer_config
WHERE company_key = 'goldenIsland';

-- 2. Insérer le RIB USD de Golden Island (la ligne Chenille, company_key
--    NULL, reste le compte par défaut pour Maison Blanche)
INSERT INTO bank_transfer_config (
  company_key,
  bank_name,
  correspondent_bank,
  swift_code,
  routing_number,
  beneficiary_name,
  beneficiary_account,
  beneficiary_address,
  bank_charges_notice,
  is_active
) VALUES (
  'goldenIsland',
  'RBC Caribbean, Philipsburg Branch — 24 Cannegieter Street, Philipsburg, St. Maarten',
  NULL,
  'RBTTSXSM',
  NULL,
  'GOLDEN ISLAND LUXURY RENTALS INC.',
  '8200009990207723',
  'Suite 3, Gambles Medical Centre, Friars Hill Road, St. John''s, Antigua and Barbuda',
  'All bank charges (sender and intermediary) are the responsibility of the sender. The full amount must be received by the beneficiary in USD. Please include the booking reference in the transfer notes.',
  TRUE
);

-- 3. Vérification : deux lignes actives, Chenille (company_key NULL) et
--    Golden Island
SELECT
  company_key,
  bank_name,
  beneficiary_name,
  beneficiary_account,
  swift_code,
  is_active
FROM bank_transfer_config
WHERE is_active = TRUE
ORDER BY company_key NULLS FIRST;
