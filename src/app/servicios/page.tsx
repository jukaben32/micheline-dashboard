'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/AppShell'

type Servicio = {
  id: string
  name: string
  price: number
  duration_min: number
  is_active: boolean
}

// Gestion de servicios
export default function ServiciosPage() {
  const supabase = createClient()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [duracion, setDuracion] = useState('30')
  const [loading, setLoading] = useState(true)

  async function cargar() {
    const { data } = await supabase.from('services').select('*').order('price')
    setServicios((data as Servicio[]) || [])
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('services').insert({
      name: nombre, price: parseFloat(precio), duration_min: parseInt(duracion), is_active: true,
    })
    setNombre(''); setPrecio(''); setDuracion('30')
    cargar()
  }

  async function toggle(id: string, activo: boolean) {
    await supabase.from('services').update({ is_active: !activo }).eq('id', id)
    cargar()
  }

  async function borrar(id: string) {
    await supabase.from('services').delete().eq('id', id)
    cargar()
  }

  return (
    <AppShell titulo="Servicios">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Catálogo de servicios</h2>

      {/* Formulario para agregar servicio */}
      <form onSubmit={agregar} className="animar-aparecer bg-white border border-[#ece8e5] rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-end shadow-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nombre</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:border-rose-300 outline-none" placeholder="Manicura clásica" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Precio $</label>
          <input value={precio} onChange={e => setPrecio(e.target.value)} required type="number" step="0.01" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 focus:border-rose-300 outline-none" placeholder="25" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Min</label>
          <input value={duracion} onChange={e => setDuracion(e.target.value)} type="number" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-20 focus:border-rose-300 outline-none" />
        </div>
        <button className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Agregar</button>
      </form>

      {loading ? <p className="text-gray-400">Cargando…</p> : (
        <div className="space-y-2">
          {servicios.map(s => (
            <div key={s.id} className="animar-aparecer bg-white border border-[#ece8e5] rounded-2xl p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="font-medium text-gray-800">{s.name}</span>
                <span className="text-sm text-gray-500">${s.price} · {s.duration_min}min</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggle(s.id, s.is_active)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                  {s.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => borrar(s.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Borrar</button>
              </div>
            </div>
          ))}
          {servicios.length === 0 && <p className="text-gray-400">No hay servicios aún.</p>}
        </div>
      )}
    </AppShell>
  )
}
