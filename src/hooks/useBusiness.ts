'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase/client'

export type Profile = {
  role: 'super_admin' | 'admin' | 'staff' | null
  business_id: string | null
}

// Hook: devuelve el perfil del usuario logueado (rol y negocio).
// Lo usamos para saber si es super_admin y a qué negocio pertenece.
export function useProfile() {
  const [profile, setProfile] = useState<Profile>({ role: null, business_id: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('profiles')
        .select('role, business_id')
        .eq('id', user.id)
        .single()
      if (data) setProfile({ role: (data.role as Profile['role']) ?? null, business_id: data.business_id })
      setLoading(false)
    }
    load()
  }, [])

  return { ...profile, loading }
}

// Negocio que el usuario está "viendo" ahora mismo.
// - Si es super_admin: usa el negocio guardado en localStorage (selector), o el primero.
// - Si es admin normal: su propio business_id (fijo).
export function useActiveBusiness() {
  const { role, business_id, loading } = useProfile()
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (role === 'super_admin') {
      // super_admin: lee el negocio elegido en el selector (localStorage)
      const saved = localStorage.getItem('active_business_id')
      setActiveId(saved && saved !== 'null' ? saved : business_id)
    } else {
      // admin/staff: su negocio asignado
      setActiveId(business_id)
    }
  }, [role, business_id, loading])

  function setActive(id: string | null) {
    setActiveId(id)
    if (id) localStorage.setItem('active_business_id', id)
    else localStorage.removeItem('active_business_id')
  }

  return { role, business_id, activeId, setActive, isSuper: role === 'super_admin', loading }
}
