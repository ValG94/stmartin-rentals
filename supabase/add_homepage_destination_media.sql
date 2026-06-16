-- ============================================================
-- Homepage Destination Slider — médias éditoriaux pilotés depuis l'admin
-- ============================================================
--
-- Stocke les images et vidéos affichées dans la section "The Destination"
-- de la homepage. Géré entièrement depuis le dashboard admin (la propriétaire
-- peut ajouter / réordonner / publier / masquer / supprimer sans dev).
--
-- Les fichiers sont stockés dans les buckets existants apartment-images
-- (images) et apartment-videos (vidéos) sous le préfixe 'homepage-destination/'
-- — évite de dupliquer la config RLS et l'infra signed-upload déjà rodée.
-- ============================================================

CREATE TABLE IF NOT EXISTS homepage_destination_media (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_type      TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url       TEXT NOT NULL,
  storage_path    TEXT,                          -- chemin dans le bucket pour cleanup au DELETE
  thumbnail_url   TEXT,                          -- poster optionnel pour les vidéos
  title_fr        TEXT,
  title_en        TEXT,
  caption_fr      TEXT,
  caption_en      TEXT,
  alt_fr          TEXT,
  alt_en          TEXT,
  display_order   INTEGER NOT NULL DEFAULT 0,
  is_published    BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_destination_media_published_order
  ON homepage_destination_media (is_published, display_order);

CREATE INDEX IF NOT EXISTS idx_destination_media_display_order
  ON homepage_destination_media (display_order);

-- Trigger : maintenir updated_at à jour
CREATE OR REPLACE FUNCTION touch_destination_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS destination_media_set_updated_at ON homepage_destination_media;
CREATE TRIGGER destination_media_set_updated_at
  BEFORE UPDATE ON homepage_destination_media
  FOR EACH ROW EXECUTE FUNCTION touch_destination_media_updated_at();

-- RLS
ALTER TABLE homepage_destination_media ENABLE ROW LEVEL SECURITY;

-- Lecture publique uniquement des slides publiés
DROP POLICY IF EXISTS "Public read published destination media" ON homepage_destination_media;
CREATE POLICY "Public read published destination media" ON homepage_destination_media
  FOR SELECT USING (is_published = true);

-- Service role gère tout (admin via API)
-- (le service_role bypass RLS automatiquement, pas de policy nécessaire)

-- Vérification
SELECT
  column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'homepage_destination_media'
ORDER BY ordinal_position;
