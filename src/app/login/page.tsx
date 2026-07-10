'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Pagina de login: email+password y Google
export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loginEmail(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else router.push('/')
  }

  async function loginGoogle() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-rose-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-rose-900 mb-1">Micheline</h1>
        <p className="text-center text-sm text-gray-500 mb-6">Panel de administración</p>

        <button
          onClick={loginGoogle}
          disabled={loading}
          className="w-full mb-4 py-2.5 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>🔵</span> Entrar con Google
        </button>

        <div className="flex items-center gap-2 my-4 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-200" /> o con email <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={loginEmail} className="space-y-3">
          <input
            type="email" required placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-rose-400"
          />
          <input
            type="password" required placeholder="Contraseña"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-rose-400"
          />
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {error && <p className="mt-3 text-xs text-red-600 text-center">{error}</p>}
        <div className="mt-4 flex flex-col items-center gap-1 text-[11px] text-center text-gray-400">
          <Link href="/registro" className="text-rose-600 font-medium">¿No tienes cuenta? Regístrate</Link>
          <Link href="/recuperar" className="hover:text-rose-600">Olvidé mi contraseña</Link>
        </div>
      </div>
    </main>
  )
}
