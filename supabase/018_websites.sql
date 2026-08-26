-- ============================================================
-- CONTENIDO DE LA LANDING PUBLICA (una fila por negocio)
-- ============================================================
-- Solo el dueno del negocio (o super_admin) puede leer/escribir esta tabla.
-- La landing publica (/sites/[slug]) NO la lee via RLS: usa un cliente
-- admin server-side (service-role/secret key), igual que ya hacen las
-- Edge Functions de micheline-v2-beautera. Por eso no hay politica anon.

CREATE TABLE IF NOT EXISTS public.websites (
  business_id     uuid PRIMARY KEY REFERENCES public.business(id) ON DELETE CASCADE,
  is_published    boolean NOT NULL DEFAULT false,
  site_title      text,
  tagline         text,
  hero_title      text,
  hero_subtitle   text,
  hero_cta_label  text,
  about_text      text,
  primary_color   text NOT NULL DEFAULT '#C81361',
  secondary_color text NOT NULL DEFAULT '#C9A227',
  dark_color      text NOT NULL DEFAULT '#1B1113',
  bg_color        text NOT NULL DEFAULT '#FFFBF7',
  border_color    text NOT NULL DEFAULT '#EFE2E6',
  muted_color     text NOT NULL DEFAULT '#8A7A7E',
  font_choice     text NOT NULL DEFAULT 'playfair_plex' CHECK (font_choice IN ('playfair_plex')),
  whatsapp_number text,
  phone           text,
  social_instagram text,
  social_facebook  text,
  social_tiktok    text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "websites_auth_all" ON public.websites;
CREATE POLICY "websites_auth_all" ON public.websites
  FOR ALL TO authenticated
  USING (business_id = public.current_business_id() OR public.is_super_admin())
  WITH CHECK (business_id = public.current_business_id() OR public.is_super_admin());
