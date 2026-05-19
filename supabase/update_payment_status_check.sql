-- ============================================================
-- Fix : étendre la contrainte CHECK sur bookings.payment_status
-- ============================================================
--
-- Contexte : la migration `update_bookings_schema.sql` a oublié de
-- mettre à jour le CHECK constraint sur payment_status. Le schéma
-- actuel n'accepte que (pending, partial, paid, refunded), or le code
-- utilise aussi pending_bank_transfer, partially_paid, failed,
-- cancelled. Toute insertion ou update avec une de ces valeurs échoue
-- silencieusement (DB error renvoyée à l'API).
--
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

-- 1. Supprimer l'ancienne contrainte trop restrictive
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- 2. Recréer avec la liste complète des valeurs utilisées par le code
ALTER TABLE bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status = ANY (ARRAY[
    'pending'::text,                -- réservation créée, attente paiement
    'pending_bank_transfer'::text,  -- virement bancaire en attente de réception
    'paid'::text,                   -- payée intégralement
    'partially_paid'::text,         -- acompte 40% payé, solde restant
    'partial'::text,                -- conservé pour compat. historique
    'failed'::text,                 -- paiement échoué ou montant incohérent
    'cancelled'::text,              -- annulée
    'refunded'::text                -- remboursée
  ]));

-- 3. Vérification : la contrainte doit lister les 8 valeurs
SELECT
  conname,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'bookings'
  AND conname = 'bookings_payment_status_check';
