-- ============================================================
-- REGISTRO DE CONVERSACIONES (los 3 canales) + CONSUMO DE APIs
-- ============================================================

-- 1) Generaliza whatsapp_messages (hoy vacia, nada depende de ella todavia
--    en produccion — Evolution API sigue sin conectar) a los 3 canales.
ALTER TABLE public.whatsapp_messages RENAME TO conversation_messages;
ALTER TABLE public.conversation_messages ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.conversation_messages
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp','web_chat','voice'));
ALTER TABLE public.conversation_messages ALTER COLUMN channel DROP DEFAULT;
ALTER TABLE public.conversation_messages ADD COLUMN IF NOT EXISTS session_id text;
-- Cada fila necesita AL MENOS un identificador de conversacion.
ALTER TABLE public.conversation_messages
  ADD CONSTRAINT conversation_messages_has_thread CHECK (phone IS NOT NULL OR session_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_thread
  ON public.conversation_messages (business_id, channel, coalesce(phone, session_id), created_at);

DROP POLICY IF EXISTS "whatsapp_messages_auth_read" ON public.conversation_messages;
DROP POLICY IF EXISTS "conversation_messages_auth_read" ON public.conversation_messages;
CREATE POLICY "conversation_messages_auth_read" ON public.conversation_messages
  FOR SELECT TO authenticated
  USING (business_id = public.current_business_id() OR public.is_super_admin());

-- 2) Consumo de APIs de terceros con costo por uso (Anthropic, OpenAI
--    Realtime). Solo lectura para el dueño del negocio; escribe el
--    service-role desde las Edge Functions / rutas del dashboard.
CREATE TABLE IF NOT EXISTS public.api_usage_events (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        uuid NOT NULL REFERENCES public.business(id) ON DELETE CASCADE,
  provider           text NOT NULL CHECK (provider IN ('anthropic','openai_realtime')),
  event_type         text NOT NULL, -- 'chat_message' | 'voice_call'
  input_tokens       int,
  output_tokens      int,
  seconds            numeric,
  estimated_cost_usd numeric,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_events_business ON public.api_usage_events (business_id, created_at);

ALTER TABLE public.api_usage_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "api_usage_events_auth_read" ON public.api_usage_events;
CREATE POLICY "api_usage_events_auth_read" ON public.api_usage_events
  FOR SELECT TO authenticated
  USING (business_id = public.current_business_id() OR public.is_super_admin());
