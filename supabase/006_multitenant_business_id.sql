-- ============================================================
-- FASE 1.B — Multi-tenant: business_id en tablas de datos
-- ============================================================
-- Agregamos business_id a cada tabla de datos, asignamos los datos
-- actuales al negocio Micheline y ponemos ese negocio como DEFAULT
-- para que lo nuevo (reservas, clientes) herede el negocio sin romper
-- el flujo actual (las Edge Functions no pasan business_id todavía).

-- Negocio Micheline (ya existe en la tabla business)
-- id = 645fbc08-035a-4302-9fbe-9a4a21b9decd

DO $$
DECLARE
  micheline uuid := '645fbc08-035a-4302-9fbe-9a4a21b9decd';
  t text;
  tablas text[] := ARRAY[
    'stylists','services','brands','products','appointments',
    'clients','availability','blocked_slots','service_product_lines'
  ];
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    -- 1) Agregar columna business_id con DEFAULT Micheline (si no existe)
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS business_id uuid NOT NULL DEFAULT %L REFERENCES public.business(id) ON DELETE CASCADE',
      t, micheline
    );
    -- 2) Asignar los datos existentes al negocio Micheline (por si quedó algo null)
    EXECUTE format('UPDATE public.%I SET business_id = %L WHERE business_id IS NULL', t, micheline);
    -- 3) Índice para que los filtros por negocio sean rápidos (escalabilidad)
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_business ON public.%I(business_id)', t, t);
  END LOOP;
END $$;
