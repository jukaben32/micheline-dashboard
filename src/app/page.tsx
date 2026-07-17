'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/AppShell'

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

// Colores de estado reutilizados en toda la página
const ESTADO_COLOR: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  pendiente: 'bg-amber-100 text-amber-700',
}

// Pagina principal: resumen + próximas citas + citas del día
export default function HomePage() {
  const supabase = createClient()
  const [citas, setCitas] = useState<Cita[]>([])          // citas del día seleccionado
  const [proximas, setProximas] = useState<Cita[]>([])    // próximas citas (desde ahora)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  // Carga las citas del día elegido
  async function cargarDia() {
    setLoading(true)
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

  // Carga las PRÓXIMAS citas (desde el momento actual hacia adelante)
  async function cargarProximas() {
    const ahora = new Date().toISOString()
    const { data } = await supabase
      .from('appointments')
      .select('id, start_at, client_name, service_id, stylist_id, status, services(name), stylists(full_name)')
      .gte('start_at', ahora)
      .neq('status', 'cancelled')
      .order('start_at')
      .limit(6)
    setProximas((data as unknown as Cita[]) || [])
  }

  useEffect(() => { cargarDia() }, [fecha])
  useEffect(() => { cargarProximas() }, [])

  // Métricas rápidas para las tarjetas resumen
  const activas = citas.filter(c => c.status !== 'cancelled').length
  const canceladas = citas.filter(c => c.status === 'cancelled').length
  const siguiente = proximas[0] // la cita más próxima

  return (
    <AppShell titulo="Resumen general">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <ResumenCard
          icono="📅" acento="rose"
          label="Citas hoy"
          valor={loading ? '…' : String(activas)}
        />
        <ResumenCard
          icono="❌" acento="amber"
          label="Canceladas hoy"
          valor={loading ? '…' : String(canceladas)}
        />
        <ResumenCard
          icono="⏭️" acento="violet"
          label="Próxima cita"
          valor={siguiente
            ? new Date(siguiente.start_at).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
            : '—'}
        />
      </div>

      {/* Dos columnas: próximas citas + citas del día */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL: Próximas citas */}
        <section className="animar-aparecer bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <span>⏭️</span> Próximas citas
            </h2>
            <span className="text-xs text-gray-400">{proximas.length} en agenda</span>
          </div>

          {proximas.length === 0 ? (
            <p className="p-5 text-gray-400 text-sm">No hay próximas citas agendadas.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {proximas.map((c) => (
                <li key={c.id} className="px-5 py-3 flex items-center gap-3 hover:bg-rose-50/40 transition-colors">
                  {/* Bloque de fecha/hora */}
                  <div className="w-14 text-center shrink-0">
                    <div className="text-[11px] uppercase text-rose-500 font-medium">
                      {new Date(c.start_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="text-sm font-bold text-gray-800">
                      {new Date(c.start_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {/* Datos de la cita */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{c.client_name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {c.services?.[0]?.name || 'Servicio'} · {c.stylists?.[0]?.full_name || 'Estilista'}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${ESTADO_COLOR[c.status || 'pendiente'] || ESTADO_COLOR.pendiente}`}>
                    {c.status || 'pendiente'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* PANEL: Citas del día (con selector de fecha) */}
        <section className="animar-aparecer bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <span>📅</span> Citas del día
            </h2>
            <input
              type="date" value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-rose-300 outline-none"
            />
          </div>

          {loading ? (
            <p className="p-5 text-gray-400 text-sm">Cargando…</p>
          ) : citas.length === 0 ? (
            <p className="p-5 text-gray-400 text-sm">No hay citas para esta fecha.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {citas.map((c) => (
                <li key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {new Date(c.start_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} — {c.client_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {c.services?.[0]?.name || 'Servicio'} · {c.stylists?.[0]?.full_name || 'Estilista'}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${ESTADO_COLOR[c.status || 'pendiente'] || ESTADO_COLOR.pendiente}`}>
                    {c.status || 'pendiente'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  )
}

// Tarjeta resumen con icono en círculo de color (misma estética que Métricas)
function ResumenCard({
  label,
  valor,
  icono,
  acento = 'rose',
}: {
  label: string
  valor: string
  icono?: string
  acento?: 'rose' | 'violet' | 'amber'
}) {
  const acentos: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="animar-aparecer bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
      {icono && (
        <div className={`h-11 w-11 rounded-full grid place-items-center text-xl ${acentos[acento]}`}>
          {icono}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-lg font-bold text-gray-800 truncate">{valor}</div>
      </div>
    </div>
  )
}
