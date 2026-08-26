-- ============================================================
-- TARJETAS DESTACADAS (bento grid) de la landing publica
-- ============================================================
CREATE TABLE IF NOT EXISTS public.website_highlights (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business(id) ON DELETE CASCADE,
  sort_order  int NOT NULL DEFAULT 0,
  title       text NOT NULL,
  subtitle    text,
  description text,
  image_url   text,
  badge_label text,
  size        text NOT NULL DEFAULT 'md' CHECK (size IN ('lg','md','sm'))
);

CREATE INDEX IF NOT EXISTS idx_website_highlights_business ON public.website_highlights (business_id, sort_order);

ALTER TABLE public.website_highlights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "website_highlights_auth_all" ON public.website_highlights;
CREATE POLICY "website_highlights_auth_all" ON public.website_highlights
  FOR ALL TO authenticated
  USING (business_id = public.current_business_id() OR public.is_super_admin())
  WITH CHECK (business_id = public.current_business_id() OR public.is_super_admin());
