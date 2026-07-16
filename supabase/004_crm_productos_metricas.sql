-- =====================================================================
--  Micheline · Migración 004: Productos (inventario) + políticas CRM
--  Pega este archivo en el SQL Editor de Supabase y ejecútalo.
--  (La BD es la misma del repo micheline-v2-beautera)
-- =====================================================================

-- ---------------------------------------------------------------------
--  1) TABLA PRODUCTOS (inventario del salón)
--  Guarda lo que vendes/usas: tipo, descripción, marca, precio, stock.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,                       -- nombre del producto
  type        text,                                 -- tipo: 'Uñas','Cabello','Piel','Herramienta','Belleza'...
  description text,                                 -- descripción libre
  brand       text,                                 -- marca (texto libre, simple)
  price       numeric(10,2) NOT NULL DEFAULT 0,     -- precio de venta
  cost        numeric(10,2) DEFAULT 0,              -- costo (para margen)
  stock       integer DEFAULT 0,                    -- unidades en inventario
  sku         text,                                 -- código opcional
  is_active   boolean DEFAULT true,                 -- activo/inactivo
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- ---------------------------------------------------------------------
--  2) RLS (Row Level Security) para products
--  El dashboard usa el anon key PERO con un usuario logueado => rol 'authenticated'.
--  Permitimos que cualquier usuario autenticado haga todo (CRUD).
-- ---------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_auth_all" ON products;
CREATE POLICY "products_auth_all" ON products
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------
--  3) POLÍTICAS para CLIENTS y APPOINTMENTS
--  Hoy tienen RLS activado SIN política => el dashboard no ve nada.
--  Las damos de SOLO LECTURA a usuarios autenticados (los gráficos y el
--  CRM solo leen; no borran citas desde aquí).
-- ---------------------------------------------------------------------
-- Clients: lectura para autenticados
DROP POLICY IF EXISTS "clients_auth_read" ON clients;
CREATE POLICY "clients_auth_read" ON clients
  FOR SELECT TO authenticated
  USING (true);

-- Clients: también permitir editar (es un CRM, se quiere corregir datos)
DROP POLICY IF EXISTS "clients_auth_write" ON clients;
CREATE POLICY "clients_auth_write" ON clients
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "clients_auth_update" ON clients;
CREATE POLICY "clients_auth_update" ON clients
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Appointments: SOLO lectura para autenticados (alimenta métricas y CRM)
DROP POLICY IF EXISTS "appointments_auth_read" ON appointments;
CREATE POLICY "appointments_auth_read" ON appointments
  FOR SELECT TO authenticated
  USING (true);

-- ---------------------------------------------------------------------
--  4) (Opcional) si quisieras que el widget siga sin ver citas/clientes,
--  no agregamos política para rol 'anon' en clients/appointments.
--  products tampoco es pública (no tiene política anon) => el widget
--  del sitio web no la ve. Correcto.
-- ---------------------------------------------------------------------
