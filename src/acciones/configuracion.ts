"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { configuracion } from "@/db/schema";
import { primerErrorZod } from "@/lib/validacion/comunes";
import { esquemaConfiguracionFormulario } from "@/lib/validacion/configuracion";
import type { ResultadoAccion } from "./resultado";

/** La configuración es una sola fila (id = 1): se crea o se actualiza. */
const ID_CONFIGURACION = 1;

export async function guardarConfiguracion(datos: unknown): Promise<ResultadoAccion> {
  const resultado = esquemaConfiguracionFormulario.safeParse(datos);
  if (!resultado.success) {
    return { ok: false, error: primerErrorZod(resultado.error) };
  }

  const d = resultado.data;
  const valores = {
    codigoFormato: d.codigoFormato ?? null,
    versionFormato: d.versionFormato ?? null,
    fechaEmision: d.fechaEmision ?? null,
    elaboradoNombre: d.elaboradoNombre ?? null,
    elaboradoCargo: d.elaboradoCargo ?? null,
    revisadoNombre: d.revisadoNombre ?? null,
    revisadoCargo: d.revisadoCargo ?? null,
    aprobadoNombre: d.aprobadoNombre ?? null,
    aprobadoCargo: d.aprobadoCargo ?? null,
  };

  db.insert(configuracion)
    .values({ id: ID_CONFIGURACION, ...valores })
    .onConflictDoUpdate({ target: configuracion.id, set: valores })
    .run();

  // El encabezado y las firmas aparecen en todas las hojas de vida
  revalidatePath("/", "layout");
  return { ok: true };
}
