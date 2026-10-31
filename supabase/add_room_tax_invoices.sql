-- ============================================================
-- Taxe de séjour 5 % + factures / reçus PDF (réservations directes)
-- ============================================================
--
-- Recommandations de la comptable (27 et 30/10/2026) :
--   - taxe de séjour 5 % sur hébergement + ménage + voyageurs sup. ;
--   - acompte 40 % calculé sur le total TTC, la taxe suit 40/60 ;
--   - une facture par réservation, numérotée sans trou, UNE SÉRIE PAR
--     SOCIÉTÉ ÉMETTRICE (CI = Chenille Investments, GI = Golden Island) ;
--   - un reçu daté par paiement (numéro de facture + -R1, -R2…).
--
-- À exécuter dans Supabase SQL Editor. Idempotent (IF NOT EXISTS).
-- ============================================================

-- 1. Montants figés sur la booking à sa création ─────────────────────────
--    total_amount reste "montant dû au checkout" (acompte ou intégral, TTC).
--    booking_total reste hors taxe de séjour.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS extra_guests_count          INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_guest_price_per_night NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_guests_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS room_tax_rate               NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS room_tax_base               NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS room_tax_amount             NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS total_payable               NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS deposit_room_tax            NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS balance_room_tax            NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS room_tax_exempt             BOOLEAN       NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS billing_address             TEXT;

-- Les bookings antérieures gardent room_tax_* = NULL : pas de facture
-- automatique pour elles (créées avant la taxe de séjour).

-- 2. Compteurs de numérotation (une ligne par société et par année) ──────
CREATE TABLE IF NOT EXISTS invoice_sequences (
  company_key TEXT    NOT NULL,
  year        INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (company_key, year)
);

