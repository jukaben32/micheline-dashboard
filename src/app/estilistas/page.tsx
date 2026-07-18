'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/AppShell'

// Tipo de datos de un estilista (incluye la foto y contacto interno)
type Estilista = {
  id: string
  full_name: string
  specialty: string | null
  photo_url: string | null
  email: string | null
  whatsapp: string | null
  is_active: boolean
}

// Bucket de Supabase Storage donde guardamos las fotos
const BUCKET = 'stylists'

// Página de gestión de estilistas
export default function EstilistasPage() {
  const supabase = createClient()
  const [estilistas, setEstilistas] = useState<Estilista[]>([])
  const [nombre, setNombre] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [foto, setFoto] = useState<File | null>(null) // archivo seleccionado
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false) // evita doble click mientras sube
  const inputFoto = useRef<HTMLInputElement>(null)

  // Carga la lista de estilistas al abrir la página
  async function cargar() {
    const { data } = await supabase.from('stylists').select('*').order('full_name')
    setEstilistas((data as Estilista[]) || [])
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  // Sube la foto al bucket y devuelve la URL pública (o null si no hay foto)
  async function subirFoto(archivo: File, idEstilista: string): Promise<string | null> {
    // Extension del archivo (png, jpg, webp...)
    const ext = archivo.name.split('.').pop()?.toLowerCase() || 'jpg'
    const ruta = `${idEstilista}.${ext}` // una foto por estilista, misma ruta = la reemplaza
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(ruta, archivo, { upsert: true, contentType: archivo.type })
    if (error) throw error
    // Obtenemos la URL pública para mostrarla en la web
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta)
    return data.publicUrl
  }

  // Agrega un estilista (con su foto si se seleccionó)
  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (guardando) return
    setGuardando(true)
    try {
      // 1) Insertamos primero para obtener el id
      const { data, error } = await supabase
        .from('stylists')
        .insert({ full_name: nombre, specialty: especialidad || null, email: email || null, whatsapp: whatsapp || null, is_active: true })
        .select('id')
        .single()
      if (error) throw error
      const id = (data as { id: string }).id

      // 2) Si hay foto, la subimos y guardamos la URL
      if (foto) {
        const url = await subirFoto(foto, id)
        if (url) {
          await supabase.from('stylists').update({ photo_url: url }).eq('id', id)
        }
      }

      // 3) Limpiamos el formulario
      setNombre(''); setEspecialidad(''); setEmail(''); setWhatsapp(''); setFoto(null)
      if (inputFoto.current) inputFoto.current.value = ''
      cargar()
    } catch (err) {
      alert('No se pudo guardar el estilista: ' + (err as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  // Activa/desactiva un estilista
  async function toggle(id: string, activo: boolean) {
    await supabase.from('stylists').update({ is_active: !activo }).eq('id', id)
    cargar()
  }

  // Borra un estilista y su foto del bucket
  async function borrar(id: string, fotoUrl: string | null) {
    if (!confirm('¿Borrar este estilista?')) return
    // Borramos la foto del storage si existe
    if (fotoUrl) {
      const ruta = fotoUrl.split('/').pop() // nombre del archivo al final de la URL
      if (ruta) await supabase.storage.from(BUCKET).remove([ruta])
    }
    await supabase.from('stylists').delete().eq('id', id)
    cargar()
  }

  return (
    <AppShell titulo="Estilistas">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Equipo de estilistas</h2>

      {/* Formulario para agregar estilista (con foto) */}
      <form onSubmit={agregar} className="animar-aparecer bg-white border border-[#ece8e5] rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-end shadow-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nombre</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:border-rose-300 outline-none" placeholder="Micheline" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Especialidad</label>
          <input value={especialidad} onChange={e => setEspecialidad(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:border-rose-300 outline-none" placeholder="Manicura & Arte" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:border-rose-300 outline-none" placeholder="nombre@email.com" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">WhatsApp</label>
          <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:border-rose-300 outline-none" placeholder="18096277471" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Foto</label>
          <input ref={inputFoto} type="file" accept="image/*" onChange={e => setFoto(e.target.files?.[0] || null)} className="block text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-rose-50 file:text-rose-600 file:text-sm file:cursor-pointer" />
        </div>
        <button disabled={guardando} className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {guardando ? 'Guardando…' : 'Agregar'}
        </button>
      </form>

      {loading ? <p className="text-gray-400">Cargando…</p> : (
        <div className="space-y-2">
          {estilistas.map(e => (
            <div key={e.id} className="animar-aparecer bg-white border border-[#ece8e5] rounded-2xl p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                {/* Foto del estilista (o inicial si no tiene) */}
                {e.photo_url ? (
                  <img src={e.photo_url} alt={e.full_name} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-rose-100 text-rose-700 grid place-items-center text-sm font-semibold">
                    {e.full_name ? e.full_name[0].toUpperCase() : '·'}
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-800 flex items-center gap-2">
                    {e.full_name}
                    <span className={`w-2 h-2 rounded-full ${e.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <div className="text-sm text-gray-500">{e.specialty || '—'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {e.email && <span className="mr-3">✉️ {e.email}</span>}
                    {e.whatsapp && <span>📱 {e.whatsapp}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggle(e.id, e.is_active)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                  {e.is_active ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => borrar(e.id, e.photo_url)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Borrar</button>
              </div>
            </div>
          ))}
          {estilistas.length === 0 && <p className="text-gray-400">No hay estilistas aún.</p>}
        </div>
      )}
    </AppShell>
  )
}
