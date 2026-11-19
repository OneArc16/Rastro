/**
 * Copias escaneadas de las actas firmadas: se guardan en la base para que
 * entren en los respaldos y no se pierdan.
 */
import { and, count, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { actas, actasEscaneos } from "@/db/schema";
import { coincideConTipo } from "@/lib/archivos";
import { MAXIMO_BYTES_ESCANEO, TIPOS_ESCANEO } from "@/lib/validacion/actas";
import { ErrorDeNegocio } from "./comunes";

const NOMBRE_POR_DEFECTO = "acta-escaneada";

/** Solo el nombre del archivo, sin carpetas ni caracteres de control, y con un largo razonable. */
function limpiarNombre(nombre: string): string {
  const base = nombre.split(/[\\/]/).pop() ?? "";
  const limpio = base
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return limpio || NOMBRE_POR_DEFECTO;
}

export function adjuntarEscaneo(
  db: Db,
  datos: { actaId: number; nombre: string; tipo: string; contenido: Buffer },
): number {
  if (!(TIPOS_ESCANEO as readonly string[]).includes(datos.tipo)) {
    throw new ErrorDeNegocio("El archivo debe ser PDF, JPG o PNG");
  }
  if (datos.contenido.length === 0) throw new ErrorDeNegocio("El archivo está vacío");
  if (datos.contenido.length > MAXIMO_BYTES_ESCANEO) {
    throw new ErrorDeNegocio("El archivo supera los 10 MB");
  }
  if (!coincideConTipo(datos.contenido, datos.tipo)) {
    throw new ErrorDeNegocio("El archivo no es un PDF o una imagen válida");
  }

  return db.transaction((tx) => {
    const acta = tx.select({ id: actas.id }).from(actas).where(eq(actas.id, datos.actaId)).get();
    if (!acta) throw new ErrorDeNegocio("El acta no existe");
    // Cada acta tiene un solo formato: una sola copia escaneada
    const existentes =
      tx.select({ total: count() }).from(actasEscaneos).where(eq(actasEscaneos.actaId, acta.id)).get()
        ?.total ?? 0;
    if (existentes > 0) {
      throw new ErrorDeNegocio("El acta ya tiene su copia escaneada; elimínela para subir otra");
    }

    return tx
      .insert(actasEscaneos)
      .values({
        actaId: acta.id,
        nombre: limpiarNombre(datos.nombre),
        tipo: datos.tipo,
        tamano: datos.contenido.length,
        contenido: datos.contenido,
      })
      .returning({ id: actasEscaneos.id })
      .get().id;
  });
}

export function eliminarEscaneo(db: Db, actaId: number, escaneoId: number) {
  const borrados = db
    .delete(actasEscaneos)
    .where(and(eq(actasEscaneos.id, escaneoId), eq(actasEscaneos.actaId, actaId)))
    .run().changes;
  if (borrados === 0) throw new ErrorDeNegocio("El archivo no pertenece al acta");
}
