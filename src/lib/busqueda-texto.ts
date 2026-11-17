import { normalizar } from "@/importacion/lectura";

/**
 * Filtra filas por texto libre, sin distinguir mayúsculas ni tildes.
 * Cada palabra buscada debe aparecer en alguno de los textos que devuelve `textos`.
 */
export function filtrarPorTexto<T>(
  filas: T[],
  texto: string,
  textos: (fila: T) => Array<string | null | undefined>,
): T[] {
  const palabras = normalizar(texto).split(" ").filter(Boolean);
  if (palabras.length === 0) return filas;

  return filas.filter((fila) => {
    const contenido = normalizar(textos(fila).filter(Boolean).join(" "));
    return palabras.every((p) => contenido.includes(p));
  });
}
