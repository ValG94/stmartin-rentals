-- ============================================================
-- Ajoute le suivi de l'empreinte CB (caution) via Fygaro Manual Capture
-- ============================================================
--
-- Le paiement de séjour est déjà tracké dans :
--   - payment_status ('pending'|'paid'|'partially_paid'|...)
--   - external_payment_id (transaction Fygaro / PayPal)
--   - paid_at
--
-- La caution est une transaction SÉPARÉE (Manual Capture activé côté
-- Fygaro Payment Button). On la track à part pour :
--   1. Savoir si l'empreinte a été posée (deposit_authorized_at IS NOT NULL)
--   2. Retrouver le transactionId Fygaro pour faire capture/void depuis
--      le dashboard côté propriétaire (ou notre back-office plus tard)
--   3. Suivre le statut évolutif (authorized → captured/voided/expired)
--
-- Rappel : sur MCC "Hotels and Lodging" chez Fygaro, le hold est valide
-- jusqu'à 30 jours (vs 7 par défaut). Au-delà, statut = 'expired'.
--
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS deposit_authorization_id     TEXT,
  ADD COLUMN IF NOT EXISTS deposit_authorized_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deposit_authorization_status TEXT;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_deposit_authorization_status_check;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_deposit_authorization_status_check
  CHECK (deposit_authorization_status IS NULL
      OR deposit_authorization_status IN ('authorized','captured','voided','expired'));

-- Index pour retrouver rapidement les cautions actives (à surveiller pour
-- capture/void avant expiration du hold)
CREATE INDEX IF NOT EXISTS idx_bookings_deposit_active
  ON bookings (deposit_authorization_status)
  WHERE deposit_authorization_status = 'authorized';

-- Vérification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name LIKE 'deposit_%'
ORDER BY column_name;
