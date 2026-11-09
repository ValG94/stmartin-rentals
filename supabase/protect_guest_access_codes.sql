-- ============================================================
-- Codes d'accès voyageur : plus lisibles ni modifiables avec la clé publique
-- ============================================================
--
-- Avant : apartment_key_info était lisible en entier par la clé anon
-- (présente dans le navigateur), mot de passe Wi-Fi et codes compris, et la
-- policy "key_info_service_write" (FOR ALL USING true, sans TO) autorisait
-- aussi l'écriture à anon.
-- Après :
--   - anon / authenticated lisent toutes les colonnes SAUF wifi_password,
--     gate_code, alarm_code (guide public, lib/api-guide.ts) ;
--   - écriture réservée au service role (admin via /api/admin/guide/key-info) ;
--   - le Wi-Fi part dans le mail de confirmation (lib/services/guest-access.ts).
--
-- PRÉREQUIS : le code qui lit/écrit via le serveur est déployé.
-- À exécuter dans Supabase SQL Editor. Idempotent.
-- ============================================================

-- Écriture : plus de policy ouverte, le service role contourne la RLS
DROP POLICY IF EXISTS "key_info_service_write" ON apartment_key_info;
REVOKE INSERT, UPDATE, DELETE ON apartment_key_info FROM anon, authenticated;

-- Lecture : droits par colonne, sans les codes
REVOKE SELECT ON apartment_key_info FROM anon, authenticated;
GRANT SELECT (
  apartment_id, wifi_name,
  parking_info_fr, parking_info_en, address_text_fr, address_text_en, map_link,
  host_phone, emergency_phone, fire_phone, whatsapp,
  checkin_time, checkout_time, checkin_note_fr, checkin_note_en, checkout_note_fr, checkout_note_en,
  hero_image_url, hero_tagline_fr, hero_tagline_en, hero_tagline_color, hero_tagline_italic,
  created_at, updated_at
) ON apartment_key_info TO anon, authenticated;

-- Vérification : wifi_password, gate_code, alarm_code ne doivent pas apparaître
SELECT grantee, column_name
FROM information_schema.column_privileges
WHERE table_name = 'apartment_key_info' AND grantee = 'anon' AND privilege_type = 'SELECT'
ORDER BY column_name;
