import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Guarda una linea de la transcripcion de una llamada de voz en vivo, para
// que aparezca en /conversaciones. El navegador llama esto cada vez que
// OpenAI Realtime confirma una transcripcion (de quien llama o de la IA).
export async function POST(request: Request) {
  const { business_id, session_id, role, content } = await request.json().catch(() => ({}))
  if (!business_id || !session_id || !role || !content) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('conversation_messages').insert({
    business_id, session_id, role, content, channel: 'voice',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
