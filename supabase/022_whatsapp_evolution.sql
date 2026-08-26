-- ============================================================
-- PREPARACION PARA EVOLUTION API (WhatsApp self-hosted, multi-negocio)
-- ============================================================
-- Un servidor Evolution API (autoalojado) puede manejar varias
-- "instancias" (una por numero de WhatsApp conectado). Cada negocio
-- tiene su propia instancia; el nombre de instancia (no es secreto) vive
-- en business.evolution_instance. La API key de Evolution SI es secreta
-- y se guarda como secreto de Edge Functions (EVOLUTION_API_KEY), no
-- aqui — es una sola, del servidor, no una por negocio.

ALTER TABLE public.business ADD COLUMN IF NOT EXISTS evolution_instance text UNIQUE;

-- Historial de conversacion por telefono, para que el bot tenga contexto
-- entre mensajes (a diferencia del chat web, que guarda el historial en
-- el navegador, aqui no hay "sesion" — hay que persistirlo).
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business(id) ON DELETE CASCADE,
  phone       text NOT NULL,
  role        text NOT NULL CHECK (role IN ('user','assistant')),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lookup
  ON public.whatsapp_messages (business_id, phone, created_at);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- El dueno del negocio puede LEER su propio historial (ej. para un futuro
-- "registro de conversaciones" en el dashboard). Solo la Edge Function
-- (service-role) escribe.
DROP POLICY IF EXISTS "whatsapp_messages_auth_read" ON public.whatsapp_messages;
CREATE POLICY "whatsapp_messages_auth_read" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (business_id = public.current_business_id() OR public.is_super_admin());
