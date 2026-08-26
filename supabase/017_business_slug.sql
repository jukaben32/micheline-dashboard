-- ============================================================
-- SLUG por negocio (para landing publica /sites/[slug])
-- ============================================================
ALTER TABLE public.business ADD COLUMN IF NOT EXISTS slug text UNIQUE;

UPDATE public.business
SET slug = 'micheline'
WHERE id = '645fbc08-035a-4302-9fbe-9a4a21b9decd' AND slug IS NULL;
