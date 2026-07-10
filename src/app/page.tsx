'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Cita = {
  id: string
  start_at: string
  client_name: string
  service_id: string | null
  stylist_id: string | null
  status: string | null
  services?: { name: string }[] | null
  stylists?: { full_name: string }[] | null
}

// Pagina principal: lista de citas del dia (calendario simple)
export default function HomePage() {
  const supabase = createClient()
  const [citas, setCitas] = useState<Cita[]>([])
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  async function cargar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserEmail(user.email || '')

    const desde = `${fecha}T00:00:00-04:00`
    const hasta = `${fecha}T23:59:59-04:00`
    const { data } = await supabase
      .from('appointments')
      .select('id, start_at, client_name, service_id, stylist_id, status, services(name), stylists(full_name)')
      .gte('start_at', desde)
      .lte('start_at', hasta)
      .order('start_at')
    setCitas((data as unknown as Cita[]) || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [fecha])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const pendientes = citas.filter(c => c.status !== 'cancelled').length

  return (
    <div className="min-h-screen">
      {/* Barra superior */}
      <header className="bg-rose-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="font-bold">💅 Micheline · Panel</div>
        <div className="flex items-center gap-3 text-sm">
          <span className="opacity-90">{userEmail}</span>
          <button onClick={logout} className="bg-rose-800 hover:bg-rose-900 px-3 py-1 rounded text-xs">
            Salir
          </button>
        </div>
      </header>

      {/* Menu lateral */}
      <div className="flex">
        <nav className="w-48 bg-white border-r min-h-[calc(100vh-49px)] p-3 text-sm hidden sm:block">
          <Link href="/" className="block px-3 py-2 rounded bg-rose-50 text-rose-700 font-medium">📅 Citas</Link>
          <Link href="/servicios" className="block px-3 py-2 rounded hover:bg-gray-100">💅 Servicios</Link>
          <Link href="/estilistas" className="block px-3 py-2 rounded hover:bg-gray-100">👩‍🎨 Estilistas</Link>
        </nav>

        {/* Contenido */}
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-800">Citas del día</h1>
            <div className="flex items-center gap-2">
              <input
                type="date" value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
              <span className="text-sm text-gray-500">{pendientes} activas</span>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-400">Cargando…</p>
          ) : citas.length === 0 ? (
            <p className="text-gray-400">No hay citas para esta fecha.</p>
          ) : (
            <div className="space-y-2">
              {citas.map((c) => (
                <div key={c.id} className="bg-white border rounded-lg p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="font-medium text-gray-800">
                      {new Date(c.start_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} — {c.client_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {c.services?.[0]?.name || 'Servicio'} · {c.stylists?.[0]?.full_name || 'Estilista'}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    c.status === 'confirmed' ? 'bg-green-100 text-green-700'
                    : c.status === 'cancelled' ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>
                    {c.status || 'pendiente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
