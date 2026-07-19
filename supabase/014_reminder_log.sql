-- ============================================================
-- RECORDATORIOS AUTOMATICOS (send-reminders cron)
-- ============================================================
-- Evita enviar el mismo recordatorio 2 veces si el cron corre mas de una vez.
-- tipo: 'cita_24h' | 'cita_2h' | 'reactivacion_3m'
-- clave unica (appointment_id|client_id, tipo) asegura 1 envio por caso.

CREATE TABLE IF NOT EXISTS public.reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  canal text NOT NULL DEFAULT 'whatsapp',
  enviado_en timestamptz DEFAULT now(),
  UNIQUE (appointment_id, tipo)
);

-- Indice para limpiar logs viejos si crece
CREATE INDEX IF NOT EXISTS idx_reminder_log_enviado ON public.reminder_log (enviado_en);

COMMENT ON TABLE public.reminder_log IS 'Bitacora de recordatorios enviados para no duplicar';
