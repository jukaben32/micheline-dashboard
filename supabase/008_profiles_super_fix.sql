-- ============================================================
-- FIX Fase 1.C: el super_admin debe poder crear/EDITAR perfiles
-- de CUALQUIER usuario (p.ej. al dar de alta un cliente nuevo desde
-- /alta-cliente, crea el perfil admin de otro usuario).
-- La política profiles_auth_write original solo permitía escribir
-- el perfil propio o con is_super_admin(), pero el WITH CHECK con
-- business_id = current_business_id() (NULL para super_admin) fallaba.
-- ============================================================

-- Política exclusiva para super_admin: control total sobre profiles
DROP POLICY IF EXISTS "profiles_super_all" ON public.profiles;
CREATE POLICY "profiles_super_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- También permitir que cualquier authenticated inserte su propio perfil
-- (el trigger handle_new_user y el registro normal lo necesitan).
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
