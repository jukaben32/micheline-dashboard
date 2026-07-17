'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Menú lateral compartido por todas las páginas del dashboard.
// usePathname resalta la sección activa.

const items = [
  { href: '/', label: 'Citas', icon: '📅', match: '/' },
  { href: '/servicios', label: 'Servicios', icon: '💅', match: '/servicios' },
  { href: '/estilistas', label: 'Estilistas', icon: '👩‍🎨', match: '/estilistas' },
  { href: '/marcas', label: 'Marcas', icon: '🏷️', match: '/marcas' },
  { href: '/productos', label: 'Productos', icon: '📦', match: '/productos' },
  { href: '/clientes', label: 'Clientes', icon: '👥', match: '/clientes' },
  { href: '/metricas', label: 'Métricas', icon: '📊', match: '/metricas' },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <nav className="w-52 bg-white border-r border-gray-100 min-h-[calc(100vh-49px)] p-4 text-sm hidden sm:block">
      {/* Título de sección del menú */}
      <p className="px-2 mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Navegación
      </p>

      <div className="space-y-1">
        {items.map((it) => {
          const activo = pathname === it.match || (it.match !== '/' && pathname.startsWith(it.match))
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ${
                activo
                  ? 'bg-rose-50 text-rose-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {/* Barrita indicadora del elemento activo */}
              {activo && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-rose-600" />
              )}
              <span className="text-base leading-none">{it.icon}</span>
              <span>{it.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
