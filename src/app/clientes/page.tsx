'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/AppShell'
import { useActiveBusiness } from '@/hooks/useBusiness'
import Aviso from '@/components/Aviso'

// Cliente base (tabla clients ya existe en la BD)
type Cliente = {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  birth_date: string | null
  category: string
}

// Cita (para derivar última visita y servicio consumido)
type Cita = {
  client_id: string | null
  service_id: string | null
  start_at: string
  status: string | null
  services?: { name: string }[] | null
}

// Vista enriquecida que usamos en la tabla
type ClienteView = Cliente & {
  ultima_visita: string | null
  servicio_ultimo: string | null
  visitas: number
}

const CAT_COLOR: Record<string, string> = {
  nuevo: 'bg-blue-100 text-blue-700',
  frecuente: 'bg-green-100 text-green-700',
  vip: 'bg-amber-100 text-amber-700',
  inactivo: 'bg-gray-100 text-gray-500',
}

export default function ClientesPage() {
  const supabase = createClient()
  const { activeId } = useActiveBusiness()
  const [clientes, setClientes] = useState<ClienteView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // aviso si falla la carga
  const [hayMas, setHayMas] = useState(false) // ¿quedan más clientes por cargar?
  const LOTE = 50 // cuántos clientes traemos por página

  // Campos del formulario para agregar cliente
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [categoria, setCategoria] = useState('nuevo')
  const [cumple, setCumple] = useState('')

  // Trae un lote de clientes (desde `desde` hasta `desde+LOTE-1`) y los
  // enriquece con sus citas. Acumula con los que ya había en pantalla.
  async function cargar(desde = 0, acumulados: ClienteView[] = []) {
    setLoading(true)
    // Traemos un lote de clientes PAGINADO + un lote de citas (no canceladas).
    // Las citas las limitamos a las últimas 500 del negocio: suficiente para
    // calcular "última visita / servicio" sin cargar toda la historia.
    const [{ data: c, error: eC }, { data: a, error: eA }] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact' }).order('full_name').range(desde, desde + LOTE - 1),
      supabase.from('appointments').select('client_id, service_id, start_at, status, services(name)').neq('status', 'cancelada').order('start_at', { ascending: false }).limit(500),
    ])
    if (eC || eA) {
      setError(eC?.message || eA?.message || 'Error al cargar los datos')
      setLoading(false)
      return
    }
    const citas = (a as unknown as Cita[]) || []
    const nuevos = ((c as Cliente[]) || []).map(cl => {
      const propias = citas.filter(x => x.client_id === cl.id)
      const ordenadas = propias.sort((x, y) => y.start_at.localeCompare(x.start_at))
      const ultima = ordenadas[0]
      return {
        ...cl,
        ultima_visita: ultima ? ultima.start_at : null,
        servicio_ultimo: ultima?.services?.[0]?.name ?? null,
        visitas: propias.length,
      }
    })
    // Acumulamos los lotes previos + los nuevos
    const todos = [...acumulados, ...nuevos]
    // Orden: los que tienen visita reciente primero
    todos.sort((x, y) => (y.ultima_visita || '').localeCompare(x.ultima_visita || ''))
    setClientes(todos)
    // Si trajimos menos que el lote, ya no hay más páginas
    setHayMas((c as Cliente[] | null)?.length === LOTE)
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  // Botón "cargar más": trae el siguiente lote sin perder los anteriores
  async function cargarMas() {
    await cargar(clientes.length, clientes)
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('clients').insert({
      full_name: nombre,
      phone: telefono || null,
      email: email || null,
      birth_date: cumple || null,
      category: categoria,
      business_id: activeId ?? undefined,
    })
    setNombre(''); setTelefono(''); setEmail(''); setCategoria('nuevo'); setCumple('')
    cargar()
  }

  async function cambiarCategoria(id: string, cat: string) {
    await supabase.from('clients').update({ category: cat }).eq('id', id)
    cargar()
  }

  function fmtFecha(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Total de clientes
  const total = clientes.length
  const vips = clientes.filter(c => c.category === 'vip').length

  return (
    <AppShell titulo="Clientes (CRM)">
      {/* Aviso si la carga falló (antes se mostraba lista vacía en silencio) */}
      <Aviso mensaje={error} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Clientes</h2>
        <span className="text-sm text-gray-500">{total} clientes · {vips} VIP</span>
      </div>

          {/* Formulario agregar cliente */}
          <form onSubmit={agregar} className="bg-white border border-[#ece8e5] rounded-2xl p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3 items-end shadow-sm">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full" placeholder="Ana Pérez" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
              <input value={telefono} onChange={e => setTelefono(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full" placeholder="809..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full" placeholder="ana@mail.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Categoría</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full">
                <option value="nuevo">Nuevo</option>
                <option value="frecuente">Frecuente</option>
                <option value="vip">VIP</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cumpleaños</label>
              <input value={cumple} onChange={e => setCumple(e.target.value)} type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full" />
            </div>
            <button className="col-span-2 md:col-span-5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Agregar cliente</button>
          </form>

          {/* Tabla de clientes */}
          {loading ? <p className="text-gray-400">Cargando…</p> : (
            <div className="bg-white border border-[#ece8e5] rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Teléfono</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Última visita</th>
                    <th className="px-4 py-2">Servicio</th>
                    <th className="px-4 py-2">Visitas</th>
                    <th className="px-4 py-2">Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-800">{c.full_name}</td>
                      <td className="px-4 py-2 text-gray-600">{c.phone || '—'}</td>
                      <td className="px-4 py-2 text-gray-600">{c.email || '—'}</td>
                      <td className="px-4 py-2 text-gray-600">{fmtFecha(c.ultima_visita)}</td>
                      <td className="px-4 py-2 text-gray-600">{c.servicio_ultimo || '—'}</td>
                      <td className="px-4 py-2 text-gray-600">{c.visitas}</td>
                      <td className="px-4 py-2">
                        <select
                          value={c.category}
                          onChange={e => cambiarCategoria(c.id, e.target.value)}
                          className={`text-xs rounded px-2 py-1 ${CAT_COLOR[c.category] || 'bg-gray-100'}`}
                        >
                          <option value="nuevo">Nuevo</option>
                          <option value="frecuente">Frecuente</option>
                          <option value="vip">VIP</option>
                          <option value="inactivo">Inactivo</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {clientes.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-4 text-gray-400 text-center">No hay clientes aún.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Botón para traer el siguiente lote (paginación) si hay más clientes */}
            {hayMas && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={cargarMas}
                  disabled={loading}
                  className="bg-white border border-gray-200 hover:border-rose-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Cargando…' : 'Cargar más clientes'}
                </button>
              </div>
            )}
          )}
    </AppShell>
  )
}
