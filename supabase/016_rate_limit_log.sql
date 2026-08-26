-- ============================================================
-- RATE LIMITING para Edge Functions publicas (create-booking, chat)
-- ============================================================
-- Registra un hit por cada llamada a una funcion publica, identificado
-- por telefono (create-booking) o IP (create-booking + chat). Las
-- funciones cuentan hits recientes antes de procesar y rechazan con 429
-- si se pasan del limite. Solo la escribe/lee el service_role (o la
-- secret key nueva) desde las Edge Functions - sin RLS para anon/
-- authenticated, igual que reminder_log.

CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fn         text NOT NULL,           -- nombre de la function: 'create-booking' | 'chat'
  rate_key   text NOT NULL,           -- telefono o IP del que llama
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_log_lookup
  ON public.rate_limit_log (fn, rate_key, created_at);

-- Limpieza automatica: nadie necesita hits de mas de 2 dias.
CREATE INDEX IF NOT EXISTS idx_rate_limit_log_created ON public.rate_limit_log (created_at);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
-- Sin politicas para anon/authenticated a proposito: con RLS activado y
-- cero politicas, esos roles quedan bloqueados por completo. Solo
-- service_role (que ignora RLS) puede tocarla.
