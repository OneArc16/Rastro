"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ErrorDeNegocio } from "@/dominio/comunes";
import { adjuntarEscaneo, eliminarEscaneo } from "@/dominio/escaneos";
import { MAXIMO_BYTES_ESCANEO } from "@/lib/validacion/actas";
import type { ResultadoAccion } from "./resultado";

const esId = (n: number) => Number.isInteger(n) && n > 0;

function intentar(operacion: () => void): ResultadoAccion {
  try {
    operacion();
    revalidatePath("/actas", "layout");
    return { ok: true };
  } catch (error) {
    if (error instanceof ErrorDeNegocio) return { ok: false, error: error.message };
    throw error;
  }
}

/** Sube un archivo del acta firmada escaneada (campo "archivo" del FormData). */
export async function subirEscaneoAccion(actaId: number, formulario: FormData): Promise<ResultadoAccion> {
  if (!esId(actaId)) return { ok: false, error: "El acta no existe" };
  const archivo = formulario.get("archivo");
  if (!(archivo instanceof File)) return { ok: false, error: "Elija un archivo" };
  if (archivo.size > MAXIMO_BYTES_ESCANEO) return { ok: false, error: "El archivo supera los 10 MB" };

  const contenido = Buffer.from(await archivo.arrayBuffer());
  return intentar(() =>
    adjuntarEscaneo(db, { actaId, nombre: archivo.name, tipo: archivo.type, contenido }),
  );
}

export async function eliminarEscaneoAccion(actaId: number, escaneoId: number): Promise<ResultadoAccion> {
  if (!esId(actaId) || !esId(escaneoId)) return { ok: false, error: "El archivo no pertenece al acta" };
  return intentar(() => eliminarEscaneo(db, actaId, escaneoId));
}
