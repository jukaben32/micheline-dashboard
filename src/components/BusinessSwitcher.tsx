'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'
import { useActiveBusiness } from '../hooks/useBusiness'

// Selector de negocio para el super_admin.
// Solo se muestra si el usuario es super_admin. Permite elegir qué
// cliente (negocio) está viendo en el dashboard.
export default function BusinessSwitcher() {
  const { isSuper, activeId, setActive, loading } = useActiveBusiness()
  const [negocios, setNegocios] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (!isSuper) return
    const supabase = createClient()
    supabase.from('business').select('id, name').order('name').then(({ data }) => {
      if (data) setNegocios(data as { id: string; name: string }[])
    })
  }, [isSuper])

  if (loading || !isSuper) return null

  return (
    <select
      value={activeId ?? ''}
      onChange={(e) => setActive(e.target.value || null)}
      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 max-w-[160px]"
      title="Ver datos de otro cliente (solo super admin)"
    >
      <option value="">— Todos los negocios —</option>
      {negocios.map((n) => (
        <option key={n.id} value={n.id}>{n.name}</option>
      ))}
    </select>
  )
}
