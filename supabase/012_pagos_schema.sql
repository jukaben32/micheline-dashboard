-- ============================================================
-- ARQUITECTURA DE PAGOS (CardNET + transferencia bancaria)
-- ============================================================
-- Objetivo: soportar reservas que requieren pago antes de confirmarse.
--   - La cita se crea con status='pendiente_pago' y luego pasa a
--     'confirmada' cuando se confirma el pago (CardNET vía webhook,
--     o el admin manualmente en el caso de transferencia).
--   - NO guardamos datos de tarjeta nunca: CardNET Link de Pago redirige
--     al cliente a la pagina de CardNET (cumplimiento PCI).
--
-- Campos nuevos en appointments:
--   payment_method : 'cardnet' | 'transferencia' | null
--   payment_id     : id de la transaccion / link de pago (CardNET u otro)
--   paid_at        : timestamp en que se confirmo el pago
-- El campo 'price' (numeric) ya existe y guarda el monto.
-- ============================================================

-- 1) Ampliar el CHECK de status para incluir 'pendiente_pago'
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status = ANY (ARRAY[
    'confirmada'::text,
    'cancelada'::text,
    'reprogramada'::text,
    'completada'::text,
    'pendiente_pago'::text   -- NUEVO: reserva hecha, falta pagar
  ]));

-- 2) Campos de pago
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS payment_method text
    CHECK (payment_method IS NULL OR payment_method = ANY (ARRAY['cardnet','transferencia']));
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- 3) Indice para buscar citas pendientes de un negocio (panel admin)
CREATE INDEX IF NOT EXISTS idx_appointments_status_business
  ON public.appointments (business_id, status);

COMMENT ON COLUMN public.appointments.payment_method IS 'cardnet | transferencia | null';
COMMENT ON COLUMN public.appointments.payment_id IS 'id de transaccion o link de pago (CardNET)';
COMMENT ON COLUMN public.appointments.paid_at IS 'momento en que se confirmo el pago';
