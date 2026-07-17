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

// Colores de estado tipo píldora
const ESTADO_COLOR: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  pendiente: 'bg-amber-100 text-amber-700',
}

// Pagina principal: resumen + próximas citas + citas del día
export default function HomePage() {
  const supabase = createClient()
  const [citas, setCitas] = useState<Cita[]>([])
  const [proximas, setProximas] = useState<Cita[]>([])
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

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

  const activas = citas.filter(c => c.status !== 'cancelled').length
  const canceladas = citas.filter(c => c.status === 'cancelled').length
  const siguiente = proximas[0]

  return (
    <AppShell titulo="Resumen general">
      {/* Fila de KPIs — estilo Nixtio: números grandes, tarjeta oscura de acento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Tarjeta oscura destacada */}
        <div className="card-dark animar-aparecer flex flex-col justify-between min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Citas hoy</span>
            <span className="text-xl">📅</span>
          </div>
          <div className="kpi mt-4">{loading ? '…' : activas}</div>
        </div>

        <KpiCard icono="⏭️" label="Próxima cita" valor={siguiente
          ? new Date(siguiente.start_at).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
          : '—'} pequeno />

        <KpiCard icono="🗓️" label="En agenda" valor={loading ? '…' : String(proximas.length)} />

        <KpiCard icono="❌" label="Canceladas hoy" valor={loading ? '…' : String(canceladas)} />
      </div>

      {/* Dos columnas: próximas citas + citas del día */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PANEL: Próximas citas */}
        <section className="card animar-aparecer !p-0 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>⏭️</span> Próximas citas
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">{proximas.length} en agenda</span>
          </div>

          {proximas.length === 0 ? (
            <p className="px-6 pb-6 text-gray-400 text-sm">No hay próximas citas agendadas.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {proximas.map((c) => (
                <li key={c.id} className="px-6 py-3 flex items-center gap-3 hover:bg-rose-50/40 transition-colors">
                  <div className="w-14 text-center shrink-0">
                    <div className="text-[11px] uppercase text-rose-500 font-medium">
                      {new Date(c.start_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {new Date(c.start_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{c.client_name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {c.services?.[0]?.name || 'Servicio'} · {c.stylists?.[0]?.full_name || 'Estilista'}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${ESTADO_COLOR[c.status || 'pendiente'] || ESTADO_COLOR.pendiente}`}>
                    {c.status || 'pendiente'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* PANEL: Citas del día */}
        <section className="card animar-aparecer !p-0 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>📅</span> Citas del día
            </h2>
            <input
              type="date" value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:border-rose-300 outline-none"
            />
          </div>

          {loading ? (
            <p className="px-6 pb-6 text-gray-400 text-sm">Cargando…</p>
          ) : citas.length === 0 ? (
            <p className="px-6 pb-6 text-gray-400 text-sm">No hay citas para esta fecha.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {citas.map((c) => (
                <li key={c.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {new Date(c.start_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} — {c.client_name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {c.services?.[0]?.name || 'Servicio'} · {c.stylists?.[0]?.full_name || 'Estilista'}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${ESTADO_COLOR[c.status || 'pendiente'] || ESTADO_COLOR.pendiente}`}>
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

// Tarjeta KPI clara (número grande estilo Nixtio)
function KpiCard({
  label,
  valor,
  icono,
  pequeno = false,
}: {
  label: string
  valor: string
  icono?: string
  pequeno?: boolean
}) {
  return (
    <div className="card animar-aparecer flex flex-col justify-between min-h-[130px]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        {icono && <span className="text-xl">{icono}</span>}
      </div>
      <div className={`mt-4 text-gray-900 ${pequeno ? 'text-lg font-bold truncate' : 'kpi'}`}>{valor}</div>
    </div>
  )
}
