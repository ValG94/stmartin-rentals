-- ============================================================
-- Island Living SXM — Mise à jour du schéma bookings
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Ajouter les colonnes manquantes à la table bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS accommodation_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS booking_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_option TEXT CHECK (payment_option IN ('full', 'deposit_40')) DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS security_deposit_due_on_arrival BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS security_deposit_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('paypal', 'bank_transfer', 'stripe_disabled')),
  ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'failed', 'cancelled', 'pending_bank_transfer')) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS external_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS guest_email TEXT,
  ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- 2. Mettre à jour booking_status pour inclure les nouveaux statuts
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_booking_status_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_booking_status_check
  CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed', 'pending_bank_transfer'));

-- 3. Créer la table bank_transfer_config pour les coordonnées bancaires (sécurisé côté serveur)
CREATE TABLE IF NOT EXISTS bank_transfer_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  correspondent_bank TEXT,
  swift_code TEXT NOT NULL,
  routing_number TEXT,
  beneficiary_name TEXT NOT NULL,
  beneficiary_account TEXT NOT NULL,
  beneficiary_address TEXT,
  bank_charges_notice TEXT DEFAULT 'All bank charges are the responsibility of the sender.',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS : lecture uniquement côté serveur (service_role)
ALTER TABLE bank_transfer_config ENABLE ROW LEVEL SECURITY;

-- Aucune politique publique : accès uniquement via service_role (côté serveur)
-- Le front ne lit jamais directement cette table

-- 4. Insérer une configuration bancaire par défaut (à modifier dans l'admin)
INSERT INTO bank_transfer_config (
  bank_name,
  correspondent_bank,
  swift_code,
  routing_number,
  beneficiary_name,
  beneficiary_account,
  beneficiary_address,
  bank_charges_notice
) VALUES (
  'TD Canada Trust',
  'JPMorgan Chase Bank, New York',
  'TDOMCATTTOR',
  '021000021',
  'Island Living SXM Inc.',
  'XXXX-XXXX-XXXX',
  '123 Main Street, Montreal, QC, Canada',
  'All bank transfer fees are the responsibility of the sender. Please ensure the full amount is received net of charges.'
)
ON CONFLICT DO NOTHING;

-- 5. Politique RLS pour bookings (lecture publique pour les confirmations, écriture publique pour créer)
DROP POLICY IF EXISTS "Allow public insert bookings" ON bookings;
CREATE POLICY "Allow public insert bookings" ON bookings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read own booking" ON bookings;
CREATE POLICY "Allow public read own booking" ON bookings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin update bookings" ON bookings;
CREATE POLICY "Allow admin update bookings" ON bookings
  FOR UPDATE USING (true);

SELECT 'Schéma bookings mis à jour avec succès ✅' AS result;
