'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/AppShell'

type Estilista = {
  id: string
  full_name: string
  specialty: string | null
  is_active: boolean
}

// Gestion de estilistas
export default function EstilistasPage() {
  const supabase = createClient()
  const [estilistas, setEstilistas] = useState<Estilista[]>([])
  const [nombre, setNombre] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [loading, setLoading] = useState(true)

  async function cargar() {
    const { data } = await supabase.from('stylists').select('*').order('full_name')
    setEstilistas((data as Estilista[]) || [])
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('stylists').insert({ full_name: nombre, specialty: especialidad || null, is_active: true })
    setNombre(''); setEspecialidad('')
    cargar()
  }

  async function toggle(id: string, activo: boolean) {
    await supabase.from('stylists').update({ is_active: !activo }).eq('id', id)
    cargar()
  }

  async function borrar(id: string) {
    await supabase.from('stylists').delete().eq('id', id)
    cargar()
  }

  return (
    <AppShell titulo="Estilistas">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Equipo de estilistas</h2>

      <form onSubmit={agregar} className="animar-aparecer bg-white border border-[#ece8e5] rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-end shadow-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nombre</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:border-rose-300 outline-none" placeholder="Micheline" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Especialidad</label>
          <input value={especialidad} onChange={e => setEspecialidad(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:border-rose-300 outline-none" placeholder="Manicura & Arte" />
        </div>
        <button className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Agregar</button>
      </form>

      {loading ? <p className="text-gray-400">Cargando…</p> : (
        <div className="space-y-2">
          {estilistas.map(e => (
            <div key={e.id} className="animar-aparecer bg-white border border-[#ece8e5] rounded-2xl p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                {/* Avatar con la inicial */}
                <div className="h-9 w-9 rounded-full bg-rose-100 text-rose-700 grid place-items-center text-sm font-semibold">
                  {e.full_name ? e.full_name[0].toUpperCase() : '·'}
                </div>
                <div>
                  <div className="font-medium text-gray-800 flex items-center gap-2">
                    {e.full_name}
                    <span className={`w-2 h-2 rounded-full ${e.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <div className="text-sm text-gray-500">{e.specialty || '—'}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggle(e.id, e.is_active)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                  {e.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => borrar(e.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Borrar</button>
              </div>
            </div>
          ))}
          {estilistas.length === 0 && <p className="text-gray-400">No hay estilistas aún.</p>}
        </div>
      )}
    </AppShell>
  )
}
