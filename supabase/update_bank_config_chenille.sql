-- ============================================================
-- Configuration RIB USD — Chenille Investments Ltd
-- Banque bénéficiaire : RBC Royal Bank NV (anciennement RBTT) — St. Maarten
-- Banque correspondante : Wells Fargo Bank (New York)
-- ============================================================
--
-- À exécuter dans Supabase SQL Editor.
--
-- Supprime l'ancien seed de démo ("TD Canada Trust / Island Living SXM Inc.
-- / XXXX-XXXX-XXXX") qui était un placeholder fake et insère le vrai RIB.
-- ============================================================

-- 1. Supprimer l'ancien seed de démo (coordonnées factices)
DELETE FROM bank_transfer_config
WHERE beneficiary_account LIKE 'XXXX-%'
   OR bank_name = 'TD Canada Trust';

-- 2. Désactiver toute autre ligne active restante (sécurité)
UPDATE bank_transfer_config
SET is_active = FALSE, updated_at = NOW()
WHERE is_active = TRUE;

-- 3. Insérer le RIB USD officiel (Chenille Investments Ltd)
INSERT INTO bank_transfer_config (
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
  'RBC Royal Bank NV (Former RBTT Bank NV) — 24 Cannegieter Street, Philipsburg, St. Maarten',
  'Wells Fargo Bank, New York (SWIFT: PNBPUS3NNYC)',
  'RBTTSXSM',
  '026005092',
  'CHENILLE INVESTMENTS LTD',
  '8300000800445062',
  'Hunkins Waterfront Plaza, Suite 556, Mainstreet, Charlestown, Saint Kitts and Nevis',
  'All bank charges (sender and intermediary) are the responsibility of the sender. The full amount must be received by the beneficiary in USD. Please include the booking reference in the transfer notes.',
  TRUE
);

-- 4. Vérification : doit montrer UNE seule ligne, en USD, avec is_active=true
SELECT
  bank_name,
  beneficiary_name,
  beneficiary_account,
  swift_code,
  routing_number,
  is_active,
  created_at
FROM bank_transfer_config
ORDER BY created_at DESC;
