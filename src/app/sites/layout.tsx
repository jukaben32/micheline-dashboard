import { Playfair_Display, IBM_Plex_Mono, Inter } from "next/font/google";
import "./site.css";

const playfair = Playfair_Display({
  variable: "--font-site-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-site-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const inter = Inter({
  variable: "--font-site-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

// Layout del segmento /sites: landing publica de cada negocio. Tipografias
// propias del sitio (distintas de las del panel admin), sin tocar el
// layout raiz del dashboard.
export default function SitesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} ${plexMono.variable} ${inter.variable}`}>
      {children}
    </div>
  );
}
