import { normalizar } from "@/importacion/lectura";

/**
 * Si el texto coincide con la búsqueda, sin distinguir mayúsculas ni tildes:
 * cada palabra buscada debe aparecer en el texto. Una búsqueda vacía coincide siempre.
 */
export function coincideConBusqueda(texto: string, busqueda: string): boolean {
  const palabras = normalizar(busqueda).split(" ").filter(Boolean);
  if (palabras.length === 0) return true;
  const contenido = normalizar(texto);
  return palabras.every((p) => contenido.includes(p));
}

/**
 * Filtra filas por texto libre (ver coincideConBusqueda), buscando en todos
 * los textos que devuelve `textos` para cada fila.
 */
export function filtrarPorTexto<T>(
  filas: T[],
  texto: string,
  textos: (fila: T) => Array<string | null | undefined>,
): T[] {
  if (normalizar(texto) === "") return filas;
  return filas.filter((fila) => coincideConBusqueda(textos(fila).filter(Boolean).join(" "), texto));
}
