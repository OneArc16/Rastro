"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { db } from "@/db";
import {
  asignar,
  darDeBaja,
  devolver,
  ErrorDeNegocio,
  intercambiar,
  retirarFuncionario,
  trasladar,
} from "@/dominio/asignaciones";
import {
  aDestino,
  esquemaBaja,
  esquemaDevolucion,
  esquemaIntercambio,
  esquemaMovimiento,
  esquemaRetiro,
} from "@/lib/validacion/asignaciones";
import { primerErrorZod } from "@/lib/validacion/comunes";
import type { ResultadoAccion } from "./resultado";

/**
 * Valida la entrada, ejecuta la operación de dominio y traduce los errores
 * de negocio a un resultado que el formulario puede mostrar.
 */
function ejecutar<T extends z.ZodType>(
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

  // Un movimiento cambia inventario, fichas, funcionarios y ubicaciones a la vez
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function asignarActivo(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaMovimiento, datos, (d) =>
    asignar(db, {
      activoId: d.activoId,
      destino: aDestino(d.tipoDestino, d.destinoId),
      fecha: d.fecha,
      motivo: d.motivo,
    }),
  );
}

export async function trasladarActivo(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaMovimiento, datos, (d) =>
    trasladar(db, {
      activoId: d.activoId,
      destino: aDestino(d.tipoDestino, d.destinoId),
      fecha: d.fecha,
      motivo: d.motivo,
    }),
  );
}

export async function devolverActivo(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaDevolucion, datos, (d) => devolver(db, d));
}

export async function intercambiarActivos(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaIntercambio, datos, (d) => intercambiar(db, d));
}

export async function darDeBajaActivo(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaBaja, datos, (d) => darDeBaja(db, d));
}

export async function retirarFuncionarioAccion(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaRetiro, datos, (d) => retirarFuncionario(db, d));
}
