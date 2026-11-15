/**
 * Direcciones que se imprimen en los QR. Tienen que funcionar desde el celular,
 * así que usan la IP de la red local configurada en APP_BASE_URL
 * (por ejemplo http://192.168.1.50:3000), no "localhost".
 */

/** Valida APP_BASE_URL: http(s) obligatorio, sin barra final. null si no sirve. */
export function normalizarUrlBase(valor: string | undefined): string | null {
  const texto = valor?.trim();
  if (!texto) return null;
  try {
    const url = new URL(texto);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function urlDeActivo(base: string, codigo: string): string {
  return `${base}/activos/${encodeURIComponent(codigo)}`;
}

/** Origen del pedido actual, para cuando APP_BASE_URL no está configurada. */
export function origenDesdeEncabezados(host: string | null, protocolo: string | null): string | null {
  if (!host) return null;
  return `${protocolo ?? "http"}://${host}`;
}
