-- ============================================================
-- CORRECCIÓN RLS tabla business (auditoría Micheline)
-- ============================================================
-- PROBLEMA detectado en auditoría:
--   La tabla business tenía dos políticas de escritura inseguras:
--     * business_write      -> ALL TO anon      (USING true / WITH CHECK true)
--     * business_auth_write -> ALL TO authenticated (USING true / WITH CHECK true)
--   Eso permitía que CUALQUIER persona (incluso sin login) creara
--   negocios -> agujero de seguridad en el flujo de "Alta de cliente".
--
-- SOLUCIÓN:
--   * Se elimina la política anon (business_write).
--   * La escritura queda SOLO para el super_admin, usando is_super_admin()
--     (función SECURITY DEFINER, sin recursión -> ver 009_fix_rls_recursion.sql).
--   * Se mantiene la lectura pública para la landing/widget (business_public_read).
-- ============================================================

-- 1) Quitar políticas inseguras previas
DROP POLICY IF EXISTS "business_write" ON public.business;
DROP POLICY IF EXISTS "business_auth_write" ON public.business;

-- 2) Lectura pública (la landing y el widget siguen necesitando ver negocios)
DROP POLICY IF EXISTS "business_public_read" ON public.business;
CREATE POLICY "business_public_read" ON public.business
  FOR SELECT TO anon, public
  USING (true);

-- 3) Escritura EXCLUSIVA del super_admin (dar de alta clientes desde /alta-cliente)
CREATE POLICY "business_super_write" ON public.business
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
