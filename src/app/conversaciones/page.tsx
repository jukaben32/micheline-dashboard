'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/AppShell'
import Aviso from '@/components/Aviso'

type Msg = {
  id: string
  channel: 'whatsapp' | 'web_chat' | 'voice'
  phone: string | null
  session_id: string | null
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

const CHANNEL_LABEL: Record<Msg['channel'], string> = {
  whatsapp: '💬 WhatsApp',
  web_chat: '🌐 Chat web',
  voice: '🎙️ Llamada de voz',
}

function threadKey(m: Msg) {
  return `${m.channel}:${m.phone ?? m.session_id}`
}

export default function ConversacionesPage() {
  const supabase = createClient()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | Msg['channel']>('all')

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('id, channel, phone, session_id, role, content, created_at')
        .order('created_at', { ascending: true })
        .limit(1000)
      if (error) { setError(error.message); setLoading(false); return }
      setMsgs((data as Msg[]) ?? [])
      setLoading(false)
    })()
  }, [])

  const threads = useMemo(() => {
    const map = new Map<string, Msg[]>()
    for (const m of msgs) {
      const key = threadKey(m)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return Array.from(map.entries())
      .map(([key, items]) => ({ key, items, last: items[items.length - 1] }))
      .filter(t => filter === 'all' || t.last.channel === filter)
      .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at))
  }, [msgs, filter])

  const activeThread = threads.find(t => t.key === selected) ?? threads[0] ?? null

  return (
    <AppShell titulo="Conversaciones">
      <Aviso mensaje={error} />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Registro de conversaciones</h2>
        <div className="flex gap-1 text-xs">
          {(['all', 'whatsapp', 'web_chat', 'voice'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filter === f ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f === 'all' ? 'Todas' : CHANNEL_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="text-gray-400">Cargando…</p> : threads.length === 0 ? (
        <p className="text-gray-400">Aún no hay conversaciones registradas.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4" style={{ minHeight: '60vh' }}>
          <div className="bg-white border border-[#ece8e5] rounded-2xl overflow-y-auto" style={{ maxHeight: '75vh' }}>
            {threads.map(t => (
              <button
                key={t.key}
                onClick={() => setSelected(t.key)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${activeThread?.key === t.key ? 'bg-rose-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">{CHANNEL_LABEL[t.last.channel]}</span>
                  <span className="text-[10px] text-gray-400">{new Date(t.last.created_at).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })}</span>
                </div>
                <div className="text-sm text-gray-800 font-medium truncate mt-0.5">{t.last.phone ?? 'Visitante web'}</div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{t.last.content}</div>
              </button>
            ))}
          </div>

          <div className="bg-white border border-[#ece8e5] rounded-2xl p-5 overflow-y-auto" style={{ maxHeight: '75vh' }}>
            {activeThread ? (
              <>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div>
                    <div className="font-semibold text-gray-800">{activeThread.last.phone ?? 'Visitante web (sin teléfono)'}</div>
                    <div className="text-xs text-gray-500">{CHANNEL_LABEL[activeThread.last.channel]} · {activeThread.items.length} mensajes</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {activeThread.items.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-gray-100 text-gray-800' : 'bg-rose-600 text-white'}`}>
                        <p>{m.content}</p>
                        <p className={`text-[10px] mt-1 ${m.role === 'user' ? 'text-gray-400' : 'text-rose-100'}`}>
                          {new Date(m.created_at).toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-400">Selecciona una conversación.</p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
