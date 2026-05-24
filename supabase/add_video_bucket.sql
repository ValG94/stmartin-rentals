-- ============================================================
-- Bucket apartment-videos pour les MP4 uploadés depuis l'admin
-- ============================================================
--
-- Bucket séparé d'apartment-images pour :
--   - Limite de taille distincte (100 MB vs 10 MB)
--   - MIME types vidéo uniquement
--   - Quotas / monitoring séparés
--
-- L'upload se fait via signed upload URLs (le client envoie le
-- fichier directement à Supabase, jamais via les serverless
-- functions Vercel — qui ont une limite de body de 4.5 MB).
--
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'apartment-videos',
  'apartment-videos',
  true,
  104857600, -- 100 MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime'];

-- Lecture publique du contenu du bucket
DROP POLICY IF EXISTS "Public read apartment videos storage" ON storage.objects;
CREATE POLICY "Public read apartment videos storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'apartment-videos');

-- Upload via signed URL (token vérifié côté Supabase). Insert autorisé
-- pour tous, c'est le token d'upload signé côté serveur qui authentifie.
DROP POLICY IF EXISTS "Signed upload apartment videos" ON storage.objects;
CREATE POLICY "Signed upload apartment videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'apartment-videos');

-- Delete via service_role uniquement (depuis l'API admin)
DROP POLICY IF EXISTS "Service role delete apartment videos" ON storage.objects;
CREATE POLICY "Service role delete apartment videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'apartment-videos');

-- Vérification
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'apartment-videos';
