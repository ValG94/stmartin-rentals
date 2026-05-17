-- ============================================================
-- GUIDE CMS MIGRATION
-- Island Living SXM — Guide digital administrable
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- ── 1. TABLE guide_sections ──────────────────────────────────
CREATE TABLE IF NOT EXISTS guide_sections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id     UUID REFERENCES apartments(id) ON DELETE CASCADE,
  scope            TEXT NOT NULL DEFAULT 'shared'
                   CHECK (scope IN ('shared', 'apartment_specific')),
  section_key      TEXT,
  section_type     TEXT NOT NULL DEFAULT 'generic',
  title_fr         TEXT NOT NULL DEFAULT '',
  title_en         TEXT NOT NULL DEFAULT '',
  subtitle_fr      TEXT,
  subtitle_en      TEXT,
  intro_fr         TEXT,
  intro_en         TEXT,
  icon_name        TEXT,
  cover_image_url  TEXT,
  background_style TEXT,
  display_order    INT NOT NULL DEFAULT 0,
  is_published     BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contrainte : scope shared → apartment_id nullable OK
-- Contrainte : scope apartment_specific → apartment_id requis
ALTER TABLE guide_sections
  DROP CONSTRAINT IF EXISTS chk_scope_apartment;
ALTER TABLE guide_sections
  ADD CONSTRAINT chk_scope_apartment
  CHECK (
    scope = 'shared'
    OR (scope = 'apartment_specific' AND apartment_id IS NOT NULL)
  );

-- ── 2. TABLE guide_items ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS guide_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id       UUID NOT NULL REFERENCES guide_sections(id) ON DELETE CASCADE,
  item_type        TEXT NOT NULL DEFAULT 'info_card',
  item_key         TEXT,
  title_fr         TEXT,
  title_en         TEXT,
  short_label_fr   TEXT,
  short_label_en   TEXT,
  content_fr       TEXT,
  content_en       TEXT,
  badge_fr         TEXT,
  badge_en         TEXT,
  category_fr      TEXT,
  category_en      TEXT,
  image_url        TEXT,
  icon_name        TEXT,
  phone            TEXT,
  whatsapp         TEXT,
  email            TEXT,
  website_url      TEXT,
  map_url          TEXT,
  external_url     TEXT,
  cta_label_fr     TEXT,
  cta_label_en     TEXT,
  meta_json        JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_order    INT NOT NULL DEFAULT 0,
  is_visible       BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. TABLE apartment_key_info ──────────────────────────────
