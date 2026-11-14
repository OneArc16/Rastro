/** Resultado uniforme de las server actions, pensado para mostrarse en el formulario. */
export type ResultadoAccion = { ok: true } | { ok: false; error: string };

/** true cuando el error de SQLite es una violación de restricción UNIQUE. */
export function esErrorDeUnicidad(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}
