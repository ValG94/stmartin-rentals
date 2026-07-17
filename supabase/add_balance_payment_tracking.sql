-- ============================================================
-- Ajoute le suivi du paiement du solde (bookings 40% acompte)
-- ============================================================
--
-- Quand une booking est payée en 2 fois (40% à la réservation + 60% du
-- solde avant l'arrivée), on stocke :
--   - balance_transaction_id : ID de la transaction Fygaro du solde
--   - balance_paid_at        : date de règlement du solde
--   - balance_reminded_at    : dernière date d'envoi du rappel manuel
--                              par Sonia depuis le back-office (évite les
--                              double-envois accidentels).
--
-- À exécuter dans Supabase SQL Editor. Non destructif — 3 colonnes
-- nullable ajoutées, aucune donnée existante n'est modifiée.
-- ============================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS balance_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS balance_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS balance_reminded_at TIMESTAMPTZ;

-- Vérification : liste les bookings avec un solde et leur statut de suivi.
SELECT id, guest_name, check_in, remaining_balance, payment_status,
       balance_paid_at, balance_reminded_at
FROM bookings
WHERE remaining_balance > 0
ORDER BY check_in ASC;
