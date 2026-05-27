import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Definir el root del workspace para Turbopack.
  // Esto silencia el warning de "multiple lockfiles detected".
  turbopack: {
    root: path.join(__dirname),
  },

  // Dominios externos permitidos para <Image />.
  // - oaidalleapiprodscus.blob.core.windows.net: URLs temporales de DALL-E 3.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
    ],
  },
};

export default nextConfig;
