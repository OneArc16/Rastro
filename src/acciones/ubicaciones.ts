"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ubicaciones } from "@/db/schema";
import { primerErrorZod } from "@/lib/validacion/comunes";
import { esquemaUbicacionFormulario } from "@/lib/validacion/ubicaciones";
import { esErrorDeUnicidad, type ResultadoAccion } from "./resultado";

export async function crearUbicacion(datos: unknown): Promise<ResultadoAccion> {
  const resultado = esquemaUbicacionFormulario.safeParse(datos);
  if (!resultado.success) {
    return { ok: false, error: primerErrorZod(resultado.error) };
  }

  try {
    db.insert(ubicaciones).values(resultado.data).run();
  } catch (error) {
    if (esErrorDeUnicidad(error)) {
      return { ok: false, error: "Ya existe una ubicación con ese nombre" };
    }
    throw error;
  }

  revalidatePath("/ubicaciones");
  return { ok: true };
}

export async function actualizarUbicacion(
  id: number,
  datos: unknown,
): Promise<ResultadoAccion> {
  const resultado = esquemaUbicacionFormulario.safeParse(datos);
  if (!resultado.success) {
    return { ok: false, error: primerErrorZod(resultado.error) };
  }

  try {
    db.update(ubicaciones)
      .set(resultado.data)
      .where(eq(ubicaciones.id, id))
      .run();
  } catch (error) {
    if (esErrorDeUnicidad(error)) {
      return { ok: false, error: "Ya existe una ubicación con ese nombre" };
    }
    throw error;
  }

  revalidatePath("/ubicaciones");
  return { ok: true };
}