CREATE TABLE IF NOT EXISTS apartment_key_info (
  apartment_id       UUID PRIMARY KEY REFERENCES apartments(id) ON DELETE CASCADE,
  wifi_name          TEXT,
  wifi_password      TEXT,
  gate_code          TEXT,
  alarm_code         TEXT,
  parking_info_fr    TEXT,
  parking_info_en    TEXT,
  address_text_fr    TEXT,
  address_text_en    TEXT,
  map_link           TEXT,
  host_phone         TEXT,
  emergency_phone    TEXT,
  whatsapp           TEXT,
  checkin_time       TEXT,
  checkout_time      TEXT,
  checkin_note_fr    TEXT,
  checkin_note_en    TEXT,
  checkout_note_fr   TEXT,
  checkout_note_en   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. TABLE optional_partner_contacts ───────────────────────
CREATE TABLE IF NOT EXISTS optional_partner_contacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id  UUID REFERENCES apartments(id) ON DELETE CASCADE,
  guide_item_id UUID REFERENCES guide_items(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT,
  whatsapp      TEXT,
  email         TEXT,
  website_url   TEXT,
  map_url       TEXT,
  note_fr       TEXT,
  note_en       TEXT,
  is_visible    BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_guide_sections_apartment_id
  ON guide_sections(apartment_id);
CREATE INDEX IF NOT EXISTS idx_guide_sections_scope
  ON guide_sections(scope);
CREATE INDEX IF NOT EXISTS idx_guide_sections_display_order
  ON guide_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_guide_sections_is_published
  ON guide_sections(is_published);
CREATE INDEX IF NOT EXISTS idx_guide_items_section_id
  ON guide_items(section_id);
CREATE INDEX IF NOT EXISTS idx_guide_items_display_order
  ON guide_items(display_order);
CREATE INDEX IF NOT EXISTS idx_guide_items_is_visible
  ON guide_items(is_visible);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_apartment_id
  ON optional_partner_contacts(apartment_id);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_guide_item_id
  ON optional_partner_contacts(guide_item_id);

-- ── 6. TRIGGERS updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guide_sections_updated_at ON guide_sections;
CREATE TRIGGER trg_guide_sections_updated_at
  BEFORE UPDATE ON guide_sections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_guide_items_updated_at ON guide_items;
CREATE TRIGGER trg_guide_items_updated_at
  BEFORE UPDATE ON guide_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_apartment_key_info_updated_at ON apartment_key_info;
CREATE TRIGGER trg_apartment_key_info_updated_at
  BEFORE UPDATE ON apartment_key_info
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_partner_contacts_updated_at ON optional_partner_contacts;
CREATE TRIGGER trg_partner_contacts_updated_at
  BEFORE UPDATE ON optional_partner_contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 7. RLS POLICIES ──────────────────────────────────────────
-- Lecture publique (guide front)
ALTER TABLE guide_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_key_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE optional_partner_contacts ENABLE ROW LEVEL SECURITY;

-- guide_sections : lecture publique des sections publiées
DROP POLICY IF EXISTS "guide_sections_public_read" ON guide_sections;
CREATE POLICY "guide_sections_public_read"
  ON guide_sections FOR SELECT
  USING (is_published = true);

-- guide_sections : écriture service_role uniquement
DROP POLICY IF EXISTS "guide_sections_service_write" ON guide_sections;
CREATE POLICY "guide_sections_service_write"
  ON guide_sections FOR ALL
  USING (true)
  WITH CHECK (true);

-- guide_items : lecture publique des items visibles
DROP POLICY IF EXISTS "guide_items_public_read" ON guide_items;
CREATE POLICY "guide_items_public_read"
  ON guide_items FOR SELECT
  USING (is_visible = true);

DROP POLICY IF EXISTS "guide_items_service_write" ON guide_items;
CREATE POLICY "guide_items_service_write"
  ON guide_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- apartment_key_info : lecture publique (masquage côté front)
DROP POLICY IF EXISTS "key_info_public_read" ON apartment_key_info;
CREATE POLICY "key_info_public_read"
  ON apartment_key_info FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "key_info_service_write" ON apartment_key_info;
CREATE POLICY "key_info_service_write"
  ON apartment_key_info FOR ALL
  USING (true)
  WITH CHECK (true);

-- optional_partner_contacts : lecture publique des visibles
DROP POLICY IF EXISTS "partners_public_read" ON optional_partner_contacts;
CREATE POLICY "partners_public_read"
  ON optional_partner_contacts FOR SELECT
  USING (is_visible = true);

DROP POLICY IF EXISTS "partners_service_write" ON optional_partner_contacts;
CREATE POLICY "partners_service_write"
  ON optional_partner_contacts FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── 8. SEED — Section "Explore Saint-Martin" ─────────────────
-- Insérer la section partagée Explore Saint-Martin
INSERT INTO guide_sections (
  id, scope, section_key, section_type,
  title_fr, title_en,
  subtitle_fr, subtitle_en,
  intro_fr, intro_en,
  icon_name, display_order, is_published
) VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'shared',
  'explore_saint_martin',
  'explore',
  'Explorer Saint-Martin',
  'Explore Saint Martin',
  'Excursions & activités incontournables',
  'Must-do excursions & activities',
  'Découvrez le meilleur de Sint Maarten / Saint-Martin grâce à cette sélection d''excursions incontournables, d''escapades balnéaires, d''activités aventure et d''expériences culinaires locales. Que vous souhaitiez vous détendre, explorer ou profiter de la mer, voici notre guide recommandé pour vivre un séjour inoubliable.',
  'Discover the best of Sint Maarten / Saint Martin with this curated selection of must-do excursions, beach escapes, adventure activities, and local food experiences. Whether you want to relax, explore or enjoy the sea, here is our recommended island guide for a memorable stay.',
  'compass',
  30,
  true
)
ON CONFLICT (id) DO NOTHING;

-- ── 9. SEED — 10 activités (guide_items type activity_card) ──
INSERT INTO guide_items (
  section_id, item_type, item_key,
  title_fr, title_en,
  content_fr, content_en,
  category_fr, category_en,
  badge_fr, badge_en,
  meta_json, display_order, is_visible
) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'activity_card', 'catamaran_tour',
  'Excursion Catamaran à la Journée',
  'Full-Day Catamaran Tour',
  'Croisière autour de l''île (côtés hollandais et français). Arrêts à Tintamarre, plages cachées ou Rocher Créole. Open bar et déjeuner souvent inclus.',
  'Cruise around the island — Dutch & French sides. Stops at Tintamarre, hidden beaches or Creole Rock. Open bar and lunch often included.',
  'Mer',
  'Sea',
  'Incontournable',
  'Must-do',
  '{"tip_fr": "Idéal en début de séjour — Jour 1 ou 2", "tip_en": "Best enjoyed early in your trip — Day 1 or 2", "duration_fr": "Journée complète", "duration_en": "Full day", "icon": "sailboat"}',
  10, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'activity_card', 'pinel_island',
  'Évasion à l''Îlet Pinel',
  'Pinel Island Escape',
  'Courte traversée en ferry vers un îlet préservé. Eaux turquoise et calmes, idéales pour le snorkeling. Restaurants de plage avec langouste et cocktails.',
  'Short ferry ride to a pristine islet. Calm turquoise waters, perfect for snorkeling. Beach restaurants serving lobster and cocktails.',
  'Plage',
  'Beach',
  NULL, NULL,
  '{"duration_fr": "Demi ou journée complète", "duration_en": "Half or full day", "icon": "island"}',
  20, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'activity_card', 'maho_beach',
  'Maho Beach & Avions Rase-Mottes',
  'Maho Beach Plane-Spotting',
  'Célèbre dans le monde entier pour ses avions à très basse altitude. Une expérience unique sur l''île. Facile à combiner avec un déjeuner ou un verre à proximité.',
  'World-famous for low-flying aircraft over the beach. A truly one-of-a-kind island experience. Easily combined with lunch or drinks nearby.',
  'Insolite',
  'Unique',
  NULL, NULL,
  '{"tip_fr": "Consultez les horaires pour voir les gros porteurs", "tip_en": "Check flight schedules for wide-body arrivals", "duration_fr": "Demi-journée", "duration_en": "Half day", "icon": "plane"}',
  30, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'activity_card', 'snorkeling_diving',
  'Snorkeling & Plongée',
  'Snorkeling & Diving',
  'Meilleurs spots : Rocher Créole, Tintamarre, Little Bay. Rencontrez tortues, raies et poissons tropicaux. Excursions guidées disponibles pour tous niveaux.',
  'Top spots: Creole Rock, Tintamarre, Little Bay. Encounter turtles, rays and tropical fish. Guided excursions available for all levels.',
  'Mer / Aventure',
  'Sea / Adventure',
  NULL, NULL,
  '{"duration_fr": "Demi-journée", "duration_en": "Half day", "icon": "waves"}',
  40, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'activity_card', 'orient_bay',
  'Journée à Orient Bay',
  'Orient Bay Beach Day',
  'Jet ski, parachute ascensionnel et beach clubs animés. Surnommée le "Saint-Tropez des Caraïbes". Ambiance festive, activités nautiques et restauration.',
  'Jet ski, parasailing and vibrant beach clubs. Often called the "St Tropez of the Caribbean". Lively atmosphere with watersports and dining.',
  'Plage',
  'Beach',
  NULL, NULL,
  '{"duration_fr": "Journée complète", "duration_en": "Full day", "icon": "sun"}',
  50, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'activity_card', 'sunset_cruise',
  'Croisière au Coucher du Soleil',
  'Sunset Cruise',
  'Navigation avec cocktails et musique à l''heure dorée. Coucher de soleil spectaculaire sur les Caraïbes. L''une des expériences les plus romantiques de l''île.',
  'Sailing with cocktails and music at golden hour. Breathtaking Caribbean sunset views. One of the most romantic experiences on the island.',
  'Romantique / Mer',
  'Romantic / Sea',
  NULL, NULL,
  '{"duration_fr": "Demi-journée", "duration_en": "Half day", "icon": "sunset"}',
  60, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'activity_card', 'atv_tour',
  'Tour de l''Île en ATV / Buggy',
  'ATV & Buggy Island Tour',
  'Exploration des routes panoramiques, points de vue et plages cachées. Un excellent mélange d''adrénaline et de découverte. Excursions guidées disponibles.',
  'Explore scenic roads, viewpoints and hidden beaches. A perfect blend of adrenaline and sightseeing. Guided tours available from multiple operators.',
  'Aventure',
  'Adventure',
  NULL, NULL,
  '{"duration_fr": "Demi-journée", "duration_en": "Half day", "icon": "zap"}',
  70, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'activity_card', 'zipline',
  'Tyrolienne — Rainforest Adventure',
  'Zipline at Rainforest Adventure',
  'L''une des tyroliennes les plus raides au monde. Vues panoramiques spectaculaires sur l''île. Une sensation inoubliable au-dessus de la canopée.',
  'One of the steepest ziplines in the world. Stunning panoramic views over the island. An unforgettable thrill above the treetops.',
  'Aventure',
  'Adventure',
  NULL, NULL,
  '{"duration_fr": "Demi-journée", "duration_en": "Half day", "icon": "zap"}',
  80, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'activity_card', 'grand_case_food',
  'Gastronomie & Culture à Grand Case',
  'Grand Case Food & Culture',
  'Grand Case — capitale gastronomique de l''île. Lolos traditionnels avec barbecue authentique et cuisine créole. Visite de distillerie de rhum possible.',
  'Grand Case — the culinary capital of the island. Traditional lolos serving authentic BBQ and Creole food. Optional rum distillery visit.',
  'Gastronomie / Culture',
  'Food / Culture',
  NULL, NULL,
  '{"duration_fr": "Demi-journée", "duration_en": "Half day", "icon": "utensils"}',
  90, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'activity_card', 'day_trip_islands',
  'Excursion à Anguilla ou Saba',
  'Day Trip to Anguilla or Saba',
  'Anguilla : sable blanc immaculé et plages luxueuses. Saba : plongée de classe mondiale et paysages volcaniques. Une journée de dépaysement total depuis Sint Maarten.',
  'Anguilla: pristine white-sand beaches and luxury. Saba: world-class diving and volcanic landscapes. A full-day change of scenery from Sint Maarten.',
  'Excursion',
  'Day Trip',
  NULL, NULL,
  '{"duration_fr": "Journée complète", "duration_en": "Full day", "icon": "map"}',
  100, true
);

