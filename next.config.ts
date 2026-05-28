import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Definir el root del workspace para Turbopack.
  // Esto silencia el warning de "multiple lockfiles detected".
  turbopack: {
    root: path.join(__dirname),
  },

  // Dominios externos permitidos para <Image />.
  images: {
    remotePatterns: [
      // URLs temporales de DALL-E 3 (vencen en 60min)
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
      // Supabase Storage — imágenes subidas por el usuario o cacheadas
      {
        protocol: "https",
        hostname: "yrmxmfnglrithgqqvpif.supabase.co",
      },
    ],
  },
};

export default nextConfig;
