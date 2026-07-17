'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Menú lateral fijo del dashboard.
// En escritorio siempre visible; en móvil se abre/cierra con "abierto".

const items = [
  { href: '/', label: 'Citas', icon: '📅', match: '/' },
  { href: '/servicios', label: 'Servicios', icon: '💅', match: '/servicios' },
  { href: '/estilistas', label: 'Estilistas', icon: '👩‍🎨', match: '/estilistas' },
  { href: '/marcas', label: 'Marcas', icon: '🏷️', match: '/marcas' },
  { href: '/productos', label: 'Productos', icon: '📦', match: '/productos' },
  { href: '/clientes', label: 'Clientes', icon: '👥', match: '/clientes' },
  { href: '/metricas', label: 'Métricas', icon: '📊', match: '/metricas' },
]

export default function Sidebar({
  abierto = false,
  onCerrar,
}: {
  abierto?: boolean
  onCerrar?: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Fondo oscuro al abrir el menú en móvil */}
      {abierto && (
        <div
          onClick={onCerrar}
          className="fixed inset-0 z-30 bg-black/30 sm:hidden"
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-100 flex flex-col
          transition-transform duration-200
          ${abierto ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}
      >
        {/* Marca */}
        <div className="h-14 flex items-center gap-2 px-5 border-b border-gray-100">
          <span className="text-xl">💅</span>
          <span className="font-bold text-gray-800">Micheline</span>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-rose-400 font-semibold">Panel</span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-3 text-sm overflow-y-auto">
          <p className="px-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Navegación
          </p>
          <div className="space-y-1">
            {items.map((it) => {
              const activo = pathname === it.match || (it.match !== '/' && pathname.startsWith(it.match))
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={onCerrar}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ${
                    activo
                      ? 'bg-rose-50 text-rose-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
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

        {/* Pie */}
        <div className="p-4 text-[11px] text-gray-300 border-t border-gray-100">
          Micheline Nail Bar
        </div>
      </aside>
    </>
  )
}
