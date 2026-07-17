'use client'

// Componente de gráfico "redondo" (donut) hecho en SVG puro.
// No usa librerías externas: dibujamos arcos con math simple.
// Props:
//   data: array de { label, value, color }
//   size: diámetro en px (default 180)
//   centerLabel / centerValue: texto opcional en el centro

type Slice = { label: string; value: number; color: string }

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  // Convierte grados a coordenadas x,y en el círculo
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  // Si es un solo valor (100%) dibujamos círculo completo para evitar bug del arco
  if (endDeg - startDeg >= 359.999) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`
  }
  const start = polar(cx, cy, r, startDeg)
  const end = polar(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`
}

export default function Donut({
  data,
  size = 180,
  centerLabel,
  centerValue,
}: {
  data: Slice[]
  size?: number
  centerLabel?: string
  centerValue?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 6 // deja margen para el trazo
  const stroke = 20 // grosor del anillo

  // Cantidad de datos con valor > 0 (para decidir si dibujamos separaciones)
  const visibles = data.filter(d => d.value > 0).length
  // Separación (en grados) entre segmentos: solo cuando hay más de uno,
  // así el gráfico de un solo color se mantiene como anillo completo.
  const gap = visibles > 1 ? 2 : 0

  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-gray-300" style={{ width: size, height: size }}>
        sin datos
      </div>
    )
  }

  // Calculamos los arcos de forma pura (sin reasignar variables externas)
  const segments = data.map((d, i) => {
    const inicio = data.slice(0, i).reduce((s, x) => s + x.value, 0)
    const start = (inicio / total) * 360
    const end = ((inicio + d.value) / total) * 360
    return { ...d, start, end }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" className="animar-aparecer">
      {/* fondo tenue del anillo */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />

      {segments.map((s, i) => {
        // No dibujamos segmentos vacíos
        if (s.value <= 0) return null
        // Aplicamos un pequeño hueco a cada lado para separar los colores.
        // Nos aseguramos de no invertir el arco en segmentos muy pequeños.
        const inicio = s.start + gap / 2
        const fin = Math.max(inicio, s.end - gap / 2)
        return (
          <path
            key={i}
            d={arcPath(cx, cy, r, inicio, fin)}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeLinecap="round" // puntas redondeadas = más suave
          />
        )
      })}

      {centerValue && (
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-gray-800" fontSize={size * 0.16} fontWeight={700}>
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text x={cx} y={cy + size * 0.12} textAnchor="middle" className="fill-gray-400" fontSize={size * 0.08}>
          {centerLabel}
        </text>
      )}
    </svg>
  )
}
