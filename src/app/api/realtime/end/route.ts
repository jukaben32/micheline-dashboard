import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Registra la duracion de una llamada de voz terminada, para /metricas.
// No calculamos un costo estimado en dolares aqui: el precio real de audio
// de la Realtime API de OpenAI depende de una mezcla de tokens de entrada/
// salida por segundo que no podemos derivar con precision solo de la
// duracion — mejor mostrar minutos reales que un numero de costo inventado.
// El costo exacto se revisa en platform.openai.com/usage.
export async function POST(request: Request) {
  const { business_id, seconds } = await request.json().catch(() => ({}))
  if (!business_id || typeof seconds !== 'number') {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('api_usage_events').insert({
    business_id, provider: 'openai_realtime', event_type: 'voice_call', seconds,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
