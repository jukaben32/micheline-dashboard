'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// Pagina de recuperacion de contrasena (Supabase envia el link por email)
export default function RecuperarPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErr(''); setMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://micheline-dashboard.vercel.app/'
    })
    if (error) setErr(error.message)
    else setMsg('Te enviamos un enlace de recuperación a tu correo.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={enviar} className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-rose-700 text-center">🔑 Recuperar contraseña</h1>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
          placeholder="tu@correo.com" className="w-full border rounded-lg px-3 py-2 text-sm" />
        {err && <p className="text-red-600 text-xs">{err}</p>}
        {msg && <p className="text-green-600 text-xs">{msg}</p>}
        <button disabled={loading}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </button>
        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="text-rose-600 font-medium">Volver al login</Link>
        </p>
      </form>
    </div>
  )
}
