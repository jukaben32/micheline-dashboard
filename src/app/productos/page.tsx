'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/AppShell'
import { useActiveBusiness } from '@/hooks/useBusiness'
import Aviso from '@/components/Aviso'

// Tipo de un producto del inventario
type Producto = {
  id: string
  name: string
  type: string | null
  description: string | null
  brand: string | null
  price: number
  cost: number | null
  stock: number | null
  sku: string | null
  is_active: boolean
}

// Página de inventario de productos
export default function ProductosPage() {
  const supabase = createClient()
  const { activeId } = useActiveBusiness()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // aviso si falla la carga

  // Campos del formulario
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('Uñas')
  const [descripcion, setDescripcion] = useState('')
  const [marca, setMarca] = useState('')
  const [precio, setPrecio] = useState('')
  const [costo, setCosto] = useState('')
  const [stock, setStock] = useState('0')
  const [sku, setSku] = useState('')

  async function cargar() {
    const { data, error: err } = await supabase.from('products').select('*').order('name')
    // Si la consulta falla, lo avisamos en vez de mostrar lista vacía
    if (err) { setError(err.message); setLoading(false); return }
    setProductos((data as Producto[]) || [])
    setLoading(false)
  }
  useEffect(() => { cargar() }, [])

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('products').insert({
      name: nombre,
      type: tipo,
      description: descripcion || null,
      brand: marca || null,
      price: parseFloat(precio) || 0,
      cost: costo ? parseFloat(costo) : null,
      business_id: activeId ?? undefined,
      stock: parseInt(stock) || 0,
      sku: sku || null,
      is_active: true,
    })
    // limpiar formulario
    setNombre(''); setTipo('Uñas'); setDescripcion(''); setMarca('')
    setPrecio(''); setCosto(''); setStock('0'); setSku('')
    cargar()
  }

  async function toggle(id: string, activo: boolean) {
    await supabase.from('products').update({ is_active: !activo }).eq('id', id)
    cargar()
  }

  async function borrar(id: string) {
    await supabase.from('products').delete().eq('id', id)
    cargar()
  }

  // Valor total del inventario
  const valorInventario = productos.reduce((s, p) => s + (p.price * (p.stock || 0)), 0)

  return (
    <AppShell titulo="Productos (Inventario)">
      {/* Aviso si la carga falló (antes se mostraba lista vacía en silencio) */}
      <Aviso mensaje={error} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Inventario de productos</h2>
        <span className="text-sm text-gray-500">Valor stock: ${valorInventario.toFixed(2)}</span>
      </div>

          {/* Formulario para agregar producto */}
          <form onSubmit={agregar} className="bg-white border border-[#ece8e5] rounded-2xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 items-end shadow-sm">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full" placeholder="Esmalte gel rojo" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full">
                <option>Uñas</option>
                <option>Cabello</option>
                <option>Piel</option>
                <option>Herramienta</option>
                <option>Belleza</option>
                <option>Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Marca</label>
              <input value={marca} onChange={e => setMarca(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full" placeholder="Gelish" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Precio $</label>
              <input value={precio} onChange={e => setPrecio(e.target.value)} required type="number" step="0.01" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full" placeholder="18" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Costo $</label>
              <input value={costo} onChange={e => setCosto(e.target.value)} type="number" step="0.01" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full" placeholder="9" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Stock</label>
              <input value={stock} onChange={e => setStock(e.target.value)} type="number" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">SKU</label>
              <input value={sku} onChange={e => setSku(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full" placeholder="GEL-RED-01" />
            </div>
            <div className="col-span-2 md:col-span-4">
              <label className="block text-xs text-gray-500 mb-1">Descripción</label>
              <input value={descripcion} onChange={e => setDescripcion(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none w-full" placeholder="Esmalte en gel rojo brillante 15ml" />
            </div>
            <button className="col-span-2 md:col-span-4 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Agregar producto</button>
          </form>

          {/* Lista de productos */}
          {loading ? <p className="text-gray-400">Cargando…</p> : (
            <div className="space-y-2">
              {productos.map(p => (
                <div key={p.id} className="bg-white border border-[#ece8e5] rounded-2xl p-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <div className="font-medium text-gray-800">{p.name} {p.brand && <span className="text-gray-400">· {p.brand}</span>}</div>
                      <div className="text-sm text-gray-500">
                        {p.type || '—'} {p.description ? `· ${p.description}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">${p.price} · {p.stock ?? 0} ud.</span>
                    <div className="flex gap-2">
                      <button onClick={() => toggle(p.id, p.is_active)} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">
                        {p.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button onClick={() => borrar(p.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Borrar</button>
                    </div>
                  </div>
                </div>
              ))}
              {productos.length === 0 && <p className="text-gray-400">No hay productos aún.</p>}
            </div>
          )}
    </AppShell>
  )
}
