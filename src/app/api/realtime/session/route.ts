import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildSystemPrompt, REALTIME_TOOLS } from '@/lib/realtime/tools'

// Modelo Realtime de OpenAI. gpt-realtime es el modelo GA confirmado y en
// uso real (ver EstetiCall) — el usuario menciono "GPT-5.6 Luna" pero no es
// un nombre de modelo que se pueda confirmar; queda como env var para que
// se ajuste sin tocar codigo en cuanto se confirme el nombre real contra la
// cuenta de OpenAI.
const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? 'gpt-realtime'

// Este endpoint mintea una sesion real de OpenAI Realtime en cada llamada
// (tiene costo). Rate limit por IP via rate_limit_log, mismo mecanismo que
// create-booking/chat.
const MAX_SESSIONS_PER_HOUR = 5

function getClientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(request: Request) {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    return NextResponse.json(
      { error: 'not_configured', message: 'La llamada de voz con IA aun no esta activada.' },
      { status: 503 },
    )
  }

  const { business_id } = await request.json().catch(() => ({}))
  if (!business_id) {
    return NextResponse.json({ error: 'Falta business_id' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const ip = getClientIp(request)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: hits } = await supabase.from('rate_limit_log')
    .select('id', { count: 'exact', head: true })
    .eq('fn', 'realtime-session').eq('rate_key', ip).gte('created_at', oneHourAgo)
  if ((hits ?? 0) >= MAX_SESSIONS_PER_HOUR) {
    return NextResponse.json({ error: 'Demasiadas llamadas. Intenta de nuevo mas tarde.' }, { status: 429 })
  }
  await supabase.from('rate_limit_log').insert({ fn: 'realtime-session', rate_key: ip })

  const { data: business } = await supabase.from('business').select('id, name').eq('id', business_id).maybeSingle()
  if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  const [{ data: services }, { data: stylists }] = await Promise.all([
    supabase.from('services').select('id, name, duration_min, price').eq('business_id', business_id).eq('is_active', true),
    supabase.from('stylists').select('id, full_name, specialty').eq('business_id', business_id).eq('is_active', true),
  ])

  const systemPrompt = buildSystemPrompt({
    name: business.name,
    services: services ?? [],
    stylists: stylists ?? [],
  })

  const turnDetection = {
    type: 'server_vad',
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 500,
  }

  const openaiRes = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session: {
        type: 'realtime',
        model: OPENAI_REALTIME_MODEL,
        instructions: systemPrompt,
        tools: REALTIME_TOOLS,
        audio: {
          output: { voice: 'alloy' },
          // La transcripcion del lado del que llama viene apagada por
          // default en la API GA de OpenAI; whisper-1 es el unico modelo
          // que acepta el hint de idioma (evita sesgo a ingles en audio
          // en español).
          input: { turn_detection: turnDetection, transcription: { model: 'whisper-1', language: 'es' } },
        },
      },
    }),
  })

  if (!openaiRes.ok) {
    const detail = await openaiRes.text()
    return NextResponse.json({ error: `OpenAI Realtime error: ${detail}` }, { status: 502 })
  }

  const session = await openaiRes.json()
  return NextResponse.json({
    business_id,
    businessName: business.name,
    model: OPENAI_REALTIME_MODEL,
    clientSecret: session.value,
    expiresAt: session.expires_at,
  })
}
