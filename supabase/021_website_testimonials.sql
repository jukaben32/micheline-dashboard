-- ============================================================
-- TESTIMONIOS mostrados en la landing publica
-- ============================================================
CREATE TABLE IF NOT EXISTS public.website_testimonials (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    uuid NOT NULL REFERENCES public.business(id) ON DELETE CASCADE,
  sort_order     int NOT NULL DEFAULT 0,
  author_name    text NOT NULL,
  author_location text,
  quote          text NOT NULL,
  rating         int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_website_testimonials_business ON public.website_testimonials (business_id, sort_order);

ALTER TABLE public.website_testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "website_testimonials_auth_all" ON public.website_testimonials;
CREATE POLICY "website_testimonials_auth_all" ON public.website_testimonials
  FOR ALL TO authenticated
  USING (business_id = public.current_business_id() OR public.is_super_admin())
  WITH CHECK (business_id = public.current_business_id() OR public.is_super_admin());
