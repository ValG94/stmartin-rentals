-- ============================================================
-- Table seasonal_prices — Tarifs saisonniers par villa
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS seasonal_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  name_fr VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_seasonal_prices_apartment_id ON seasonal_prices(apartment_id);

-- RLS
ALTER TABLE seasonal_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read seasonal_prices" ON seasonal_prices;
DROP POLICY IF EXISTS "Service role all seasonal_prices" ON seasonal_prices;

CREATE POLICY "Public read seasonal_prices" ON seasonal_prices FOR SELECT USING (true);
CREATE POLICY "Service role all seasonal_prices" ON seasonal_prices USING (true) WITH CHECK (true);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_seasonal_prices_updated_at ON seasonal_prices;
CREATE TRIGGER update_seasonal_prices_updated_at
  BEFORE UPDATE ON seasonal_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Données initiales Villa Vanille ──
INSERT INTO seasonal_prices (apartment_id, name_fr, name_en, price_per_night, date_from, date_to)
SELECT id, 'Haute saison (Noël/Nouvel An)', 'High season (Christmas/New Year)', 950, '2026-12-20', '2027-01-05'
FROM apartments WHERE slug = 'villa-vanille';

INSERT INTO seasonal_prices (apartment_id, name_fr, name_en, price_per_night, date_from, date_to)
SELECT id, 'Saison estivale', 'Summer season', 750, '2026-07-01', '2026-08-31'
FROM apartments WHERE slug = 'villa-vanille';

-- ── Données initiales Villa Blanche ──
INSERT INTO seasonal_prices (apartment_id, name_fr, name_en, price_per_night, date_from, date_to)
SELECT id, 'Haute saison (Noël/Nouvel An)', 'High season (Christmas/New Year)', 550, '2026-12-20', '2027-01-05'
FROM apartments WHERE slug = 'villa-blanche';

INSERT INTO seasonal_prices (apartment_id, name_fr, name_en, price_per_night, date_from, date_to)
SELECT id, 'Saison estivale', 'Summer season', 450, '2026-07-01', '2026-08-31'
FROM apartments WHERE slug = 'villa-blanche';

SELECT 'Table seasonal_prices créée avec succès ✅' AS status;
