-- ============================================================
-- Avoirs (credit notes) liés aux factures
-- ============================================================
--
-- Un avoir par remboursement, émis à la main depuis l'admin (la comptable
-- veut une revue manuelle des remboursements et des acomptes conservés).
-- Numérotation rattachée à la facture, comme les reçus : numéro de
-- facture + -C1, -C2… (proposé à la comptable le 07/11/2026).
--
-- PRÉREQUIS : add_room_tax_invoices.sql exécuté.
-- À exécuter dans Supabase SQL Editor. Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS credit_notes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  booking_id       UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  company_key      TEXT NOT NULL,
  seq              INTEGER NOT NULL,
  number           TEXT NOT NULL UNIQUE,
  issue_date       DATE NOT NULL,
  -- Montant remboursé, taxe de séjour comprise (positif)
  amount           NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  room_tax         NUMERIC(10,2) NOT NULL CHECK (room_tax >= 0),
  reason           TEXT,
  refund_method    TEXT CHECK (refund_method IN ('card','bank_transfer','paypal')),
  refund_reference TEXT,
  -- Société qui rembourse : celle qui a encaissé le dernier paiement
  refunded_by      TEXT NOT NULL,
  data             JSONB,        -- CreditNoteData figée au rendu du PDF
  pdf_path         TEXT,         -- bucket "documents"
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invoice_id, seq),
  CHECK (room_tax <= amount)
);

CREATE INDEX IF NOT EXISTS idx_credit_notes_issue_date ON credit_notes (issue_date);

-- Accès réservé au service role
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;

-- Émission atomique : verrouille la facture, refuse un remboursement
-- supérieur au montant encaissé non encore remboursé.
CREATE OR REPLACE FUNCTION issue_credit_note(
  p_invoice_id       UUID,
  p_issue_date       DATE,
  p_amount           NUMERIC,
  p_room_tax         NUMERIC,
  p_reason           TEXT,
  p_refund_method    TEXT,
  p_refund_reference TEXT
) RETURNS credit_notes
LANGUAGE plpgsql AS $$
DECLARE
  v_invoice  invoices;
  v_note     credit_notes;
  v_paid     NUMERIC;
  v_credited NUMERIC;
  v_tax_paid NUMERIC;
  v_tax_cred NUMERIC;
  v_by       TEXT;
  v_seq      INTEGER;
BEGIN
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice % not found', p_invoice_id;
  END IF;

  SELECT COALESCE(SUM(amount), 0), COALESCE(SUM(room_tax), 0) INTO v_paid, v_tax_paid
  FROM receipts WHERE invoice_id = p_invoice_id;
  SELECT COALESCE(SUM(amount), 0), COALESCE(SUM(room_tax), 0) INTO v_credited, v_tax_cred
  FROM credit_notes WHERE invoice_id = p_invoice_id;
  IF p_amount > v_paid - v_credited THEN
    RAISE EXCEPTION 'Credit note % exceeds the refundable amount % (paid %, already credited %)',
      p_amount, v_paid - v_credited, v_paid, v_credited;
  END IF;
  IF p_room_tax > v_tax_paid - v_tax_cred THEN
    RAISE EXCEPTION 'Room tax % exceeds the room tax collected and not yet credited %',
      p_room_tax, v_tax_paid - v_tax_cred;
  END IF;

  SELECT collected_by INTO v_by FROM receipts
  WHERE invoice_id = p_invoice_id ORDER BY seq DESC LIMIT 1;

  SELECT COALESCE(MAX(seq), 0) + 1 INTO v_seq FROM credit_notes WHERE invoice_id = p_invoice_id;

  INSERT INTO credit_notes (
    invoice_id, booking_id, company_key, seq, number, issue_date,
    amount, room_tax, reason, refund_method, refund_reference, refunded_by
  ) VALUES (
    p_invoice_id, v_invoice.booking_id, v_invoice.company_key, v_seq,
    v_invoice.number || '-C' || v_seq, p_issue_date,
    p_amount, p_room_tax, p_reason, p_refund_method, p_refund_reference,
    COALESCE(v_by, v_invoice.company_key)
  )
  RETURNING * INTO v_note;

  RETURN v_note;
END;
$$;

REVOKE ALL ON FUNCTION issue_credit_note(UUID, DATE, NUMERIC, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- Vérification
SELECT table_name FROM information_schema.tables WHERE table_name = 'credit_notes';
