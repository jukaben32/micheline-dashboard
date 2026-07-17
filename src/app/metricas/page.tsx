'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/AppShell'
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
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
// Paleta de colores para los donuts (rosa a tonos cálidos)
const COLORS = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#f97316', '#fb923c', '#facc15', '#a78bfa', '#38bdf8']

export default function MetricasPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  // Datos para los donuts
  const [serviciosTop, setServiciosTop] = useState<{ label: string; value: number; color: string }[]>([])
  const [afluencia, setAfluencia] = useState<{ label: string; value: number; color: string }[]>([])
  const [ocupacion, setOcupacion] = useState<{ label: string; value: number; color: string }[]>([])
  // Nuevos donuts pedidos
  const [ingresoMes, setIngresoMes] = useState<{ label: string; value: number; color: string }[]>([])
  const [ticketEstilista, setTicketEstilista] = useState<{ label: string; value: number; color: string }[]>([])
  const [cancelacion, setCancelacion] = useState<{ label: string; value: number; color: string }[]>([])
  const [retencion, setRetencion] = useState<{ label: string; value: number; color: string }[]>([])

  const [totalCitas, setTotalCitas] = useState(0)
  const [clientesUnicos, setClientesUnicos] = useState(0)
  const [ingresoEstimado, setIngresoEstimado] = useState(0)

  async function cargar() {
    // Traemos citas + catálogo de servicios + estilistas
    const [{ data: a }, { data: s }, { data: st }] = await Promise.all([
      supabase.from('appointments').select('service_id, stylist_id, start_at, status, client_id, services(name)'),
      supabase.from('services').select('id, name, price'),
      supabase.from('stylists').select('id, full_name'),
    ])
    const citas = ((a as unknown as Cita[]) || [])
    const servicios = (s as Servicio[]) || []
    const estilistas = (st as Stylist[]) || []

    const precioPorServ: Record<string, number> = {}
    servicios.forEach(sv => (precioPorServ[sv.id] = Number(sv.price) || 0))

    // --- 1) Servicios más consumidos (donut, solo no canceladas) ---
    const activas = citas.filter(c => c.status !== 'cancelada')
    const mapServ: Record<string, number> = {}
    let ingreso = 0
    activas.forEach(c => {
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
    activas.forEach(c => {
      const d = new Date(c.start_at).getDay()
      mapDia[d] = (mapDia[d] || 0) + 1
    })
    setAfluencia(DIAS.map((label, i) => ({ label, value: mapDia[i] || 0, color: COLORS[i % COLORS.length] })))

    // --- 3) Ocupación por estilista (donut, nº de citas) ---
    const mapEst: Record<string, number> = {}
    activas.forEach(c => { if (c.stylist_id) mapEst[c.stylist_id] = (mapEst[c.stylist_id] || 0) + 1 })
    setOcupacion(
      estilistas
        .map((e, i) => ({ label: e.full_name.split(' ')[0], value: mapEst[e.id] || 0, color: COLORS[i % COLORS.length] }))
        .filter(d => d.value > 0)
    )

    // --- 4) Ingreso por mes (donut) — derivado del catálogo de precios ---
    const mapMes: Record<number, number> = {}
    activas.forEach(c => {
      const mes = new Date(c.start_at).getMonth()
      mapMes[mes] = (mapMes[mes] || 0) + (c.service_id ? precioPorServ[c.service_id] || 0 : 0)
    })
    setIngresoMes(
      Object.entries(mapMes)
        .map(([m, v]) => ({ label: MESES[Number(m)], value: Math.round(v), color: COLORS[Number(m) % COLORS.length] }))
        .sort((x, y) => MESES.indexOf(x.label) - MESES.indexOf(y.label))
    )

    // --- 5) Ticket promedio por estilista (donut) ---
    const sumaEst: Record<string, { tot: number; n: number }> = {}
    activas.forEach(c => {
      if (!c.stylist_id || !c.service_id) return
      const p = precioPorServ[c.service_id] || 0
      if (!sumaEst[c.stylist_id]) sumaEst[c.stylist_id] = { tot: 0, n: 0 }
      sumaEst[c.stylist_id].tot += p
      sumaEst[c.stylist_id].n += 1
    })
    setTicketEstilista(
      estilistas
        .map((e, i) => {
          const s = sumaEst[e.id]
          const prom = s && s.n ? s.tot / s.n : 0
          return { label: e.full_name.split(' ')[0], value: Math.round(prom), color: COLORS[i % COLORS.length] }
        })
        .filter(d => d.value > 0)
    )

    // --- 6) Tasa de cancelación (donut: completadas/confirmadas vs canceladas) ---
    const canceladas = citas.filter(c => c.status === 'cancelada').length
    const otras = citas.length - canceladas
    setCancelacion([
      { label: 'Activas', value: otras, color: '#f43f5e' },
      { label: 'Canceladas', value: canceladas, color: '#94a3b8' },
    ])

    // --- 7) Retención de clientes (donut: recurrente vs nuevo) ---
    const porCliente: Record<string, number> = {}
    citas.forEach(c => { if (c.client_id) porCliente[c.client_id] = (porCliente[c.client_id] || 0) + 1 })
    let recurrentes = 0, nuevos = 0
    Object.values(porCliente).forEach(n => { if (n > 1) recurrentes++; else nuevos++ })
    setRetencion([
      { label: 'Recurrentes', value: recurrentes, color: '#a78bfa' },
      { label: 'Nuevos', value: nuevos, color: '#38bdf8' },
    ])

    // Resumen
    setTotalCitas(citas.length)
    setClientesUnicos(new Set(citas.map(c => c.client_id).filter(Boolean)).size)
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  return (
    <AppShell titulo="Métricas">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Panel de métricas</h2>

          {/* Tarjetas resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <ResumenCard label="Citas (totales)" valor={loading ? '…' : String(totalCitas)} icono="📅" acento="rose" />
            <ResumenCard label="Clientes únicos" valor={loading ? '…' : String(clientesUnicos)} icono="👥" acento="violet" />
            <ResumenCard label="Ingreso estimado" valor={loading ? '…' : `$${ingresoEstimado.toFixed(2)}`} icono="💰" acento="amber" />
          </div>

          {loading ? <p className="text-gray-400">Cargando métricas…</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

              {/* Donut 4 — NUEVO: Ingreso por mes */}
              <GraficaCard titulo="Ingreso por mes ($)">
                <Donut data={ingresoMes} centerValue={`$${ingresoMes.reduce((s, d) => s + d.value, 0)}`} centerLabel="total" />
                <Leyenda data={ingresoMes.map(d => ({ ...d, label: `${d.label} · $${d.value}` }))} />
              </GraficaCard>

              {/* Donut 5 — NUEVO: Ticket promedio por estilista */}
              <GraficaCard titulo="Ticket promedio por estilista ($)">
                <Donut data={ticketEstilista} centerValue={`$${Math.round(ticketEstilista.reduce((s, d) => s + d.value, 0) / (ticketEstilista.length || 1))}`} centerLabel="prom" />
                <Leyenda data={ticketEstilista.map(d => ({ ...d, label: `${d.label} · $${d.value}` }))} />
              </GraficaCard>

              {/* Donut 6 — NUEVO: Tasa de cancelación */}
              <GraficaCard titulo="Tasa de cancelación">
                <Donut data={cancelacion} centerValue={`${cancelacion.length ? Math.round((cancelacion[1].value / (cancelacion[0].value + cancelacion[1].value)) * 100) : 0}%`} centerLabel="canceladas" />
                <Leyenda data={cancelacion} />
              </GraficaCard>

              {/* Donut 7 — NUEVO: Retención de clientes */}
              <GraficaCard titulo="Retención de clientes">
                <Donut data={retencion} centerValue={String(retencion.reduce((s, d) => s + d.value, 0))} centerLabel="clientes" />
                <Leyenda data={retencion} />
              </GraficaCard>
            </div>
          )}
    </AppShell>
  )
}

// Tarjeta resumen compacta con icono y color de acento
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
  // Mapa de colores según el acento elegido
  const acentos: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="animar-aparecer bg-white border border-[#ece8e5] rounded-3xl p-5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-shadow flex items-center gap-4">
      {icono && (
        <div className={`h-12 w-12 rounded-2xl grid place-items-center text-xl ${acentos[acento]}`}>
          {icono}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-2xl font-bold text-gray-900 truncate tracking-tight">{valor}</div>
      </div>
    </div>
  )
}

// Tarjeta que envuelve cada gráfico
function GraficaCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="animar-aparecer bg-white border border-[#ece8e5] rounded-3xl p-6 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-shadow flex flex-col items-center">
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
