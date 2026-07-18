-- ============================================================
-- FASE 1.C — Multi-tenant: políticas RLS por negocio
-- ============================================================
-- Objetivo: cada admin solo ve/escribe datos de SU negocio (business_id).
--           el super_admin ve TODO.
--           la landing (rol anon/public) sigue leyendo SOLO lo de Micheline
--           (filtrado por is_active + negocio Micheline) para no romper el sitio.
--
-- Truco: funciones SQL que leen el perfil del usuario logueado, reutilizadas
-- en todas las políticas (KISS: no repetir lógica).

-- 1) Funciones auxiliares de seguridad
CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid()
$$;

COMMENT ON FUNCTION public.current_business_id() IS 'Negocio del usuario logueado (NULL si no tiene perfil).';

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
$$;

COMMENT ON FUNCTION public.is_super_admin() IS 'True si el usuario logueado es super_admin (ve todos los negocios).';

-- Negocio "Micheline" expuesto al público (lo que muestra la landing)
-- Se usa para que la landing (anon) solo vea datos de Micheline.
CREATE OR REPLACE FUNCTION public.public_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT '645fbc08-035a-4302-9fbe-9a4a21b9decd'::uuid
$$;

-- 2) Reemplazar políticas de cada tabla de datos.
--    Patrón por tabla:
--      - SELECT public/anon : solo Micheline + is_active (para la landing)
--      - SELECT authenticated: su propio negocio O super_admin
--      - ALL authenticated   : su propio negocio O super_admin (escritura)
DO $$
DECLARE
  t text;
  tablas text[] := ARRAY[
    'stylists','services','brands','products','appointments',
    'clients','availability','blocked_slots','service_product_lines'
  ];
BEGIN
  FOREACH t IN ARRAY tablas LOOP
    -- Borrar políticas previas (las de USING(true) sin aislamiento)
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_public_read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_auth_read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_auth_write', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_write', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_auth_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_auth_all', t);

    -- Lectura pública (landing): SOLO Micheline + activos
    -- (stylists/services/brands/products tienen is_active; appointments/clients/availability
    --  no, así que para ellas la lectura pública se limita al negocio Micheline)
    IF t IN ('stylists','services','brands','products') THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO anon, public
         USING (business_id = public_business_id() AND is_active = true)',
        t || '_public_read', t);
    ELSE
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO anon, public
         USING (business_id = public_business_id())',
        t || '_public_read', t);
    END IF;

    -- Lectura autenticada (dashboard): su negocio O super_admin
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
       USING (business_id = current_business_id() OR is_super_admin())',
      t || '_auth_read', t);

    -- Escritura autenticada (dashboard): su negocio O super_admin
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
       USING (business_id = current_business_id() OR is_super_admin())
       WITH CHECK (business_id = current_business_id() OR is_super_admin())',
      t || '_auth_write', t);
  END LOOP;
END $$;
