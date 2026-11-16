/**
 * Consultas de lectura de las actas. Las fotos se leen aparte, solo cuando
 * se muestran, para no cargar imágenes en listados ni fichas.
 */
import { asc, eq } from "drizzle-orm";
import { codigoActa } from "@/dominio/actas";
import { db } from "./index";
import { actas, actasActivos, actasVersiones, activos } from "./schema";

/** Acta con sus equipos y sus versiones anteriores (sin fotos). */
export function obtenerActa(id: number) {
  const acta = db
    .select({
      id: actas.id,
      tipo: actas.tipo,
      numero: actas.numero,
      fecha: actas.fecha,
      funcionarioId: actas.funcionarioId,
      ubicacionId: actas.ubicacionId,
      datos: actas.datos,
      tieneFoto: actas.fotoTipo,
      creadaEn: actas.creadaEn,
      editadaEn: actas.editadaEn,
    })
    .from(actas)
    .where(eq(actas.id, id))
    .get();
  if (!acta) return null;

  const equipos = db
    .select({ id: activos.id, codigo: activos.codigo, tipo: activos.tipo })
    .from(actasActivos)
    .innerJoin(activos, eq(activos.id, actasActivos.activoId))
    .where(eq(actasActivos.actaId, id))
    .orderBy(asc(activos.codigo))
    .all();

  const versiones = db
    .select({
      id: actasVersiones.id,
      fecha: actasVersiones.fecha,
      datos: actasVersiones.datos,
      tieneFoto: actasVersiones.fotoTipo,
      reemplazadaEn: actasVersiones.reemplazadaEn,
    })
    .from(actasVersiones)
    .where(eq(actasVersiones.actaId, id))
    .orderBy(asc(actasVersiones.id))
    .all();

  return {
    ...acta,
    tieneFoto: acta.tieneFoto !== null,
    codigo: codigoActa(acta.tipo, acta.numero),
    equipos,
    versiones: versiones.map((v) => ({ ...v, tieneFoto: v.tieneFoto !== null })),
  };
}

export type ActaCompleta = NonNullable<ReturnType<typeof obtenerActa>>;

/** Foto del acta o de una de sus versiones anteriores. */
export function obtenerFotoActa(actaId: number, versionId?: number) {
  if (versionId === undefined) {
    const fila = db
      .select({ contenido: actas.foto, tipo: actas.fotoTipo })
      .from(actas)
      .where(eq(actas.id, actaId))
      .get();
    return fila?.contenido && fila.tipo ? { contenido: fila.contenido, tipo: fila.tipo } : null;
  }
  const fila = db
    .select({
      actaId: actasVersiones.actaId,
      contenido: actasVersiones.foto,
      tipo: actasVersiones.fotoTipo,
    })
    .from(actasVersiones)
    .where(eq(actasVersiones.id, versionId))
    .get();
  if (!fila || fila.actaId !== actaId || !fila.contenido || !fila.tipo) return null;
  return { contenido: fila.contenido, tipo: fila.tipo };
}
