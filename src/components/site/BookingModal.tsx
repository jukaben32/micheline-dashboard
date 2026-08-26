'use client'

import { useEffect, useRef, useState } from 'react'
import type { Business, Service, Stylist } from '@/types/site'

// Web Speech API no tiene tipos oficiales en TS/DOM lib todavia.
type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null
  onerror: ((e: unknown) => void) | null
  onend: (() => void) | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const DOW = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function svcIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes('pedi') || n.includes('pie')) return '🦶'
  if (n.includes('pelo') || n.includes('cabello') || n.includes('hair')) return '✂️'
  if (n.includes('cera') || n.includes('depil')) return '🌿'
  if (n.includes('art') || n.includes('deco')) return '🎨'
  return '💅'
}

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

type ChatMsg = { role: 'user' | 'assistant'; content: string }

export default function BookingModal({ business, services, stylists, onClose }: {
  business: Business
  services: Service[]
  stylists: Stylist[]
  onClose: () => void
}) {
  const [tab, setTab] = useState<'book' | 'chat'>('book')
  const [step, setStep] = useState(1)

  const [service, setService] = useState<Service | null>(null)
  const [stylist, setStylist] = useState<Stylist | null>(null) // null = "cualquiera"
  const [stylistPicked, setStylistPicked] = useState(false)
  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<string | null>(null)

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: `¡Hola! 💅 Soy la asistente de ${business.name}. Pregúntame sobre precios, servicios, estilistas u horarios.` },
  ])
  const [chatText, setChatText] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  // Dictado por voz: mantener presionado el micro transcribe lo que dices
  // y lo envia automaticamente (API nativa del navegador, no llamada real).
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SpeechRecognitionCtor = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return
    const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'es-DO'
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      sendChat(transcript)
    }
    recognition.onerror = () => setRecording(false)
    recognition.onend = () => setRecording(false)
    recognitionRef.current = recognition
    setVoiceSupported(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startVoice() {
    if (!recognitionRef.current) return
    if (!recording) {
      setRecording(true)
      try { recognitionRef.current.start() } catch { /* ya estaba grabando */ }
    }
  }
  function stopVoice() {
    if (recognitionRef.current && recording) recognitionRef.current.stop()
  }

  async function pickDate(d: string) {
    setDate(d)
    setTime(null)
    setSlots([])
    if (!service) return
    setLoadingSlots(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ stylist_id: stylist?.id ?? null, date: d, service_id: service.id }),
      })
      const data = await res.json()
      setSlots(Array.isArray(data.slots) ? data.slots : [])
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  async function confirmBooking() {
    if (!name || !phone) { setError('Por favor completa tu nombre y teléfono.'); return }
    if (website) { // honeypot: bot detectado, fingimos exito
      setSuccess(`¡Gracias ${name}! Te esperamos.`)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({
          stylist_id: stylist?.id ?? null,
          service_id: service?.id,
          price: service?.price ?? 0,
          date,
          time,
          client_name: name,
          client_phone: phone,
          client_email: email,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo crear la reserva')
      setSuccess(`¡Reserva confirmada, ${name}! Tu cita: ${service?.name} el ${date} a las ${time}.`)
      if (business.phone) {
        const msg = `Nueva reserva: ${name} · ${service?.name} · ${date} ${time} · Tel: ${phone}`
        setTimeout(() => window.open(`https://wa.me/${business.phone!.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank'), 800)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al reservar')
    } finally {
      setSubmitting(false)
    }
  }

  async function sendChat(override?: string) {
    const text = (override ?? chatText).trim()
    if (!text || chatSending) return
    setChatText('')
    const history = [...chatMessages, { role: 'user' as const, content: text }]
    setChatMessages(history)
    setChatSending(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ message: text, history, business_id: business.id }),
      })
      const data = await res.json()
      setChatMessages(h => [...h, { role: 'assistant', content: data.reply || 'No pude responder ahora.' }])
    } catch {
      setChatMessages(h => [...h, { role: 'assistant', content: 'Hubo un error, intenta de nuevo.' }])
    } finally {
      setChatSending(false)
    }
  }

  function goNext() {
    if (step === 4) { confirmBooking(); return }
    setStep(s => s + 1)
  }
  function goBack() { setStep(s => Math.max(1, s - 1)) }

  const canNext = step === 1 ? !!service : step === 2 ? stylistPicked : step === 3 ? !!(date && time) : true

  // Calendario
  const firstDow = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div id="booking-overlay" className="active" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div id="booking-modal" role="dialog" aria-label={`Reservar cita ${business.name}`}>
        <div id="bm-header">
          <div>
            <h2>{business.name}</h2>
            <p>Reserva tu momento de belleza</p>
          </div>
          <button id="bm-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div id="bm-tabs">
          <button className={`bm-tab ${tab === 'book' ? 'active' : ''}`} onClick={() => setTab('book')}>📅 Reservar</button>
          <button className={`bm-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>💬 Asistente</button>
        </div>

        {tab === 'book' && !success && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div id="bm-steps">
              {['Servicio', 'Estilista', 'Fecha & Hora', 'Confirmar'].map((label, i) => (
                <div key={label} className={`bm-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
                  <span className="bm-step-num">{i + 1}</span>{label}
                </div>
              ))}
            </div>

            <div id="bm-body">
              {step === 1 && (
                <div>
                  <h3 className="site-font-serif text-xl mb-1">¿Qué servicio deseas?</h3>
                  <p className="text-sm mb-6" style={{ color: 'var(--site-muted)' }}>Selecciona uno de nuestros tratamientos</p>
                  {services.map((s) => (
                    <div key={s.id} className={`service-card ${service?.id === s.id ? 'sel' : ''}`} onClick={() => setService(s)}>
                      <div className="icon">{svcIcon(s.name)}</div>
                      <div className="info">
                        <div className="name">{s.name}</div>
                        <div className="dur">{s.duration_min} min</div>
                      </div>
                      <div className="price">${Number(s.price).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div>
                  <h3 className="site-font-serif text-xl mb-1">¿Con quién quieres tu cita?</h3>
                  <p className="text-sm mb-6" style={{ color: 'var(--site-muted)' }}>Elige tu estilista favorita o deja que asignemos la disponible</p>
                  <div className="stylist-grid">
                    <div className={`stylist-card ${!stylist && stylistPicked ? 'sel' : ''}`} onClick={() => { setStylist(null); setStylistPicked(true) }}>
                      <div className="avatar">🎲</div>
                      <div className="sname">Cualquiera</div>
                      <div className="spec">disponible</div>
                    </div>
                    {stylists.map((st) => (
                      <div key={st.id} className={`stylist-card ${stylist?.id === st.id ? 'sel' : ''}`} onClick={() => { setStylist(st); setStylistPicked(true) }}>
                        <div className="avatar">{st.full_name.slice(0, 1).toUpperCase()}</div>
                        <div className="sname">{st.full_name}</div>
                        {st.specialty && <div className="spec">{st.specialty}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h3 className="site-font-serif text-xl mb-1">Elige fecha y hora</h3>
                  <p className="text-sm mb-6" style={{ color: 'var(--site-muted)' }}>Selecciona un día disponible y el horario que prefieras</p>
                  <div id="bm-cal-wrap">
                    <div>
                      <div className="cal-header">
                        <button className="cal-nav" onClick={() => { const m = calMonth - 1; if (m < 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m) }}>‹</button>
                        <span>{MONTHS[calMonth]} {calYear}</span>
                        <button className="cal-nav" onClick={() => { const m = calMonth + 1; if (m > 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m) }}>›</button>
                      </div>
                      <div className="cal-grid">
                        {DOW.map(d => <div key={d} className="cal-dow">{d}</div>)}
                        {cells.map((day, i) => {
                          if (day === null) return <div key={i} className="cal-day empty" />
                          const ds = toDateStr(calYear, calMonth, day)
                          const isPast = ds < todayStr
                          return (
                            <button
                              key={i}
                              className={`cal-day ${ds === todayStr ? 'today' : ''} ${ds === date ? 'sel' : ''} ${isPast ? 'past' : ''}`}
                              disabled={isPast}
                              onClick={() => pickDate(ds)}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div id="bm-slots-wrap">
                      <h4>{date ? `Horarios — ${date}` : 'Selecciona una fecha'}</h4>
                      <div className="slots-grid">
                        {loadingSlots && <div className="slot-empty">Cargando horarios...</div>}
                        {!loadingSlots && date && slots.length === 0 && <div className="slot-empty">Sin horarios disponibles ese día</div>}
                        {!loadingSlots && !date && <div className="slot-empty">← Elige una fecha en el calendario</div>}
                        {!loadingSlots && slots.map((s) => (
                          <button key={s} className={`slot-btn ${time === s ? 'sel' : ''}`} onClick={() => setTime(s)}>{s}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h3 className="site-font-serif text-xl mb-1">Confirma tu reserva</h3>
                  <p className="text-sm mb-6" style={{ color: 'var(--site-muted)' }}>Revisa los detalles e ingresa tus datos de contacto</p>
                  <div className="summary-box">
                    <div className="summary-row"><span className="key">Servicio</span><span className="val">{service?.name}</span></div>
                    <div className="summary-row"><span className="key">Estilista</span><span className="val">{stylist?.full_name ?? 'Cualquiera disponible'}</span></div>
                    <div className="summary-row"><span className="key">Fecha</span><span className="val">{date} {time}</span></div>
                    <div className="summary-row total"><span className="key">Total</span><span className="val">${Number(service?.price ?? 0).toFixed(2)}</span></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label" htmlFor="bm-name">Tu nombre completo</label>
                      <input className="form-input" id="bm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: María González" />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="bm-phone">WhatsApp</label>
                      <input className="form-input" id="bm-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 809 000 0000" />
                    </div>
                    <div className="form-group md:col-span-2">
                      <label className="form-label" htmlFor="bm-email">Email (opcional)</label>
                      <input className="form-input" id="bm-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />
                    </div>
                    <div className="form-group" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">
                      <label htmlFor="bm-website">Website</label>
                      <input className="form-input" id="bm-website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
                    </div>
                  </div>
                  {error && <p style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.75rem' }}>{error}</p>}
                </div>
              )}
            </div>

            <div className="bm-nav">
              {step > 1 && <button className="btn-back" onClick={goBack}>← Atrás</button>}
              <button className={`btn-next ${step === 4 ? 'confirm' : ''}`} disabled={!canNext || submitting} onClick={goNext}>
                {submitting ? 'Procesando...' : step === 4 ? '✓ Confirmar Reserva' : 'Continuar →'}
              </button>
            </div>
          </div>
        )}

        {tab === 'book' && success && (
          <div id="bm-success">
            <div className="check">✓</div>
            <h3 className="site-font-serif">¡Reserva confirmada! 💅</h3>
            <p style={{ color: 'var(--site-muted)' }}>{success}</p>
          </div>
        )}

        {tab === 'chat' && (
          <div id="tab-chat" style={{ padding: '1.5rem 2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div id="chat-view">
              <div id="chat-messages">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.role === 'user' ? 'chat-user' : 'chat-bot'}`}>{m.content}</div>
                ))}
                {chatSending && <div className="chat-bubble chat-bot chat-thinking">Escribiendo...</div>}
              </div>
              <div id="chat-input-row">
                <input
                  id="chat-text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }}
                  placeholder="Escribe tu pregunta..."
                />
                {voiceSupported && (
                  <button
                    id="chat-voice"
                    className={recording ? 'recording' : ''}
                    onMouseDown={startVoice}
                    onMouseUp={stopVoice}
                    onTouchStart={startVoice}
                    onTouchEnd={stopVoice}
                    title="Mantén presionado para hablar"
                    aria-label="Dictar por voz"
                  >
                    🎤
                  </button>
                )}
                <button id="chat-send" onClick={() => sendChat()} aria-label="Enviar">➤</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
