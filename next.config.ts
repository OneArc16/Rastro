import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App local de un solo usuario: las páginas leen SQLite en cada petición,
  // sin caché de componentes (los datos deben verse siempre frescos).
  cacheComponents: false,
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
