export type Tema = "light" | "dark" | "system";

/** Clave de localStorage del tema: propia de Rastro, para no chocar con otras apps en el mismo origen. */
export const CLAVE_TEMA = "rastro-tema";

const TEMAS: readonly string[] = ["light", "dark", "system"];

/** Cualquier valor guardado que no sea un tema de la app se trata como el tema del sistema. */
export function normalizarTema(valor: string | undefined): Tema {
  return valor !== undefined && TEMAS.includes(valor) ? (valor as Tema) : "system";
}
