/**
 * Consultas de lectura de las actas. Las fotos se leen aparte, solo cuando
 * se muestran, para no cargar imágenes en listados ni fichas.
 */
import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";
import { codigoActa, obtenerFormatoActa, tieneFormatoVigente } from "@/dominio/actas";
import type { EquipoPrecarga, PersonaPrecarga } from "@/dominio/precarga-actas";
import { buscarActasEn, type FiltrosActas } from "./busqueda-actas";
import { db } from "./index";
import {
  actas,
  actasActivos,
  actasEscaneos,
  actasFotos,
  actasVersiones,
  activos,
  asignaciones,
  funcionarios,
  ubicaciones,
} from "./schema";

/**
 * Ids de las fotos de un acta, en orden, agrupados por versión
 * (la clave "vigente" son las del acta actual).
 */
function idsDeFotos(actaId: number) {
  const filas = db
    .select({ id: actasFotos.id, versionId: actasFotos.versionId })
    .from(actasFotos)
    .where(eq(actasFotos.actaId, actaId))
    .orderBy(asc(actasFotos.orden), asc(actasFotos.id))
    .all();
  const porVersion = new Map<number | "vigente", number[]>();
  for (const { id, versionId } of filas) {
    const clave = versionId ?? "vigente";
    porVersion.set(clave, [...(porVersion.get(clave) ?? []), id]);
  }
  return porVersion;
}

/** Acta con sus equipos y sus versiones anteriores (las fotos, solo por id). */
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
      reemplazadaEn: actasVersiones.reemplazadaEn,
    })
    .from(actasVersiones)
    .where(eq(actasVersiones.actaId, id))
    .orderBy(asc(actasVersiones.id))
    .all();

  const fotos = idsDeFotos(id);
  return {
    ...acta,
    fotoIds: fotos.get("vigente") ?? [],
    codigo: codigoActa(acta.tipo, acta.numero),
    equipos,
    versiones: versiones.map((v) => ({ ...v, fotoIds: fotos.get(v.id) ?? [] })),
  };
}

export type ActaCompleta = NonNullable<ReturnType<typeof obtenerActa>>;

/** Si el encabezado y pie guardados en el acta coinciden con la configuración vigente. */
export function actaConFormatoVigente(acta: Pick<ActaCompleta, "tipo" | "datos">) {
  return tieneFormatoVigente(db, acta.tipo, acta.datos);
}

/** Una foto del acta (vigente o de una versión anterior), si pertenece a esa acta. */
export function obtenerFotoActa(actaId: number, fotoId: number) {
  return (
    db
      .select({ contenido: actasFotos.contenido, tipo: actasFotos.tipo })
      .from(actasFotos)
      .where(and(eq(actasFotos.id, fotoId), eq(actasFotos.actaId, actaId)))
      .get() ?? null
  );
}

/** Archivos del acta firmada escaneada, sin su contenido, del más antiguo al más nuevo. */
export function listarEscaneos(actaId: number) {
  return db
    .select({
      id: actasEscaneos.id,
      nombre: actasEscaneos.nombre,
      tipo: actasEscaneos.tipo,
      tamano: actasEscaneos.tamano,
      subidoEn: actasEscaneos.subidoEn,
    })
    .from(actasEscaneos)
    .where(eq(actasEscaneos.actaId, actaId))
    .orderBy(asc(actasEscaneos.id))
    .all();
}

/** Un archivo escaneado con su contenido, si pertenece a esa acta. */
export function obtenerEscaneo(actaId: number, escaneoId: number) {
  return (
    db
      .select({
        nombre: actasEscaneos.nombre,
        tipo: actasEscaneos.tipo,
        contenido: actasEscaneos.contenido,
      })
      .from(actasEscaneos)
      .where(and(eq(actasEscaneos.id, escaneoId), eq(actasEscaneos.actaId, actaId)))
      .get() ?? null
  );
}

// ---------------------------------------------------------------------------
// Historial y búsqueda (la consulta vive en busqueda-actas.ts, que se prueba)
// ---------------------------------------------------------------------------

export function buscarActas(filtros: FiltrosActas) {
  return buscarActasEn(db, filtros);
}

// ---------------------------------------------------------------------------
// Datos para precargar los formularios
// ---------------------------------------------------------------------------

const columnasEquipo = {
  id: activos.id,
  codigo: activos.codigo,
  tipo: activos.tipo,
  marca: activos.marca,
  modelo: activos.modelo,
  serial: activos.serial,
  specs: activos.specs,
  fechaCompra: activos.fechaCompra,
};

function persona(funcionarioId: number): (PersonaPrecarga & { id: number; retirado: boolean }) | null {
  return (
    db
      .select({
        id: funcionarios.id,
        nombre: funcionarios.nombre,
        cargo: funcionarios.cargo,
        telefono: funcionarios.telefono,
        correo: funcionarios.correo,
        ubicacion: ubicaciones.nombre,
        retirado: funcionarios.retirado,
      })
      .from(funcionarios)
      .leftJoin(ubicaciones, eq(ubicaciones.id, funcionarios.ubicacionId))
      .where(eq(funcionarios.id, funcionarioId))
      .get() ?? null
  );
}

/** Funcionario con sus equipos vigentes, para el acta de entrega. */
export function datosNuevaEntrega(funcionarioId: number) {
  const funcionario = persona(funcionarioId);
  if (!funcionario) return null;
  const equipos: EquipoPrecarga[] = db
    .select(columnasEquipo)
    .from(asignaciones)
    .innerJoin(activos, eq(activos.id, asignaciones.activoId))
    .where(and(eq(asignaciones.funcionarioId, funcionarioId), isNull(asignaciones.fechaHasta)))
    .orderBy(asc(activos.codigo))
    .all();
  return { funcionario, equipos, formato: obtenerFormatoActa(db, "entrega") };
}

/** Equipo y su responsable actual (si es un funcionario), para el acta de baja. */
export function datosNuevaBaja(activoId: number) {
  const equipo = db
    .select({ ...columnasEquipo, estado: activos.estado })
    .from(activos)
    .where(eq(activos.id, activoId))
    .get();
  if (!equipo) return null;
  const vigente = db
    .select({ funcionarioId: asignaciones.funcionarioId })
    .from(asignaciones)
    .where(and(eq(asignaciones.activoId, activoId), isNull(asignaciones.fechaHasta)))
    .get();
  const responsable = vigente?.funcionarioId ? persona(vigente.funcionarioId) : null;
  return { equipo, responsable, formato: obtenerFormatoActa(db, "baja") };
}

/** Formato vigente para una nueva acta de inducción. */
export function datosNuevaInduccion() {
  return { formato: obtenerFormatoActa(db, "induccion") };
}

/** Equipos elegidos para el acta de egreso (se ignoran los dados de baja). */
export function datosNuevoEgreso(activoIds: number[]) {
  const equipos: EquipoPrecarga[] =
    activoIds.length === 0
      ? []
      : db
          .select(columnasEquipo)
          .from(activos)
          .where(and(inArray(activos.id, activoIds), ne(activos.estado, "dado_de_baja")))
          .orderBy(asc(activos.codigo))
          .all();
  return { equipos, formato: obtenerFormatoActa(db, "egreso") };
}

/** Equipos que se pueden incluir en un egreso. */
export function listarEquiposParaEgreso() {
  return db
    .select({ id: activos.id, codigo: activos.codigo, tipo: activos.tipo, marca: activos.marca })
    .from(activos)
    .where(ne(activos.estado, "dado_de_baja"))
    .orderBy(asc(activos.codigo))
    .all();
}
