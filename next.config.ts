import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir imágenes optimizadas desde el Storage de Supabase (fotos de estilistas).
  // Sin esto, next/image rechaza el dominio externo.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kpszlnymywgudutqlgqa.supabase.co",
      },
    ],
  },
};

export default nextConfig;
