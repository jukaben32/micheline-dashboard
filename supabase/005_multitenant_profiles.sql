-- ============================================================
-- FASE 1.A — Multi-tenant: tabla profiles + roles
-- ============================================================
-- Reutilizamos la tabla 'business' existente como tabla de tenants (negocios/clientes).
-- Creamos 'profiles' para vincular cada usuario de Auth con su rol y su negocio.

-- 1) Tabla de perfiles: un perfil por usuario de Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- mismo id que el usuario Auth
  role        text NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin','admin','staff')), -- rol del usuario
  business_id uuid REFERENCES public.business(id) ON DELETE SET NULL,       -- a qué negocio pertenece (null = super_admin)
  full_name   text,
  created_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfil de cada usuario: su rol (super_admin/admin/staff) y a qué negocio pertenece.';

-- 2) Habilitar RLS en profiles (cada quien ve/edita su propio perfil; super_admin ve todos)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cada usuario puede leer su propio perfil
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 3) Trigger: cuando se crea un usuario nuevo en Auth, crear su perfil automáticamente (rol admin por defecto)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Crear/asignar los perfiles iniciales (los 2 usuarios que ya existen)
--    super_admin (tú): jcbjm03@gmail.com — business_id null = acceso a todo
INSERT INTO public.profiles (id, role, business_id, full_name)
VALUES ('6773de2a-6338-45e5-b9f5-7c7a9e9ee573', 'super_admin', NULL, 'Super Admin')
ON CONFLICT (id) DO UPDATE SET role = 'super_admin', business_id = NULL;

--    admin del cliente Micheline: admin@micheline.com — atado al negocio Micheline
INSERT INTO public.profiles (id, role, business_id, full_name)
VALUES ('e90d1f8c-1ed1-454f-8ffa-4e680e4fa43e', 'admin', '645fbc08-035a-4302-9fbe-9a4a21b9decd', 'Admin Micheline')
ON CONFLICT (id) DO UPDATE SET role = 'admin', business_id = '645fbc08-035a-4302-9fbe-9a4a21b9decd';
