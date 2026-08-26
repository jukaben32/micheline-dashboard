'use client'

import { useMemo, useState } from 'react'
import type { Business, Product } from '@/types/site'

export default function ProductsModal({ business, products, onClose }: { business: Business; products: Product[]; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [order, setOrder] = useState<'name' | 'price_asc' | 'price_desc'>('name')
  const [onlyAvailable, setOnlyAvailable] = useState(false)

  const types = useMemo(() => Array.from(new Set(products.map(p => p.type).filter(Boolean))) as string[], [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => {
      if (onlyAvailable && p.stock <= 0) return false
      if (type && p.type !== type) return false
      if (q && !`${p.name} ${p.description ?? ''} ${p.brand ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
    if (order === 'price_asc') list = [...list].sort((a, b) => a.price - b.price)
    else if (order === 'price_desc') list = [...list].sort((a, b) => b.price - a.price)
    else list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [products, q, type, order, onlyAvailable])

  return (
    <div id="products-overlay" className="active" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div id="products-modal" role="dialog" aria-label={`Catálogo de productos ${business.name}`}>
        <div id="bm-header">
          <div>
            <h2>{business.name} · Tienda</h2>
            <p>Productos de belleza</p>
          </div>
          <button id="bm-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div id="products-body">
          <div className="prod-filters">
            <input type="text" placeholder="Buscar producto..." value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Todos los tipos</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={order} onChange={(e) => setOrder(e.target.value as typeof order)}>
              <option value="name">Nombre A-Z</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
            </select>
            <label>
              <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
              Solo disponibles
            </label>
          </div>
          <p className="prod-count">{filtered.length} producto{filtered.length !== 1 ? 's' : ''}</p>
          <div className="prod-grid">
            {filtered.map((p) => {
              const waHref = business.phone
                ? `https://wa.me/${business.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, quiero consultar por: ${p.name}`)}`
                : undefined
              return (
                <div key={p.id} className="prod-card">
                  {p.type && <span className="prod-type">{p.type}</span>}
                  <div className="prod-name">{p.name}</div>
                  {p.description && <div className="prod-desc">{p.description}</div>}
                  <div className="prod-foot">
                    <span className="prod-price">${Number(p.price).toFixed(2)}</span>
                    <span className={`prod-stock ${p.stock <= 0 ? 'out' : p.stock <= 3 ? 'low' : ''}`}>
                      {p.stock > 0 ? `${p.stock} en stock` : 'Agotado'}
                    </span>
                  </div>
                  <a href={waHref} target="_blank" rel="noreferrer" className="prod-wa" aria-disabled={!waHref}>
                    💬 Consultar por WhatsApp
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
