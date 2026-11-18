import type { NextConfig } from "next";

/**
 * Host de APP_BASE_URL (la misma dirección que usan los QR) para que el
 * servidor de desarrollo responda al celular desde la red local.
 * Next compila este archivo aparte y no puede importar módulos .ts de la app,
 * por eso no reutiliza normalizarUrlBase de src/lib/url-publica.ts.
 */
function hostsDeDesarrollo(valor: string | undefined): string[] {
  try {
    const url = new URL(valor?.trim() ?? "");
    return url.protocol === "http:" || url.protocol === "https:" ? [url.hostname] : [];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // App local de un solo usuario: las páginas leen SQLite en cada petición,
  // sin caché de componentes (los datos deben verse siempre frescos).
  cacheComponents: false,
  // Servidor autónomo en .next/standalone, el que usa la imagen de Docker.
  output: "standalone",
  allowedDevOrigins: hostsDeDesarrollo(process.env.APP_BASE_URL),
  experimental: {
    serverActions: {
      // El envío más grande es un acta escaneada de hasta 10 MB (las 4 fotos
      // de una baja suman 3,2 MB), más el margen del multipart. Por defecto: 1 MB.
      bodySizeLimit: "11mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