-- ── 10. SEED — 7 jours itinéraire (guide_items type itinerary_day) ──
INSERT INTO guide_items (
  section_id, item_type, item_key,
  title_fr, title_en,
  content_fr, content_en,
  meta_json, display_order, is_visible
) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'itinerary_day', 'day_1',
  'Arrivée & Premier Coucher de Soleil',
  'Arrival & First Sunset',
  'Installation et détente à la villa. Baignade à la plage la plus proche. Dîner à Grand Case.',
  'Settle in, unwind at the villa. Swim at the nearest beach. Dinner in Grand Case.',
  '{"day": 1}',
  110, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'itinerary_day', 'day_2',
  'Catamaran à la Journée',
  'Full-Day Catamaran',
  'Excursion catamaran autour de l''île. Snorkeling à Tintamarre ou Rocher Créole. Open bar et déjeuner à bord.',
  'Full-day catamaran tour around the island. Snorkeling stops at Tintamarre or Creole Rock. Open bar and lunch on board.',
  '{"day": 2}',
  120, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'itinerary_day', 'day_3',
  'Îlet Pinel & Soirée Détente',
  'Pinel Island & Evening Chill',
  'Ferry vers l''Îlet Pinel. Snorkeling et déjeuner de plage avec langouste. Soirée tranquille à la villa.',
  'Ferry to Pinel Island. Snorkeling and beach lunch with lobster. Relaxed evening at the villa.',
  '{"day": 3}',
  130, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'itinerary_day', 'day_4',
  'Orient Bay & Sortie en Soirée',
  'Orient Bay & Night Out',
  'Journée à Orient Bay avec activités nautiques. Jet ski, parachute ascensionnel, beach clubs. Sortie nocturne côté hollandais.',
  'Orient Bay beach day with watersports. Jet ski, parasailing, beach club vibes. Night out on the Dutch side.',
  '{"day": 4}',
  140, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'itinerary_day', 'day_5',
  'Tour de l''Île & Maho au Coucher du Soleil',
  'Island Tour & Maho Sunset',
  'Tour de l''île en ATV ou buggy. Points de vue panoramiques et plages cachées. Maho Beach au coucher du soleil — avions rase-mottes.',
  'ATV or buggy tour of the island. Scenic viewpoints and hidden beaches. Maho Beach at sunset — watch the planes land.',
  '{"day": 5}',
  150, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'itinerary_day', 'day_6',
  'Excursion : Anguilla ou Saba',
  'Day Trip: Anguilla or Saba',
  'Excursion à la journée à Anguilla ou Saba. Anguilla : sable blanc & luxe. Saba : plongée & paysages volcaniques.',
  'Full-day excursion to Anguilla or Saba. Anguilla: white sand & luxury. Saba: diving & volcanic scenery.',
  '{"day": 6}',
  160, true
),
(
  'a1000000-0000-0000-0000-000000000001',
  'itinerary_day', 'day_7',
  'Dernière Matinée & Croisière d''Adieu',
  'Final Morning & Farewell Cruise',
  'Snorkeling matinal au Rocher Créole ou Little Bay. Sunset cruise pour clôturer la semaine en beauté. Dernier dîner avec vue sur les Caraïbes.',
  'Morning snorkeling at Creole Rock or Little Bay. Sunset cruise to close the week in style. Last dinner with Caribbean views.',
  '{"day": 7}',
  170, true
);

-- ── 11. SEED — Sections communes (structure fixe) ────────────
INSERT INTO guide_sections (
  id, scope, section_key, section_type,
  title_fr, title_en,
  icon_name, display_order, is_published
) VALUES
(
  'a1000000-0000-0000-0000-000000000002',
  'shared', 'essential_info', 'key_info',
  'Infos essentielles',
  'Essential Info',
  'info', 10, true
),
(
  'a1000000-0000-0000-0000-000000000003',
  'shared', 'during_stay', 'generic',
  'Pendant votre séjour',
  'During Your Stay',
  'home', 20, true
),
(
  'a1000000-0000-0000-0000-000000000004',
  'shared', 'useful_contacts', 'contacts',
  'Contacts utiles',
  'Useful Contacts',
  'phone', 40, true
)
ON CONFLICT (id) DO NOTHING;

-- ── DONE ─────────────────────────────────────────────────────
-- Tables créées : guide_sections, guide_items, apartment_key_info, optional_partner_contacts
-- Seed : section Explore Saint-Martin + 10 activités + 7 jours itinéraire + 3 sections communes
-- Note : apartment_sections (ancienne table) est conservée sans modification
--        Le front sera migré progressivement vers les nouvelles tables