-- 3. Factures ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  company_key     TEXT NOT NULL,
  number          TEXT NOT NULL UNIQUE,
  issue_date      DATE NOT NULL,
  locale          TEXT NOT NULL DEFAULT 'en',
  subtotal        NUMERIC(10,2) NOT NULL,
  room_tax_rate   NUMERIC(5,4)  NOT NULL,
  room_tax_base   NUMERIC(10,2) NOT NULL,
  room_tax_amount NUMERIC(10,2) NOT NULL,
  total_payable   NUMERIC(10,2) NOT NULL,
  data            JSONB,        -- InvoiceData figée au rendu du PDF
  pdf_path        TEXT,         -- bucket "documents"
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Reçus (un par paiement) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  booking_id          UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  seq                 INTEGER NOT NULL,
  number              TEXT NOT NULL UNIQUE,
  payment_date        DATE NOT NULL,
  kind                TEXT NOT NULL CHECK (kind IN ('deposit','balance','full')),
  method              TEXT NOT NULL CHECK (method IN ('card','bank_transfer','paypal')),
  amount              NUMERIC(10,2) NOT NULL,
  room_tax            NUMERIC(10,2) NOT NULL,
  processor_reference TEXT,
  pdf_path            TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invoice_id, seq),
  -- Idempotence des webhooks : un seul reçu d'acompte / de solde / intégral
  UNIQUE (booking_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_receipts_payment_date ON receipts (payment_date);

-- Accès réservé au service role (aucune policy = tout refusé pour anon)
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts          ENABLE ROW LEVEL SECURITY;

-- 5. Émission atomique d'une facture ─────────────────────────────────────
--    Renvoie la facture existante si la booking en a déjà une. Sinon,
--    incrémente le compteur et insère dans LA MÊME transaction : si
--    l'insert échoue, l'incrément est annulé → pas de trou de numérotation.
CREATE OR REPLACE FUNCTION issue_invoice(
  p_booking_id      UUID,
  p_company_key     TEXT,
  p_prefix          TEXT,
  p_issue_date      DATE,
  p_locale          TEXT,
  p_subtotal        NUMERIC,
  p_room_tax_rate   NUMERIC,
  p_room_tax_base   NUMERIC,
  p_room_tax_amount NUMERIC,
  p_total_payable   NUMERIC
) RETURNS invoices
LANGUAGE plpgsql AS $$
DECLARE
  v_invoice invoices;
  v_year    INTEGER := EXTRACT(YEAR FROM p_issue_date)::INTEGER;
  v_n       INTEGER;
BEGIN
  -- Sérialise les émissions concurrentes pour une même booking
  PERFORM 1 FROM bookings WHERE id = p_booking_id FOR UPDATE;

  SELECT * INTO v_invoice FROM invoices WHERE booking_id = p_booking_id;
  IF FOUND THEN
    RETURN v_invoice;
  END IF;

  INSERT INTO invoice_sequences (company_key, year, last_number)
  VALUES (p_company_key, v_year, 1)
  ON CONFLICT (company_key, year)
  DO UPDATE SET last_number = invoice_sequences.last_number + 1
  RETURNING last_number INTO v_n;

  INSERT INTO invoices (
    booking_id, company_key, number, issue_date, locale,
    subtotal, room_tax_rate, room_tax_base, room_tax_amount, total_payable
  ) VALUES (
    p_booking_id, p_company_key,
    p_prefix || '-' || v_year || '-' || LPAD(v_n::TEXT, 4, '0'),
    p_issue_date, p_locale,
    p_subtotal, p_room_tax_rate, p_room_tax_base, p_room_tax_amount, p_total_payable
  )
  RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$$;

-- 6. Émission atomique d'un reçu ─────────────────────────────────────────
--    Idempotent par (booking, kind) : un retry de webhook renvoie le reçu
--    déjà émis.
CREATE OR REPLACE FUNCTION issue_receipt(
  p_invoice_id          UUID,
  p_kind                TEXT,
  p_method              TEXT,
  p_payment_date        DATE,
  p_amount              NUMERIC,
  p_room_tax            NUMERIC,
  p_processor_reference TEXT
) RETURNS receipts
LANGUAGE plpgsql AS $$
DECLARE
  v_invoice invoices;
  v_receipt receipts;
  v_seq     INTEGER;
BEGIN
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice % not found', p_invoice_id;
  END IF;

  SELECT * INTO v_receipt FROM receipts
  WHERE booking_id = v_invoice.booking_id AND kind = p_kind;
  IF FOUND THEN
    RETURN v_receipt;
  END IF;

  SELECT COALESCE(MAX(seq), 0) + 1 INTO v_seq FROM receipts WHERE invoice_id = p_invoice_id;

  INSERT INTO receipts (
    invoice_id, booking_id, seq, number, payment_date, kind, method,
    amount, room_tax, processor_reference
  ) VALUES (
    p_invoice_id, v_invoice.booking_id, v_seq,
    v_invoice.number || '-R' || v_seq,
    p_payment_date, p_kind, p_method, p_amount, p_room_tax, p_processor_reference
  )
  RETURNING * INTO v_receipt;

  RETURN v_receipt;
END;
$$;

-- Fonctions appelables uniquement par le service role (routes serveur)
REVOKE ALL ON FUNCTION issue_invoice(UUID, TEXT, TEXT, DATE, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION issue_receipt(UUID, TEXT, TEXT, DATE, NUMERIC, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;

-- 7. Coordonnées bancaires par société ───────────────────────────────────
--    company_key NULL = compte par défaut (Chenille). Ajouter une ligne
--    active avec company_key = 'goldenIsland' quand Golden Island encaisse
--    les virements de Villa Vanille sur son propre compte.
ALTER TABLE bank_transfer_config
  ADD COLUMN IF NOT EXISTS company_key TEXT;

-- 8. Bucket privé pour les PDF ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Vérification
SELECT column_name FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name IN ('room_tax_amount','total_payable','billing_address');
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('invoices','receipts','invoice_sequences');
