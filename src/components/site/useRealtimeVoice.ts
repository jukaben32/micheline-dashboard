'use client'

import { useCallback, useRef, useState } from 'react'

// Cliente WebRTC para la Realtime API de OpenAI. El audio viaja directo
// entre el navegador y OpenAI (peer-to-peer) — este servidor solo mintea
// un token efimero de sesion (/api/realtime/session), ejecuta las
// herramientas que la IA pida (/api/realtime/tools), y registra la
// transcripcion + duracion (/api/realtime/message, /api/realtime/end)
// para /conversaciones y /metricas. La clave real de OpenAI nunca llega
// al navegador.
const REALTIME_URL = 'https://api.openai.com/v1/realtime/calls'
const MAX_CALL_MS = 5 * 60 * 1000 // corte de seguridad: 5 min por llamada

export type VoiceStatus = 'idle' | 'connecting' | 'active' | 'ending' | 'error'

function saveTranscript(businessId: string, sessionId: string, role: 'user' | 'assistant', content: string) {
  fetch('/api/realtime/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ business_id: businessId, session_id: sessionId, role, content }),
  }).catch(() => {})
}

export function useRealtimeVoice() {
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionRef = useRef<{ businessId: string; sessionId: string; startedAt: number } | null>(null)

  const endCall = useCallback(() => {
    setStatus('ending')
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    dcRef.current?.close()
    pcRef.current?.close()
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioRef.current?.remove()
    pcRef.current = null
    dcRef.current = null

    const active = sessionRef.current
    if (active) {
      const seconds = (Date.now() - active.startedAt) / 1000
      fetch('/api/realtime/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: active.businessId, seconds }),
      }).catch(() => {})
      sessionRef.current = null
    }

    setStatus('idle')
  }, [])

  const startCall = useCallback(async (businessId: string) => {
    try {
      setError(null)
      setStatus('connecting')

      const res = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message || body?.error || `No se pudo iniciar la llamada (${res.status})`)
      }
      const session = await res.json()
      const sessionId = crypto.randomUUID()
      sessionRef.current = { businessId, sessionId, startedAt: Date.now() }

      const pc = new RTCPeerConnection()
      pcRef.current = pc

      const audioEl = document.createElement('audio')
      audioEl.autoplay = true
      audioRef.current = audioEl
      pc.ontrack = (event) => { audioEl.srcObject = event.streams[0] }

      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = micStream
      micStream.getTracks().forEach(track => pc.addTrack(track, micStream))

      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      dc.addEventListener('open', () => {
        // server_vad no habla primero por si sola; forzamos un saludo inicial.
        dc.send(JSON.stringify({ type: 'response.create' }))
      })

      dc.addEventListener('message', async (event) => {
        const msg = JSON.parse(event.data)

        if (msg.type === 'response.function_call_arguments.done') {
          const args = JSON.parse(msg.arguments || '{}')
          const toolRes = await fetch('/api/realtime/tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: msg.name, arguments: args }),
          }).then(r => r.json()).catch((e) => ({ error: String(e) }))

          dc.send(JSON.stringify({
            type: 'conversation.item.create',
            item: { type: 'function_call_output', call_id: msg.call_id, output: JSON.stringify(toolRes) },
          }))
          dc.send(JSON.stringify({ type: 'response.create' }))
        }

        // Transcripcion de lo que dice la asistente.
        if (msg.type === 'response.output_audio_transcript.done' && msg.transcript) {
          saveTranscript(businessId, sessionId, 'assistant', msg.transcript)
        }
        // Transcripcion de lo que dice quien llama.
        if (msg.type === 'conversation.item.input_audio_transcription.completed' && msg.transcript) {
          saveTranscript(businessId, sessionId, 'user', msg.transcript)
        }
      })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpRes = await fetch(`${REALTIME_URL}?model=${session.model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: { Authorization: `Bearer ${session.clientSecret}`, 'Content-Type': 'application/sdp' },
      })
      if (!sdpRes.ok) throw new Error('No se pudo conectar la llamada con OpenAI')

      await pc.setRemoteDescription({ type: 'answer', sdp: await sdpRes.text() })
      setStatus('active')

      timeoutRef.current = setTimeout(endCall, MAX_CALL_MS)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la llamada')
    }
  }, [endCall])

  return { status, error, startCall, endCall }
}
