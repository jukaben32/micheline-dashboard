import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente admin (service-role) SOLO para uso server-side sin sesion de
// usuario: Server Components y Route Handlers bajo src/app/sites/**, donde
// un visitante publico necesita leer datos de un negocio sin haber iniciado
// sesion. Nunca importar esto desde un archivo 'use client' ni desde codigo
// que corra en el navegador — se salta RLS por completo.
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient() no debe usarse en el navegador')
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
