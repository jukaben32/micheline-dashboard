import { NextResponse } from 'next/server'

// Ejecuta las herramientas que la IA de voz pide durante la llamada
// (check_availability / book_appointment), reutilizando las mismas Edge
// Functions ya probadas del widget de reserva (get-availability /
// create-booking) — misma logica de negocio para los 3 canales
// (web, WhatsApp, voz), sin duplicarla.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const { name, arguments: args } = await request.json()

  try {
    if (name === 'check_availability') {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ service_id: args.service_id, date: args.date, stylist_id: args.stylist_id ?? null }),
      })
      return NextResponse.json(await res.json())
    }

    if (name === 'book_appointment') {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({
          service_id: args.service_id,
          stylist_id: args.stylist_id ?? null,
          date: args.date,
          time: args.time,
          client_name: args.client_name,
          client_phone: args.client_phone,
        }),
      })
      return NextResponse.json(await res.json())
    }

    return NextResponse.json({ error: `Herramienta desconocida: ${name}` }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
