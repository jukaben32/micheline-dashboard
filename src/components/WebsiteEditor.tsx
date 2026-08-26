'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useActiveBusiness } from '@/hooks/useBusiness'
import { siteThemeStyle } from '@/lib/site-theme'
import SitePage from '@/components/site/SitePage'
import Aviso from '@/components/Aviso'
import type { Website, Highlight, SiteLocation, Testimonial, Service, Stylist, Product, Business } from '@/types/site'

type FormState = Omit<Website, 'business_id'>

const DEFAULT_FORM: FormState = {
  is_published: false,
  site_title: '',
  tagline: '',
  hero_title: '',
  hero_subtitle: '',
  hero_cta_label: '',
  about_text: '',
  primary_color: '#C81361',
  secondary_color: '#C9A227',
  dark_color: '#1B1113',
  bg_color: '#FFFBF7',
  border_color: '#EFE2E6',
  muted_color: '#8A7A7E',
  font_choice: 'playfair_plex',
  whatsapp_number: '',
  phone: '',
  social_instagram: '',
  social_facebook: '',
  social_tiktok: '',
}

let tempIdCounter = 0
function tempId() { return `tmp-${++tempIdCounter}` }

export default function WebsiteEditor() {
  const supabase = createClient()
  const { activeId } = useActiveBusiness()

  const [business, setBusiness] = useState<Business | null>(null)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [locations, setLocations] = useState<SiteLocation[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!activeId) return
    load(activeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  async function load(businessId: string) {
    setLoading(true)
    const [{ data: biz }, { data: site }, { data: hl }, { data: loc }, { data: te }, { data: svc }, { data: sty }, { data: prod }] = await Promise.all([
      supabase.from('business').select('id, slug, name, phone').eq('id', businessId).single(),
      supabase.from('websites').select('*').eq('business_id', businessId).maybeSingle(),
      supabase.from('website_highlights').select('*').eq('business_id', businessId).order('sort_order'),
      supabase.from('website_locations').select('*').eq('business_id', businessId).order('sort_order'),
      supabase.from('website_testimonials').select('*').eq('business_id', businessId).order('sort_order'),
      supabase.from('services').select('id, name, duration_min, price, category').eq('business_id', businessId).eq('is_active', true),
      supabase.from('stylists').select('id, full_name, specialty, photo_url').eq('business_id', businessId).eq('is_active', true),
      supabase.from('products').select('id, name, type, description, brand, price, stock').eq('business_id', businessId).eq('is_active', true),
    ])
    setBusiness(biz as Business)
    if (site) {
      const { business_id, ...rest } = site
      void business_id
      setForm(rest as FormState)
    } else {
      setForm(DEFAULT_FORM)
    }
    setHighlights((hl as Highlight[]) ?? [])
    setLocations((loc as SiteLocation[]) ?? [])
    setTestimonials((te as Testimonial[]) ?? [])
    setServices((svc as Service[]) ?? [])
    setStylists((sty as Stylist[]) ?? [])
    setProducts((prod as Product[]) ?? [])
    setLoading(false)
  }

  async function replaceList(table: string, businessId: string, rows: Record<string, unknown>[]) {
    await supabase.from(table).delete().eq('business_id', businessId)
    const clean = rows.map(({ id, ...r }) => {
      void id
      return { ...r, business_id: businessId }
    })
    if (clean.length > 0) await supabase.from(table).insert(clean)
  }

  async function save() {
    if (!activeId) return
    setSaving(true)
    setMsg(null)
    try {
      const { error: eSite } = await supabase.from('websites').upsert({ ...form, business_id: activeId })
      if (eSite) throw eSite
      await replaceList('website_highlights', activeId, highlights as unknown as Record<string, unknown>[])
      await replaceList('website_locations', activeId, locations as unknown as Record<string, unknown>[])
      await replaceList('website_testimonials', activeId, testimonials as unknown as Record<string, unknown>[])
      setMsg({ type: 'ok', text: 'Guardado.' })
      if (activeId) load(activeId)
    } catch (e) {
      setMsg({ type: 'error', text: e instanceof Error ? e.message : 'No se pudo guardar' })
    } finally {
      setSaving(false)
    }
  }

  const previewContent = useMemo(() => {
    if (!business) return null
    return {
      business,
      website: { ...form, business_id: business.id },
      highlights,
      locations,
      testimonials,
      services,
      stylists,
      products,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business, form, highlights, locations, testimonials, services, stylists, products])

  if (loading) return <p className="text-gray-400">Cargando…</p>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      {/* Columna izquierda: formulario */}
      <div className="space-y-5">
        {msg && <Aviso tipo={msg.type === 'ok' ? 'info' : 'error'} mensaje={msg.text} />}

        <div className="bg-white border border-[#ece8e5] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Publicar sitio</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
              <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-rose-600 transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
          {business?.slug && (
            <p className="text-xs text-gray-400 break-all">
              {form.is_published ? 'Visible en ' : 'Se publicará en '}
              <span className="font-mono">/sites/{business.slug}</span>
            </p>
          )}
        </div>

        <Section title="General">
          <Field label="Título del sitio"><input className="input" value={form.site_title ?? ''} onChange={e => setForm(f => ({ ...f, site_title: e.target.value }))} /></Field>
          <Field label="Frase corta (arriba del hero)"><input className="input" value={form.tagline ?? ''} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} /></Field>
          <Field label="Teléfono"><input className="input" value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
          <Field label="WhatsApp"><input className="input" value={form.whatsapp_number ?? ''} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} /></Field>
        </Section>

        <Section title="Hero">
          <Field label="Título grande"><input className="input" value={form.hero_title ?? ''} onChange={e => setForm(f => ({ ...f, hero_title: e.target.value }))} placeholder="Arte & Belleza en cada detalle." /></Field>
          <Field label="Subtítulo"><textarea className="input" rows={3} value={form.hero_subtitle ?? ''} onChange={e => setForm(f => ({ ...f, hero_subtitle: e.target.value }))} /></Field>
          <Field label="Texto del botón"><input className="input" value={form.hero_cta_label ?? ''} onChange={e => setForm(f => ({ ...f, hero_cta_label: e.target.value }))} placeholder="Empieza tu experiencia" /></Field>
        </Section>

        <Section title="Colores">
          <div className="grid grid-cols-2 gap-2">
            <ColorField label="Primario" value={form.primary_color} onChange={v => setForm(f => ({ ...f, primary_color: v }))} />
            <ColorField label="Secundario" value={form.secondary_color} onChange={v => setForm(f => ({ ...f, secondary_color: v }))} />
            <ColorField label="Oscuro" value={form.dark_color} onChange={v => setForm(f => ({ ...f, dark_color: v }))} />
            <ColorField label="Fondo" value={form.bg_color} onChange={v => setForm(f => ({ ...f, bg_color: v }))} />
            <ColorField label="Borde" value={form.border_color} onChange={v => setForm(f => ({ ...f, border_color: v }))} />
            <ColorField label="Texto suave" value={form.muted_color} onChange={v => setForm(f => ({ ...f, muted_color: v }))} />
          </div>
        </Section>

        <Section title="Redes sociales">
          <Field label="Instagram (URL)"><input className="input" value={form.social_instagram ?? ''} onChange={e => setForm(f => ({ ...f, social_instagram: e.target.value }))} /></Field>
          <Field label="Facebook (URL)"><input className="input" value={form.social_facebook ?? ''} onChange={e => setForm(f => ({ ...f, social_facebook: e.target.value }))} /></Field>
          <Field label="TikTok (URL)"><input className="input" value={form.social_tiktok ?? ''} onChange={e => setForm(f => ({ ...f, social_tiktok: e.target.value }))} /></Field>
        </Section>

        <Section title={`Tarjetas destacadas (${highlights.length})`}>
          {highlights.map((h, i) => (
            <ListItemCard key={h.id} onRemove={() => setHighlights(hs => hs.filter((_, j) => j !== i))}>
              <input className="input" placeholder="Título" value={h.title} onChange={e => updateAt(setHighlights, i, { title: e.target.value })} />
              <input className="input" placeholder="Etiqueta (ej. Exclusivo)" value={h.badge_label ?? ''} onChange={e => updateAt(setHighlights, i, { badge_label: e.target.value })} />
              <textarea className="input" rows={2} placeholder="Descripción" value={h.description ?? ''} onChange={e => updateAt(setHighlights, i, { description: e.target.value })} />
              <input className="input" placeholder="URL de imagen" value={h.image_url ?? ''} onChange={e => updateAt(setHighlights, i, { image_url: e.target.value })} />
            </ListItemCard>
          ))}
          <AddButton onClick={() => setHighlights(hs => [...hs, { id: tempId(), sort_order: hs.length, title: '', subtitle: null, description: null, image_url: null, badge_label: null, size: 'md' }])} label="+ Agregar tarjeta" />
        </Section>

        <Section title={`Ubicaciones (${locations.length})`}>
          {locations.map((l, i) => (
            <ListItemCard key={l.id} onRemove={() => setLocations(ls => ls.filter((_, j) => j !== i))}>
              <input className="input" placeholder="Nombre (ej. San Pedro de Macorís)" value={l.name} onChange={e => updateAt(setLocations, i, { name: e.target.value })} />
              <input className="input" placeholder="Etiqueta (ej. MAIN STUDIO)" value={l.badge_label ?? ''} onChange={e => updateAt(setLocations, i, { badge_label: e.target.value })} />
              <input className="input" placeholder="Horario lun-sáb" value={l.schedule_weekday ?? ''} onChange={e => updateAt(setLocations, i, { schedule_weekday: e.target.value })} />
              <input className="input" placeholder="Horario domingo" value={l.schedule_sunday ?? ''} onChange={e => updateAt(setLocations, i, { schedule_sunday: e.target.value })} />
              <input className="input" placeholder="WhatsApp" value={l.whatsapp ?? ''} onChange={e => updateAt(setLocations, i, { whatsapp: e.target.value })} />
            </ListItemCard>
          ))}
          <AddButton onClick={() => setLocations(ls => [...ls, { id: tempId(), sort_order: ls.length, name: '', badge_label: null, schedule_weekday: null, schedule_sunday: null, phone: null, whatsapp: null, address: null, is_dark: ls.length === 0 }])} label="+ Agregar ubicación" />
        </Section>

        <Section title={`Testimonios (${testimonials.length})`}>
          {testimonials.map((t, i) => (
            <ListItemCard key={t.id} onRemove={() => setTestimonials(ts => ts.filter((_, j) => j !== i))}>
              <textarea className="input" rows={2} placeholder="Cita del testimonio" value={t.quote} onChange={e => updateAt(setTestimonials, i, { quote: e.target.value })} />
              <input className="input" placeholder="Nombre" value={t.author_name} onChange={e => updateAt(setTestimonials, i, { author_name: e.target.value })} />
              <input className="input" placeholder="Ciudad" value={t.author_location ?? ''} onChange={e => updateAt(setTestimonials, i, { author_location: e.target.value })} />
            </ListItemCard>
          ))}
          <AddButton onClick={() => setTestimonials(ts => [...ts, { id: tempId(), sort_order: ts.length, author_name: '', author_location: null, quote: '', rating: 5 }])} label="+ Agregar testimonio" />
        </Section>

        <button onClick={save} disabled={saving} className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      {/* Columna derecha: preview en vivo */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        {previewContent && (
          <div style={siteThemeStyle(previewContent.website)}>
            <SitePage content={previewContent} />
          </div>
        )}
      </div>
    </div>
  )
}

function updateAt<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, i: number, patch: Partial<T>) {
  setter(list => list.map((item, j) => (j === i ? { ...item, ...patch } : item)))
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#ece8e5] rounded-2xl p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded border border-gray-200" />
      <div className="flex-1">
        <div className="text-[10px] text-gray-400">{label}</div>
        <input className="input text-xs" value={value} onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  )
}

function ListItemCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 space-y-2 relative">
      <button onClick={onRemove} className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-700">✕</button>
      {children}
    </div>
  )
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="w-full text-xs text-rose-600 border border-dashed border-rose-200 rounded-xl py-2 hover:bg-rose-50 transition-colors">
      {label}
    </button>
  )
}
