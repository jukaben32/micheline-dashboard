'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Menú lateral compartido por todas las páginas del dashboard.
// usePathname resalta la sección activa.

const items = [
  { href: '/', label: '📅 Citas', match: '/' },
  { href: '/servicios', label: '💅 Servicios', match: '/servicios' },
  { href: '/estilistas', label: '👩‍🎨 Estilistas', match: '/estilistas' },
  { href: '/marcas', label: '🏷️ Marcas', match: '/marcas' },
  { href: '/productos', label: '📦 Productos', match: '/productos' },
  { href: '/clientes', label: '👥 Clientes', match: '/clientes' },
  { href: '/metricas', label: '📊 Métricas', match: '/metricas' },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <nav className="w-48 bg-white border-r min-h-[calc(100vh-49px)] p-3 text-sm hidden sm:block">
      {items.map((it) => {
        const activo = pathname === it.match || (it.match !== '/' && pathname.startsWith(it.match))
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`block px-3 py-2 rounded ${activo ? 'bg-rose-50 text-rose-700 font-medium' : 'hover:bg-gray-100'}`}
          >
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
