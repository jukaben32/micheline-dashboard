'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Pagina de registro: el cliente crea su cuenta de admin
export default function RegistroPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function registrar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(''); setMsg('')
    // Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email, password: pass,
      options: { emailRedirectTo: 'https://micheline-dashboard.vercel.app/' }
    })
    if (error) {
      setErr(error.message)
    } else if (data.user) {
      // Si Supabase no exige confirmacion, el usuario ya queda logueado
      if (data.session) {
        router.push('/')
      } else {
        setMsg('Cuenta creada. Revisa tu correo para confirmar (o entra si no se pide confirmacion).')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={registrar} className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-rose-700 text-center">💅 Crear cuenta</h1>
        <p className="text-sm text-gray-500 text-center">Regístrate para administrar Micheline</p>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
          placeholder="tu@correo.com" className="w-full border rounded-lg px-3 py-2 text-sm" />
        <input value={pass} onChange={e => setPass(e.target.value)} type="password" required minLength={6}
          placeholder="Contraseña (mín 6)" className="w-full border rounded-lg px-3 py-2 text-sm" />
        {err && <p className="text-red-600 text-xs">{err}</p>}
        {msg && <p className="text-green-600 text-xs">{msg}</p>}
        <button disabled={loading}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          {loading ? 'Creando…' : 'Crear cuenta'}
        </button>
        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta? <Link href="/login" className="text-rose-600 font-medium">Entrar</Link>
        </p>
      </form>
    </div>
  )
}
