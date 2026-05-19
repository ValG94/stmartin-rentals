-- ══════════════════════════════════════════════════════════════
-- Mise à jour du seed itinéraire 7 jours
-- Exécuter dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Mettre à jour le titre de la section explore_saint_martin
UPDATE guide_sections
SET
  title_fr = 'Votre séjour idéal en 7 jours',
  title_en = 'Your Ideal 7-Day Stay',
  subtitle_fr = 'Itinéraire curé',
  subtitle_en = 'Curated itinerary',
  intro_fr = 'Chaque journée a été pensée pour vous offrir le meilleur de Saint-Martin — entre mer, aventure, détente et découvertes. Libre à vous de les adapter selon vos envies.',
  intro_en = 'Each day has been crafted to offer you the very best of Saint-Martin — sea, adventure, relaxation and discovery. Feel free to adapt them to your own pace.'
WHERE section_key = 'explore_saint_martin';

-- ── Jour 1 ────────────────────────────────────────────────────
UPDATE guide_items SET
  title_fr    = 'Arrivée & premier coucher de soleil',
  title_en    = 'Arrival & First Sunset',
  content_fr  = 'Installez-vous tranquillement à la villa, profitez d''un premier moment de détente et laissez la journée se terminer face à un magnifique coucher de soleil.',
  content_en  = 'Settle into the villa, unwind, and ease into island life with a beautiful first sunset.',
  badge_fr    = 'Détente · Arrivée',
  badge_en    = 'Relax · Arrival',
  icon_name   = 'sunset',
  meta_json   = '{"day": 1}'
WHERE item_key = 'day_1' AND item_type = 'itinerary_day';

-- ── Jour 2 ────────────────────────────────────────────────────
UPDATE guide_items SET
  title_fr    = 'Cap sur l''île en catamaran',
  title_en    = 'Sailing the Island',
  content_fr  = 'Partez pour une journée en mer autour de l''île, entre snorkeling, criques préservées et ambiance caribéenne à bord.',
  content_en  = 'Set out for a full day at sea around the island, with snorkeling stops, hidden coves and a true Caribbean atmosphere on board.',
  badge_fr    = 'Mer · Journée complète',
  badge_en    = 'Sea · Full day',
  icon_name   = 'sailboat',
  meta_json   = '{"day": 2}'
WHERE item_key = 'day_2' AND item_type = 'itinerary_day';

-- ── Jour 3 ────────────────────────────────────────────────────
UPDATE guide_items SET
  title_fr    = 'Évasion à Pinel',
  title_en    = 'Pinel Escape',
  content_fr  = 'Traversez jusqu''à l''îlet Pinel pour une journée tout en douceur entre baignade, snorkeling et déjeuner les pieds dans le sable.',
  content_en  = 'Head to Pinel Island for a gentle escape filled with swimming, snorkeling and a beachside lunch.',
  badge_fr    = 'Plage · Chill',
  badge_en    = 'Beach · Chill',
  icon_name   = 'waves',
  meta_json   = '{"day": 3}'
WHERE item_key = 'day_3' AND item_type = 'itinerary_day';

-- ── Jour 4 ────────────────────────────────────────────────────
UPDATE guide_items SET
  title_fr    = 'L''énergie d''Orient Bay',
  title_en    = 'Orient Bay Energy',
  content_fr  = 'Profitez d''une journée animée entre plage, activités nautiques, beach clubs et ambiance ensoleillée.',
  content_en  = 'Enjoy a lively beach day with watersports, beach clubs and the vibrant energy of Orient Bay.',
  badge_fr    = 'Fun · Plage',
  badge_en    = 'Fun · Beach',
  icon_name   = 'zap',
  meta_json   = '{"day": 4}'
WHERE item_key = 'day_4' AND item_type = 'itinerary_day';

-- ── Jour 5 ────────────────────────────────────────────────────
UPDATE guide_items SET
  title_fr    = 'Aventure & golden hour',
  title_en    = 'Adventure & Golden Hour',
  content_fr  = 'Explorez l''île en buggy ou en ATV avant de terminer la journée à Maho Beach au moment du coucher du soleil.',
  content_en  = 'Explore the island by ATV or buggy, then end the day at Maho Beach during golden hour.',
  badge_fr    = 'Aventure · Sunset',
  badge_en    = 'Adventure · Sunset',
  icon_name   = 'mountain',
  meta_json   = '{"day": 5}'
WHERE item_key = 'day_5' AND item_type = 'itinerary_day';

-- ── Jour 6 ────────────────────────────────────────────────────
UPDATE guide_items SET
  title_fr    = 'Escapade au large',
  title_en    = 'Island Escape',
  content_fr  = 'Offrez-vous une excursion à la journée vers Anguilla ou Saba pour découvrir une autre facette des Caraïbes.',
  content_en  = 'Treat yourself to a full-day escape to Anguilla or Saba and discover another side of the Caribbean.',
  badge_fr    = 'Excursion · Évasion',
  badge_en    = 'Day Trip · Escape',
  icon_name   = 'anchor',
  meta_json   = '{"day": 6}'
WHERE item_key = 'day_6' AND item_type = 'itinerary_day';

-- ── Jour 7 ────────────────────────────────────────────────────
UPDATE guide_items SET
  title_fr    = 'Une parenthèse finale en douceur',
  title_en    = 'A Gentle Farewell',
  content_fr  = 'Terminez votre séjour en toute sérénité avec un moment de snorkeling ou une dernière croisière au coucher du soleil.',
  content_en  = 'End your stay on a peaceful note with a snorkeling session or one last sunset cruise.',
  badge_fr    = 'Relax · Final',
  badge_en    = 'Relax · Final',
  icon_name   = 'heart',
  meta_json   = '{"day": 7}'
WHERE item_key = 'day_7' AND item_type = 'itinerary_day';
