'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'

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
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-rose-700 to-rose-500 text-white px-4 py-3 font-bold shadow-sm">💅 Micheline · Estilistas</header>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-xl font-semibold text-gray-800 mb-4">Equipo de estilistas</h1>

          <form onSubmit={agregar} className="bg-white border rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end shadow-sm">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} required className="border rounded px-3 py-1.5 text-sm w-48" placeholder="Micheline" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Especialidad</label>
              <input value={especialidad} onChange={e => setEspecialidad(e.target.value)} className="border rounded px-3 py-1.5 text-sm w-48" placeholder="Manicura & Arte" />
            </div>
            <button className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded text-sm">Agregar</button>
          </form>

          {loading ? <p className="text-gray-400">Cargando…</p> : (
            <div className="space-y-2">
              {estilistas.map(e => (
                <div key={e.id} className="bg-white border rounded-lg p-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${e.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="font-medium text-gray-800">{e.full_name}</span>
                    <span className="text-sm text-gray-500">{e.specialty}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggle(e.id, e.is_active)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">
                      {e.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button onClick={() => borrar(e.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Borrar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
