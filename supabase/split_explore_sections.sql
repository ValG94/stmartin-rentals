-- ══════════════════════════════════════════════════════════════════
-- MIGRATION : Scinder la section "Explorer Saint-Martin" en 2 sections
-- Section 1 : Explorer Saint-Martin (activities/cards)
-- Section 2 : Votre semaine idéale (itinerary/planning 7 jours)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Mettre à jour la section existante → Section 1 (activities) ──
UPDATE guide_sections
SET
  section_type   = 'activities',
  section_key    = 'explore_activities',
  title_fr       = 'Explorer Saint-Martin',
  title_en       = 'Explore Saint Martin',
  subtitle_fr    = 'Excursions & activités incontournables',
  subtitle_en    = 'Must-do excursions & activities',
  intro_fr       = 'Découvrez le meilleur de Sint Maarten / Saint-Martin grâce à cette sélection d''excursions incontournables, d''escapades balnéaires, d''activités aventure et d''expériences culinaires locales. Que vous souhaitiez vous détendre, explorer ou profiter de la mer, voici notre guide recommandé pour vivre un séjour inoubliable.',
  intro_en       = 'Discover the best of Sint Maarten / Saint Martin with this curated selection of must-do excursions, beach escapes, adventure activities, and local food experiences. Whether you want to relax, explore or enjoy the sea, here is our recommended island guide for a memorable stay.',
  display_order  = 30,
  icon_name      = 'compass'
WHERE section_key = 'explore_saint_martin';

-- ── 2. Créer la Section 2 : Itinéraire 7 jours (si elle n'existe pas déjà) ──
INSERT INTO guide_sections (
  id, scope, section_key, section_type,
  title_fr, title_en,
  subtitle_fr, subtitle_en,
  intro_fr, intro_en,
  icon_name, display_order, is_published
)
SELECT
  gen_random_uuid(),
  'shared',
  'itinerary_7days',
  'itinerary',
  'Votre séjour idéal en 7 jours',
  'Your Ideal 7-Day Stay',
  'Une semaine conçue pour vous',
  'A week designed for you',
  'Chaque journée a été pensée pour vous offrir le meilleur de Saint-Martin — mer, aventure, détente et découverte. Adaptez-les librement à votre rythme.',
  'Each day has been crafted to offer you the very best of Saint-Martin — sea, adventure, relaxation and discovery. Feel free to adapt them to your own pace.',
  'calendar',
  35,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM guide_sections WHERE section_key = 'itinerary_7days'
);

-- ── 3. Déplacer les items itinerary_day vers la Section 2 ──
UPDATE guide_items
SET section_id = (
  SELECT id FROM guide_sections WHERE section_key = 'itinerary_7days' LIMIT 1
)
WHERE item_type = 'itinerary_day'
  AND section_id = (
    SELECT id FROM guide_sections WHERE section_key = 'explore_activities' LIMIT 1
  );

-- ── Vérification ──
SELECT section_key, section_type, title_fr, display_order FROM guide_sections ORDER BY display_order;
SELECT gi.item_type, gi.title_fr, gs.section_key
FROM guide_items gi
JOIN guide_sections gs ON gi.section_id = gs.id
WHERE gi.item_type IN ('activity_card', 'itinerary_day')
ORDER BY gs.section_key, gi.display_order;
