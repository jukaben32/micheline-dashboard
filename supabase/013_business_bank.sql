-- ============================================================
-- DATOS BANCARIOS DEL NEGOCIO (para pago por transferencia)
-- ============================================================
-- El metodo de pago 'transferencia' muestra al cliente los datos
-- bancarios del salon para que haga la transferencia y el admin
-- confirme la cita al ver el comprobante.
-- Estos campos son publicos SOLO para el negocio dueño (no se exponen
-- a otros negocios por el RLS de business). La landing los lee con el
-- business_id de Micheline (public_business_id).

ALTER TABLE public.business
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_holder text,
  ADD COLUMN IF NOT EXISTS bank_account text;

COMMENT ON COLUMN public.business.bank_name IS 'Banco para transferencia (ej. Banco Popular / Reservas)';
COMMENT ON COLUMN public.business.bank_holder IS 'Titular de la cuenta';
COMMENT ON COLUMN public.business.bank_account IS 'Numero de cuenta';
