'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

type Marca = { id: string; name: string; is_active: boolean }
type Linea = {
  id: string
  service_id: string | null
  brand_id: string | null
  price_adjustment: number
  is_default: boolean
  services?: { name: string }[] | null
  brands?: { name: string }[] | null
}

// Gestion de marcas y lineas de producto por servicio
export default function MarcasPage() {
  const supabase = createClient()
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [lineas, setLineas] = useState<Linea[]>([])
  const [servicios, setServicios] = useState<{ id: string; name: string }[]>([])
  const [nombreMarca, setNombreMarca] = useState('')
  const [selServicio, setSelServicio] = useState('')
  const [selMarca, setSelMarca] = useState('')
  const [ajuste, setAjuste] = useState('10')
  const [loading, setLoading] = useState(true)

  async function cargar() {
    const [{ data: m }, { data: l }, { data: s }] = await Promise.all([
      supabase.from('brands').select('*').order('name'),
      supabase.from('service_product_lines').select('*, services(name), brands(name)').order('created_at'),
      supabase.from('services').select('id, name').eq('is_active', true).order('name'),
    ])
    setMarcas((m as Marca[]) || [])
    setLineas((l as Linea[]) || [])
    setServicios((s as { id: string; name: string }[]) || [])
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  async function agregarMarca(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('brands').insert({ name: nombreMarca, is_active: true })
    setNombreMarca(''); cargar()
  }

  async function agregarLinea(e: React.FormEvent) {
    e.preventDefault()
    if (!selServicio || !selMarca) return
    await supabase.from('service_product_lines').insert({
      service_id: selServicio, brand_id: selMarca,
      price_adjustment: parseFloat(ajuste), is_default: false,
    })
    setSelServicio(''); setSelMarca(''); setAjuste('10'); cargar()
  }

  async function borrarLinea(id: string) {
    await supabase.from('service_product_lines').delete().eq('id', id); cargar()
  }
  async function borrarMarca(id: string) {
    await supabase.from('brands').delete().eq('id', id); cargar()
  }

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-rose-700 to-rose-500 text-white px-4 py-3 font-bold shadow-sm">💅 Micheline · Marcas / Líneas</header>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 space-y-8">
          <section>
            <h1 className="text-xl font-semibold text-gray-800 mb-4">Marcas de productos</h1>
            <form onSubmit={agregarMarca} className="bg-white border rounded-lg p-4 mb-4 flex gap-3 items-end shadow-sm">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nueva marca</label>
                <input value={nombreMarca} onChange={e => setNombreMarca(e.target.value)} required className="border rounded px-3 py-1.5 text-sm w-56" placeholder="Gel Premium" />
              </div>
              <button className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded text-sm">Agregar</button>
            </form>
            <div className="flex flex-wrap gap-2">
              {marcas.map(m => (
                <span key={m.id} className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                  {m.name}
                  <button onClick={() => borrarMarca(m.id)} className="text-rose-400 hover:text-rose-700">✕</button>
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Líneas por servicio (ajuste de precio)</h2>
            <form onSubmit={agregarLinea} className="bg-white border rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end shadow-sm">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Servicio</label>
                <select value={selServicio} onChange={e => setSelServicio(e.target.value)} required className="border rounded px-3 py-1.5 text-sm w-48">
                  <option value="">Selecciona…</option>
                  {servicios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Marca</label>
                <select value={selMarca} onChange={e => setSelMarca(e.target.value)} required className="border rounded px-3 py-1.5 text-sm w-40">
                  <option value="">Selecciona…</option>
                  {marcas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ajuste +$</label>
                <input value={ajuste} onChange={e => setAjuste(e.target.value)} type="number" step="0.01" className="border rounded px-3 py-1.5 text-sm w-24" />
              </div>
              <button className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded text-sm">Vincular</button>
            </form>

            {loading ? <p className="text-gray-400">Cargando…</p> : (
              <div className="space-y-2">
                {lineas.map(l => (
                  <div key={l.id} className="bg-white border rounded-lg p-3 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="font-medium text-gray-800">{l.services?.[0]?.name}</span>
                      <span className="text-gray-400"> + </span>
                      <span className="text-gray-800">{l.brands?.[0]?.name}</span>
                      <span className="ml-2 text-sm text-rose-600 font-semibold">+${l.price_adjustment}</span>
                      {l.is_default && <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">default</span>}
                    </div>
                    <button onClick={() => borrarLinea(l.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Borrar</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
