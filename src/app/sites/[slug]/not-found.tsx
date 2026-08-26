export default function SiteNotFound() {
  return (
    <div
      className="site-root site-font-mono"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        background: '#FFFBF7',
        color: '#1B1113',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <p style={{ fontSize: '3rem' }}>💅</p>
      <h1 className="site-font-serif" style={{ fontSize: '2rem' }}>Este sitio no existe (todavía)</h1>
      <p style={{ color: '#8A7A7E', maxWidth: '32ch' }}>
        El negocio no existe o su sitio aún no está publicado.
      </p>
    </div>
  )
}
