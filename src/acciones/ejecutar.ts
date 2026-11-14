import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { ErrorDeNegocio } from "@/dominio/comunes";
import { primerErrorZod } from "@/lib/validacion/comunes";
import type { ResultadoAccion } from "./resultado";

/**
 * Valida la entrada, ejecuta la operación de dominio y traduce los errores
 * de negocio a un resultado que el formulario puede mostrar.
 */
export function ejecutar<T extends z.ZodType>(
  esquema: T,
  datos: unknown,
  operacion: (valido: z.output<T>) => void,
): ResultadoAccion {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    return { ok: false, error: primerErrorZod(resultado.error) };
  }

  try {
    operacion(resultado.data);
  } catch (error) {
    if (error instanceof ErrorDeNegocio) {
      return { ok: false, error: error.message };
    }
    throw error;
  }

  // Estas operaciones cambian datos que se ven en varias pantallas a la vez
  revalidatePath("/", "layout");
  return { ok: true };
}
