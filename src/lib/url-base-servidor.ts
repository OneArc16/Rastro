import { headers } from "next/headers";
import { normalizarUrlBase, origenDesdeEncabezados } from "./url-publica";

export type UrlBase = {
  base: string;
  /** false = no hay APP_BASE_URL válida y se usa la dirección con que se abrió la página. */
  configurada: boolean;
};

/** Dirección base para los QR. Solo en el servidor: lee el entorno y el pedido actual. */
export async function obtenerUrlBase(): Promise<UrlBase> {
  const configurada = normalizarUrlBase(process.env.APP_BASE_URL);
  if (configurada) return { base: configurada, configurada: true };

  const encabezados = await headers();
  const origen = origenDesdeEncabezados(
    encabezados.get("x-forwarded-host") ?? encabezados.get("host"),
    encabezados.get("x-forwarded-proto"),
  );
  return { base: origen ?? "http://localhost:3000", configurada: false };
}
