'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import Donut from '@/components/Donut'

// Tipos de las consultas
type Cita = {
  service_id: string | null
  stylist_id: string | null
  start_at: string
  status: string | null
  client_id: string | null
  services?: { name: string }[] | null
}
type Stylist = { id: string; full_name: string }
type Servicio = { id: string; name: string; price: number }

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
// Paleta de colores para los donuts (rosa a tonos cálidos)
const COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#f97316', '#fb923c', '#facc15', '#a78bfa', '#38bdf8']

export default function MetricasPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  // Datos para los donuts
  const [serviciosTop, setServiciosTop] = useState<{ label: string; value: number; color: string }[]>([])
  const [afluencia, setAfluencia] = useState<{ label: string; value: number; color: string }[]>([])
  const [ocupacion, setOcupacion] = useState<{ label: string; value: number; color: string }[]>([])

  const [totalCitas, setTotalCitas] = useState(0)
  const [clientesUnicos, setClientesUnicos] = useState(0)
  const [ingresoEstimado, setIngresoEstimado] = useState(0)

  async function cargar() {
    // Traemos citas (no canceladas) + catálogo de servicios + estilistas
    const [{ data: a }, { data: s }, { data: st }] = await Promise.all([
      supabase.from('appointments').select('service_id, stylist_id, start_at, status, client_id, services(name)'),
      supabase.from('services').select('id, name, price'),
      supabase.from('stylists').select('id, full_name'),
    ])
    const citas = ((a as unknown as Cita[]) || []).filter(c => c.status !== 'cancelada')
    const servicios = (s as Servicio[]) || []
    const estilistas = (st as Stylist[]) || []

    // --- 1) Servicios más consumidos (donut) ---
    const mapServ: Record<string, number> = {}
    let ingreso = 0
    const precioPorServ: Record<string, number> = {}
    servicios.forEach(sv => (precioPorServ[sv.id] = Number(sv.price) || 0))
    citas.forEach(c => {
      const sid = c.service_id
      if (sid) {
        mapServ[sid] = (mapServ[sid] || 0) + 1
        ingreso += precioPorServ[sid] || 0
      }
    })
    const servData = Object.entries(mapServ)
      .map(([sid, n]) => ({ label: servicios.find(sv => sv.id === sid)?.name || '—', value: n }))
      .sort((x, y) => y.value - x.value)
      .slice(0, 6)
      .map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }))
    setServiciosTop(servData)
    setIngresoEstimado(ingreso)

    // --- 2) Afluencia por día de la semana (donut) ---
    const mapDia: Record<number, number> = {}
    citas.forEach(c => {
      const d = new Date(c.start_at).getDay()
      mapDia[d] = (mapDia[d] || 0) + 1
    })
    const diaData = DIAS.map((label, i) => ({
      label,
      value: mapDia[i] || 0,
      color: COLORS[i % COLORS.length],
    }))
    setAfluencia(diaData)

    // --- 3) Ocupación por estilista (donut, número de citas) ---
    const mapEst: Record<string, number> = {}
    citas.forEach(c => {
      const eid = c.stylist_id
      if (eid) mapEst[eid] = (mapEst[eid] || 0) + 1
    })
    const estData = estilistas
      .map((e, i) => ({ label: e.full_name.split(' ')[0], value: mapEst[e.id] || 0, color: COLORS[i % COLORS.length] }))
      .filter(d => d.value > 0)
    setOcupacion(estData)

    // Resumen
    setTotalCitas(citas.length)
    setClientesUnicos(new Set(citas.map(c => c.client_id).filter(Boolean)).size)

    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  return (
    <div className="min-h-screen">
      <header className="bg-rose-700 text-white px-4 py-3 font-bold">💅 Micheline · Métricas</header>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-xl font-semibold text-gray-800 mb-4">Panel de métricas</h1>

          {/* Tarjetas resumen */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="text-xs text-gray-400">Citas (no canceladas)</div>
              <div className="text-2xl font-bold text-gray-800">{loading ? '…' : totalCitas}</div>
            </div>
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="text-xs text-gray-400">Clientes únicos</div>
              <div className="text-2xl font-bold text-gray-800">{loading ? '…' : clientesUnicos}</div>
            </div>
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="text-xs text-gray-400">Ingreso estimado</div>
              <div className="text-2xl font-bold text-gray-800">${loading ? '…' : ingresoEstimado.toFixed(2)}</div>
            </div>
          </div>

          {loading ? <p className="text-gray-400">Cargando métricas…</p> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Donut 1 */}
              <GraficaCard titulo="Servicios más consumidos">
                <Donut data={serviciosTop} centerValue={String(serviciosTop.reduce((s, d) => s + d.value, 0))} centerLabel="servicios" />
                <Leyenda data={serviciosTop} />
              </GraficaCard>

              {/* Donut 2 */}
              <GraficaCard titulo="Afluencia por día">
                <Donut data={afluencia} centerValue={String(afluencia.reduce((s, d) => s + d.value, 0))} centerLabel="citas" />
                <Leyenda data={afluencia} />
              </GraficaCard>

              {/* Donut 3 */}
              <GraficaCard titulo="Ocupación por estilista">
                <Donut data={ocupacion} centerValue={String(ocupacion.reduce((s, d) => s + d.value, 0))} centerLabel="citas" />
                {ocupacion.length === 0 ? <p className="text-xs text-gray-400 mt-2">Sin citas asignadas</p> : <Leyenda data={ocupacion} />}
              </GraficaCard>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// Tarjeta que envuelve cada gráfico
function GraficaCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-lg p-5 shadow-sm flex flex-col items-center">
      <h2 className="text-sm font-semibold text-gray-700 mb-3 self-start">{titulo}</h2>
      {children}
    </div>
  )
}

// Lista de etiquetas con color + valor
function Leyenda({ data }: { data: { label: string; value: number; color: string }[] }) {
  return (
    <ul className="mt-3 w-full text-xs space-y-1">
      {data.map((d, i) => (
        <li key={i} className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-600">
            <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
            {d.label}
          </span>
          <span className="font-medium text-gray-800">{d.value}</span>
        </li>
      ))}
    </ul>
  )
}
