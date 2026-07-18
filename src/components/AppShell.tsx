'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/Sidebar'
import BusinessSwitcher from '@/components/BusinessSwitcher'

// AppShell: el "marco" común de todo el dashboard.
// Incluye la barra lateral fija y la barra superior con título, email y salir.
// Cada página solo pasa su título y su contenido -> menos código repetido.
export default function AppShell({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  const [userEmail, setUserEmail] = useState('')
  const [menuAbierto, setMenuAbierto] = useState(false) // menú lateral en móvil

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ''))
  }, [])

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra lateral fija */}
      <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />

      {/* Zona de contenido (deja espacio para la sidebar en escritorio) */}
      <div className="sm:pl-60 flex flex-col min-h-screen">
        {/* Barra superior fija */}
        <header className="sticky top-0 z-20 h-14 bg-white/80 backdrop-blur border-b border-gray-100 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Botón de menú (solo móvil) */}
            <button
              onClick={() => setMenuAbierto(true)}
              className="sm:hidden text-gray-500 hover:text-gray-800 text-xl"
              aria-label="Abrir menú"
            >
              ☰
            </button>
            <h1 className="font-semibold text-gray-800">{titulo}</h1>
          </div>

          <div className="flex items-center gap-3">
            <BusinessSwitcher />
            <span className="hidden sm:block text-sm text-gray-400">{userEmail}</span>
            {/* Avatar con la inicial del email */}
            <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-700 grid place-items-center text-sm font-semibold">
              {userEmail ? userEmail[0].toUpperCase() : '·'}
            </div>
            <button
              onClick={logout}
              className="text-xs font-medium text-gray-500 hover:text-rose-600 border border-gray-200 hover:border-rose-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              Salir
            </button>
          </div>
        </header>

        {/* Contenido de cada página */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
