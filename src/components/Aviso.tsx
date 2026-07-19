'use client'

import { useEffect } from 'react'

// Componente reutilizable para mostrar errores al usuario.
// Antes varias páginas ignoraban los errores de Supabase y el usuario
// solo veía una lista vacía (parecía "no hay datos" cuando en realidad
// la consulta falló: red, permisos RLS, etc.).
export default function Aviso({
  tipo = 'error',
  mensaje,
}: {
  tipo?: 'error' | 'info'
  mensaje?: string | null
}) {
  // Si no hay mensaje, no renderizamos nada
  if (!mensaje) return null

  const estilos =
    tipo === 'error'
      ? 'bg-red-50 border-red-200 text-red-700'
      : 'bg-sky-50 border-sky-200 text-sky-700'

  return (
    <div
      role="alert"
      className={`animar-aparecer border rounded-2xl px-4 py-3 mb-4 text-sm ${estilos}`}
    >
      <span className="font-medium mr-1">
        {tipo === 'error' ? '⚠️ No se pudieron cargar los datos:' : 'ℹ️'}
      </span>
      {mensaje}
    </div>
  )
}
