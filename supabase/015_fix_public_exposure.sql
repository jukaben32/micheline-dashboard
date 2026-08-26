-- ============================================================
-- Corrección de exposición pública de datos (auditoría de seguridad)
-- ============================================================
-- Verificado contra pg_policies en producción antes de escribir esto:
-- ninguna de las políticas que se eliminan aquí es usada por index.html,
-- admin.html ni el widget público — todo el acceso público real pasa por
-- Edge Functions con service_role (que ya se saltan RLS), no por lectura
-- directa del navegador contra estas tablas.

-- 1) business: exponía bank_name/bank_holder/bank_account de TODOS los
--    negocios a cualquier visitante sin login (USING true). create-payment
--    ya sirve esos datos server-side; el navegador nunca lee /rest/v1/business.
DROP POLICY IF EXISTS "business_public_read" ON public.business;

-- 2) clients / appointments: exponían nombre, teléfono, email y detalle de
--    citas del negocio de la landing (Micheline) a cualquiera sin login.
DROP POLICY IF EXISTS "clients_public_read" ON public.clients;
DROP POLICY IF EXISTS "appointments_public_read" ON public.appointments;

-- 3) availability: sin uso público real (el navegador nunca la lee directo).
DROP POLICY IF EXISTS "availability_public_read" ON public.availability;

-- 4) blocked_slots: tenía DOS políticas heredadas de antes del multi-tenant
--    que nunca se limpiaron (su nombre no coincidía con el patrón que
--    borraba la migración 007 — "blocked_public_read"/"blocked_auth_write"
--    vs. "blocked_slots_public_read"/"blocked_slots_auth_write" — así que
--    sobrevivieron en paralelo a las políticas correctas):
--      - "blocked_public_read" (USING true) exponía los horarios bloqueados
--        de TODOS los negocios a cualquiera sin login.
--      - "blocked_auth_write" (USING true / WITH CHECK true) permitía que
--        CUALQUIER usuario autenticado (de cualquier negocio) modificara o
--        borrara los horarios bloqueados de CUALQUIER OTRO negocio.
--    Ya existen sus reemplazos correctos (blocked_slots_auth_read/write),
--    y nadie necesita lectura pública de esta tabla.
DROP POLICY IF EXISTS "blocked_public_read" ON public.blocked_slots;
DROP POLICY IF EXISTS "blocked_auth_write" ON public.blocked_slots;
DROP POLICY IF EXISTS "blocked_slots_public_read" ON public.blocked_slots;

-- 5) service_product_lines: mismo problema heredado ("spl public read",
--    USING true, exponía TODOS los negocios). Nadie la lee directo desde
--    el navegador tampoco.
DROP POLICY IF EXISTS "spl public read" ON public.service_product_lines;
DROP POLICY IF EXISTS "service_product_lines_public_read" ON public.service_product_lines;

-- 6) reminder_log: se creó (migración 014) sin activar RLS. Confirmado en
--    producción: con RLS apagado, los roles anon/authenticated tenían
--    SELECT/INSERT/UPDATE/DELETE/TRUNCATE sobre toda la tabla, sin ninguna
--    restricción — cualquiera con la clave pública podía leer o borrar la
--    bitácora completa de recordatorios. Solo el cron (service_role, que
--    ignora RLS) debe poder tocarla — con RLS activado y cero políticas
--    para anon/authenticated, quedan bloqueados por completo.
ALTER TABLE public.reminder_log ENABLE ROW LEVEL SECURITY;

-- 7) profiles: la política de auto-inserción solo validaba "eres tú mismo",
--    sin exigir que el rol/negocio coincidan con lo que el trigger de
--    registro asigna por defecto (role='admin', business_id=NULL). Hoy no
--    era explotable porque el trigger SECURITY DEFINER crea la fila antes
--    (y chocaría con la clave primaria), pero la política en sí no imponía
--    ningún límite propio.
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'admin' AND business_id IS NULL);
