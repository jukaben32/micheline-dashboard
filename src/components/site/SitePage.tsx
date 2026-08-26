'use client'

import { useState } from 'react'
import type { SiteContent } from '@/types/site'
import BookingModal from './BookingModal'
import ProductsModal from './ProductsModal'

function svcIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes('pedi') || n.includes('pie')) return '🦶'
  if (n.includes('pelo') || n.includes('cabello') || n.includes('hair')) return '✂️'
  if (n.includes('cera') || n.includes('depil')) return '🌿'
  if (n.includes('art') || n.includes('deco')) return '🎨'
  return '💅'
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
}

const SOCIAL_ICONS: { key: keyof Pick<SiteContent['website'], 'social_instagram' | 'social_facebook' | 'social_tiktok'>; label: string; icon: string; color: string }[] = [
  { key: 'social_instagram', label: 'Instagram', icon: '📷', color: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' },
  { key: 'social_facebook', label: 'Facebook', icon: '👍', color: '#1877F2' },
  { key: 'social_tiktok', label: 'TikTok', icon: '🎵', color: '#000000' },
]

export default function SitePage({ content }: { content: SiteContent }) {
  const { business, website, highlights, locations, testimonials, services, stylists, products } = content
  const [bookingOpen, setBookingOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)

  const waNumber = website.whatsapp_number || business.phone || ''
  const waHref = waNumber
    ? `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${business.name}, quiero agendar una cita.`)}`
    : undefined

  return (
    <div className="font-sans antialiased overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 px-8 py-8 transition-all duration-500 hover:bg-white/80 hover:backdrop-blur-md">
        <nav className="flex justify-between items-center max-w-7xl mx-auto">
          <span className="site-font-serif text-3xl tracking-tighter" style={{ color: 'var(--site-dark)' }}>
            {business.name.split(' ')[0]}<span style={{ color: 'var(--site-primary)' }}>.</span>
          </span>
          <div className="space-x-12 text-[10px] site-font-mono uppercase tracking-[0.4em] hidden md:flex" style={{ color: 'color-mix(in srgb, var(--site-dark) 70%, transparent)' }}>
            <a href="#servicios" className="font-bold hover:opacity-70 transition-opacity">Servicios</a>
            <a href="#equipo" className="font-bold hover:opacity-70 transition-opacity">Equipo</a>
            <a href="#reserva" className="font-bold hover:opacity-70 transition-opacity">Reservar</a>
          </div>
          <button
            onClick={() => setBookingOpen(true)}
            className="site-font-mono text-[10px] border px-6 py-2 rounded-full tracking-widest transition-colors"
            style={{ borderColor: 'var(--site-dark)', color: 'var(--site-dark)' }}
          >
            MENU
          </button>
        </nav>
      </header>

      <main className="pt-48 px-8">
        {/* Hero */}
        <section className="max-w-7xl mx-auto mb-32">
          <div className="flex flex-col md:flex-row gap-16 items-end">
            <div className="md:w-3/5">
              <p className="site-font-mono text-[10px] uppercase tracking-[0.5em] reveal-text mb-8" style={{ color: 'var(--site-secondary)' }}>
                {website.tagline || business.name}
              </p>
              <h1 className="site-font-serif text-6xl md:text-8xl leading-[1] reveal-text">
                {website.hero_title || <>Arte &amp; <span className="italic font-light foil">Belleza</span> en cada detalle.</>}
              </h1>
            </div>
            <div className="md:w-2/5 reveal-text" style={{ animationDelay: '0.4s' }}>
              <p className="text-xl font-light leading-relaxed mb-10" style={{ color: 'var(--site-muted)' }}>
                {website.hero_subtitle || 'La belleza es una forma de autocuidado. Elevamos esa expresión personal al nivel de obra maestra.'}
              </p>
              <a href="#reserva" className="inline-flex items-center group site-font-mono text-[10px] tracking-[0.3em] uppercase">
                {website.hero_cta_label || 'Empieza tu experiencia'}
                <span className="ml-6 w-16 h-16 rounded-full border flex items-center justify-center transition-all duration-500" style={{ borderColor: 'var(--site-dark)' }}>→</span>
              </a>
            </div>
          </div>
        </section>

        {/* Bento Grid destacados */}
        {highlights.length > 0 && (
          <section id="servicios" className="max-w-7xl mx-auto mb-40">
            <div className="bento-grid">
              {highlights.map((h) => (
                <div key={h.id} className={`bento-item ${h.size === 'lg' ? 'lg' : h.size === 'sm' ? 'sm' : ''} min-h-[280px] flex flex-col justify-end relative overflow-hidden group`}>
                  {h.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.image_url} alt={h.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                  )}
                  <div className="relative z-10">
                    {h.badge_label && <span className="site-font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--site-secondary)' }}>{h.badge_label}</span>}
                    <h3 className="site-font-serif text-3xl mt-3 mb-3">{h.title}</h3>
                    {h.description && <p className="text-sm opacity-60 max-w-xs leading-relaxed">{h.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Servicios reales */}
        {services.length > 0 && (
          <section className="max-w-7xl mx-auto mb-40">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="site-font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: 'var(--site-secondary)' }}>Nuestro Menú</span>
                <h2 className="site-font-serif text-5xl mt-3">Servicios</h2>
              </div>
              <a href="#reserva" className="site-font-mono text-[10px] uppercase tracking-[0.3em] hover:opacity-70 transition-opacity">Reservar →</a>
            </div>
            <div className="home-svc-grid">
              {services.map((s) => (
                <div key={s.id} className="home-svc-card">
                  <div className="icon">{svcIcon(s.name)}</div>
                  <div className="info">
                    <div className="name">{s.name}</div>
                    <div className="dur">{s.duration_min} min</div>
                  </div>
                  <div className="price">${Number(s.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Equipo real */}
        {stylists.length > 0 && (
          <section id="equipo" className="max-w-7xl mx-auto mb-40">
            <div className="mb-12">
              <span className="site-font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: 'var(--site-secondary)' }}>Quienes te cuidan</span>
              <h2 className="site-font-serif text-5xl mt-3">Equipo</h2>
            </div>
            <div className="team-grid">
              {stylists.map((s) => (
                <div key={s.id} className="team-card">
                  <div className="team-avatar">{initials(s.full_name)}</div>
                  <div className="team-name">{s.full_name}</div>
                  {s.specialty && <div className="team-spec">{s.specialty}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Productos destacados */}
        {products.length > 0 && (
          <section id="productos" className="max-w-7xl mx-auto mb-40">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="site-font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: 'var(--site-secondary)' }}>Tienda</span>
                <h2 className="site-font-serif text-5xl mt-3">Productos destacados</h2>
              </div>
              <button onClick={() => setProductsOpen(true)} className="site-font-mono text-[10px] uppercase tracking-[0.3em] hover:opacity-70 transition-opacity">Ver todo 🛍️</button>
            </div>
            <div className="home-prod-grid">
              {products.slice(0, 4).map((p) => (
                <div key={p.id} className="home-prod-card">
                  <div className="hp-top">
                    {p.type && <span className="hp-type">{p.type}</span>}
                    {p.brand && <span className="hp-brand">{p.brand}</span>}
                  </div>
                  <div className="hp-name">{p.name}</div>
                  <div className="hp-foot">
                    <span className="hp-price">${Number(p.price).toFixed(2)}</span>
                    <span className="hp-stock">{p.stock > 0 ? `${p.stock} en stock` : 'Agotado'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ubicaciones */}
        {locations.length > 0 && (
          <section className="max-w-7xl mx-auto mb-40">
            <div className="grid md:grid-cols-2 gap-8">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="bento-item p-12"
                  style={loc.is_dark ? { background: 'var(--site-dark)', color: 'white', border: 'none' } : undefined}
                >
                  {loc.badge_label && <span className="site-font-mono text-[9px] tracking-[0.4em]" style={{ color: 'var(--site-secondary)' }}>{loc.badge_label}</span>}
                  <h3 className="site-font-serif text-4xl mt-4 mb-8">{loc.name}</h3>
                  <p className="font-light mb-12" style={{ opacity: 0.7 }}>
                    {loc.schedule_weekday}<br />{loc.schedule_sunday}
                  </p>
                  <a
                    href={loc.whatsapp ? `https://wa.me/${loc.whatsapp.replace(/\D/g, '')}` : loc.phone ? `tel:${loc.phone}` : undefined}
                    className="site-font-mono text-[10px] px-8 py-3 rounded-full uppercase tracking-widest transition-all inline-block"
                    style={{ border: `1px solid ${loc.is_dark ? 'rgba(255,255,255,0.2)' : 'var(--site-dark)'}` }}
                  >
                    {loc.whatsapp ? 'WhatsApp' : 'Llamar Ahora'}
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonios */}
        {testimonials.length > 0 && (
          <section className="max-w-7xl mx-auto mb-40">
            <div className="text-center mb-16">
              <span className="site-font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: 'var(--site-secondary)' }}>Lo que dicen</span>
              <h2 className="site-font-serif text-5xl mt-3">Clientas que confían en nosotras</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="bento-item p-10">
                  <div className="site-font-serif text-5xl mb-2" style={{ color: 'var(--site-primary)', opacity: 0.5, lineHeight: 1 }}>&ldquo;</div>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--site-dark)' }}>{t.quote}</p>
                  <div className="mb-2" style={{ color: 'var(--site-secondary)', letterSpacing: '2px', fontSize: '0.85rem' }}>{'★'.repeat(t.rating)}</div>
                  <p className="site-font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--site-dark)' }}>{t.author_name}</p>
                  {t.author_location && <p className="text-[11px]" style={{ color: 'var(--site-muted)' }}>{t.author_location}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="h-px max-w-7xl mx-auto mb-32" style={{ background: 'linear-gradient(90deg,var(--site-primary),var(--site-secondary),transparent)' }} />

        {/* Redes sociales */}
        <section className="max-w-7xl mx-auto mb-40 text-center">
          <span className="site-font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: 'var(--site-secondary)' }}>Síguenos</span>
          <h2 className="site-font-serif text-4xl mt-3 mb-10">Nuestras redes sociales</h2>
          <div className="flex justify-center flex-wrap gap-4">
            {SOCIAL_ICONS.filter(s => website[s.key]).map((s) => (
              <a
                key={s.key}
                href={website[s.key] as string}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="social-btn"
                style={{ width: 54, height: 54, borderRadius: '50%', background: 'white', border: '1px solid var(--site-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </section>

        {/* Footer / CTA */}
        <footer id="reserva" className="max-w-7xl mx-auto py-32 border-t text-center" style={{ borderColor: 'var(--site-border)' }}>
          <h2 className="site-font-serif text-5xl mb-12 italic">Tu momento es ahora.</h2>
          <div className="flex justify-center mb-16">
            <button
              onClick={() => setBookingOpen(true)}
              className="site-font-mono text-xl text-white px-16 py-8 rounded-full transition-all duration-700"
              style={{ background: 'var(--site-primary)', boxShadow: '0 20px 60px color-mix(in srgb, var(--site-primary) 50%, transparent)' }}
            >
              💅 AGENDAR CITA
            </button>
          </div>
          <p className="site-font-mono text-[10px] tracking-[0.3em]" style={{ color: 'var(--site-muted)' }}>
            © {new Date().getFullYear()} {business.name.toUpperCase()}
          </p>
        </footer>

        {waHref && (
          <a href={waHref} className="wa-btn" target="_blank" rel="noreferrer" aria-label={`WhatsApp ${business.name}`}>
            <svg viewBox="0 0 448 512" width="28" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.4-8.6-44.6-27.6-16.5-14.7-27.6-32.8-30.8-38.4-3.2-5.6-.3-8.6 2.5-11.4 2.5-2.5 5.5-6.5 8.3-9.8 2.8-3.3 3.7-5.5 5.5-9.2 1.9-3.7 1-6.9-.5-9.8-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.6 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
            </svg>
          </a>
        )}
      </main>

      <button onClick={() => setBookingOpen(true)} id="book-fab" title="Reservar cita">💅</button>
      {products.length > 0 && (
        <button onClick={() => setProductsOpen(true)} id="products-fab" title="Ver productos">🛍️</button>
      )}

      {bookingOpen && (
        <BookingModal
          business={business}
          services={services}
          stylists={stylists}
          onClose={() => setBookingOpen(false)}
        />
      )}
      {productsOpen && (
        <ProductsModal business={business} products={products} onClose={() => setProductsOpen(false)} />
      )}
    </div>
  )
}
