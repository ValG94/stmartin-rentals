-- ============================================================
-- CORRECTION DES POLITIQUES RLS SUPABASE STORAGE
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Supprimer les anciennes politiques du bucket apartment-images
DROP POLICY IF EXISTS "Public read apartment images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload apartment images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete apartment images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update apartment images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- 2. S'assurer que le bucket existe et est public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apartment-images',
  'apartment-images',
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- 3. Politique : lecture publique (tout le monde peut voir les images)
CREATE POLICY "Public read apartment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'apartment-images');

-- 4. Politique : upload autorisé pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'apartment-images');

-- 5. Politique : mise à jour autorisée pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'apartment-images');

-- 6. Politique : suppression autorisée pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'apartment-images');

-- ============================================================
-- CORRECTION DES POLITIQUES RLS DES TABLES
-- ============================================================

-- Table apartment_images : permettre les opérations CRUD aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Admin can manage images" ON apartment_images;
DROP POLICY IF EXISTS "Public can read images" ON apartment_images;

CREATE POLICY "Public can read images"
ON apartment_images FOR SELECT
USING (true);

CREATE POLICY "Authenticated can insert images"
ON apartment_images FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update images"
ON apartment_images FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete images"
ON apartment_images FOR DELETE
TO authenticated
USING (true);

-- Table apartments : permettre les mises à jour aux utilisateurs authentifiés
DROP POLICY IF EXISTS "Admin can manage apartments" ON apartments;
DROP POLICY IF EXISTS "Public can read apartments" ON apartments;

CREATE POLICY "Public can read apartments"
ON apartments FOR SELECT
USING (true);

CREATE POLICY "Authenticated can insert apartments"
ON apartments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update apartments"
ON apartments FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete apartments"
ON apartments FOR DELETE
TO authenticated
USING (true);

-- Table seasonal_prices
DROP POLICY IF EXISTS "Public can read seasonal prices" ON seasonal_prices;
DROP POLICY IF EXISTS "Authenticated can manage seasonal prices" ON seasonal_prices;

CREATE POLICY "Public can read seasonal prices"
ON seasonal_prices FOR SELECT
USING (true);

CREATE POLICY "Authenticated can insert seasonal prices"
ON seasonal_prices FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update seasonal prices"
ON seasonal_prices FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete seasonal prices"
ON seasonal_prices FOR DELETE
TO authenticated
USING (true);

-- Table apartment_sections (guide)
DROP POLICY IF EXISTS "Public can read sections" ON apartment_sections;
DROP POLICY IF EXISTS "Authenticated can manage sections" ON apartment_sections;

CREATE POLICY "Public can read sections"
ON apartment_sections FOR SELECT
USING (true);

CREATE POLICY "Authenticated can insert sections"
ON apartment_sections FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update sections"
ON apartment_sections FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete sections"
ON apartment_sections FOR DELETE
TO authenticated
USING (true);

SELECT 'Politiques RLS corrigées avec succès ✅' AS result;
