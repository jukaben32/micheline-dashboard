-- ============================================================
-- UBICACIONES FISICAS mostradas en la landing publica
-- ============================================================
CREATE TABLE IF NOT EXISTS public.website_locations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid NOT NULL REFERENCES public.business(id) ON DELETE CASCADE,
  sort_order       int NOT NULL DEFAULT 0,
  name             text NOT NULL,
  badge_label      text,
  schedule_weekday text,
  schedule_sunday  text,
  phone            text,
  whatsapp         text,
  address          text,
  is_dark          boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_website_locations_business ON public.website_locations (business_id, sort_order);

ALTER TABLE public.website_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "website_locations_auth_all" ON public.website_locations;
CREATE POLICY "website_locations_auth_all" ON public.website_locations
  FOR ALL TO authenticated
  USING (business_id = public.current_business_id() OR public.is_super_admin())
  WITH CHECK (business_id = public.current_business_id() OR public.is_super_admin());
