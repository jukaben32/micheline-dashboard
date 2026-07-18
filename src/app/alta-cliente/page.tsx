'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { useProfile } from '@/hooks/useBusiness'

// Pagina para que el SUPER ADMIN de alta un nuevo cliente (negocio + su usuario admin).
// Flujo: crea el negocio, crea el usuario en Auth y le asigna perfil de admin.
export default function AltaClientePage() {
  const supabase = createClient()
  const router = useRouter()
  const { role, loading } = useProfile()

  const [nombreNegocio, setNombreNegocio] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Si ya cargó el perfil y no es super_admin, lo sacamos
  if (!loading && role !== 'super_admin') {
    if (typeof window !== 'undefined') router.replace('/')
    return null
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true); setErr(''); setMsg('')
    try {
      // 1) Crear el negocio (el super_admin puede insertar en business)
      const { data: negocio, error: eNeg } = await supabase
        .from('business')
        .insert({ name: nombreNegocio })
        .select('id')
        .single()
      if (eNeg) throw eNeg
      const businessId = (negocio as { id: string }).id

      // 2) Crear el usuario admin en Auth
      const { data: authData, error: eAuth } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { emailRedirectTo: 'https://micheline-dashboard.vercel.app/' },
      })
      if (eAuth) throw eAuth
      if (!authData.user) throw new Error('No se pudo crear el usuario')

      // 3) El trigger handle_new_user ya creo el perfil al registrar el usuario.
      //    Lo actualizamos para asignarle el negocio y rol de admin.
      const { error: ePerfil } = await supabase
        .from('profiles')
        .update({ role: 'admin', business_id: businessId, full_name: nombreNegocio })
        .eq('id', authData.user.id)
      if (ePerfil) throw ePerfil

      setMsg(`Cliente "${nombreNegocio}" creado. El admin debe confirmar su email (${email}) para entrar.`)
      setNombreNegocio(''); setEmail(''); setPass('')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <AppShell titulo="Alta de cliente"><p className="text-gray-400">Cargando…</p></AppShell>

  return (
    <AppShell titulo="Alta de cliente">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Registrar un nuevo negocio</h2>
      <form onSubmit={crear} className="bg-white border border-[#ece8e5] rounded-2xl p-5 max-w-md space-y-4 shadow-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nombre del negocio</label>
          <input value={nombreNegocio} onChange={e => setNombreNegocio(e.target.value)} required
            placeholder="Salón Ejemplo" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email del admin</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
            placeholder="admin@negocio.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Contraseña temporal (mín 6)</label>
          <input value={pass} onChange={e => setPass(e.target.value)} type="password" required minLength={6}
            placeholder="••••••" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-rose-300 outline-none" />
        </div>
        {err && <p className="text-red-600 text-xs">{err}</p>}
        {msg && <p className="text-green-600 text-xs">{msg}</p>}
        <button disabled={guardando}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          {guardando ? 'Creando…' : 'Crear cliente'}
        </button>
        <p className="text-xs text-gray-400">Solo el super admin puede usar esta página.</p>
      </form>
    </AppShell>
  )
}
