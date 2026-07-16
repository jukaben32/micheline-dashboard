'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

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
  const [clientes, setClientes] = useState<ClienteView[]>([])
  const [loading, setLoading] = useState(true)

  // Campos del formulario para agregar cliente
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [categoria, setCategoria] = useState('nuevo')
  const [cumple, setCumple] = useState('')

  async function cargar() {
    // Traemos clientes y citas (no canceladas) para enriquecer
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.from('clients').select('*').order('full_name'),
      supabase.from('appointments').select('client_id, service_id, start_at, status, services(name)').neq('status', 'cancelada'),
    ])
    const citas = (a as unknown as Cita[]) || []

    // Para cada cliente, calculamos última visita, servicio y nº de visitas
    const enriquecidos = ((c as Cliente[]) || []).map(cl => {
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

    // Orden: los que tienen visita reciente primero
    enriquecidos.sort((x, y) => (y.ultima_visita || '').localeCompare(x.ultima_visita || ''))
    setClientes(enriquecidos)
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('clients').insert({
      full_name: nombre,
      phone: telefono || null,
      email: email || null,
      birth_date: cumple || null,
      category: categoria,
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
    <div className="min-h-screen">
      <header className="bg-rose-700 text-white px-4 py-3 font-bold">💅 Micheline · Clientes (CRM)</header>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-800">Clientes</h1>
            <span className="text-sm text-gray-500">{total} clientes · {vips} VIP</span>
          </div>

          {/* Formulario agregar cliente */}
          <form onSubmit={agregar} className="bg-white border rounded-lg p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3 items-end shadow-sm">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} required className="border rounded px-3 py-1.5 text-sm w-full" placeholder="Ana Pérez" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
              <input value={telefono} onChange={e => setTelefono(e.target.value)} className="border rounded px-3 py-1.5 text-sm w-full" placeholder="809..." />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="border rounded px-3 py-1.5 text-sm w-full" placeholder="ana@mail.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Categoría</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className="border rounded px-3 py-1.5 text-sm w-full">
                <option value="nuevo">Nuevo</option>
                <option value="frecuente">Frecuente</option>
                <option value="vip">VIP</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cumpleaños</label>
              <input value={cumple} onChange={e => setCumple(e.target.value)} type="date" className="border rounded px-3 py-1.5 text-sm w-full" />
            </div>
            <button className="col-span-2 md:col-span-5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded text-sm">Agregar cliente</button>
          </form>

          {/* Tabla de clientes */}
          {loading ? <p className="text-gray-400">Cargando…</p> : (
            <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
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
          )}
        </main>
      </div>
    </div>
  )
}
