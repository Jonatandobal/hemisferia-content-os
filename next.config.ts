import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Definir el root del workspace para Turbopack
  // Esto silencia el warning de "multiple lockfiles detected"
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
