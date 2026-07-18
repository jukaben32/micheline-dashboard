-- ============================================================
-- FIX 2: RLS recursivo (stack overflow).
-- is_super_admin() y current_business_id() consultan public.profiles,
-- y al ejecutarse como el usuario autenticado, esa consulta interna
-- disparaba la RLS de profiles -> recursion infinita (54001).
-- Solucion: SECURITY DEFINER -> la funcion corre como el dueño
-- (postgres, superuser) y el RLS NO se aplica a la consulta interna.
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
$$;

CREATE OR REPLACE FUNCTION public.public_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT '645fbc08-035a-4302-9fbe-9a4a21b9decd'::uuid
$$;
