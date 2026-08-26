import type { CSSProperties } from 'react'

export type WebsiteRow = {
  primary_color: string
  secondary_color: string
  dark_color: string
  bg_color: string
  border_color: string
  muted_color: string
}

// Convierte la fila `websites` de un negocio en variables CSS (--site-*)
// que site.css usa para pintar toda la landing con la paleta de ese negocio.
export function siteThemeStyle(website: WebsiteRow): CSSProperties {
  return {
    '--site-primary': website.primary_color,
    '--site-secondary': website.secondary_color,
    '--site-dark': website.dark_color,
    '--site-bg': website.bg_color,
    '--site-border': website.border_color,
    '--site-muted': website.muted_color,
  } as CSSProperties
}
