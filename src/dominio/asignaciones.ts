/**
 * Reglas de negocio de las asignaciones (fase 3).
 * Toda operación que toca más de una fila corre en una sola transacción:
 * si algo falla, no queda ningún cambio a medias.
 */
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db";
import { activos, asignaciones, funcionarios, ubicaciones } from "@/db/schema";
import { formatearFecha } from "@/lib/fechas";
import { FORMATO_FECHA_ISO } from "@/lib/validacion/comunes";

/** Error esperado por una regla de negocio; su mensaje se muestra al usuario. */
export class ErrorDeNegocio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorDeNegocio";
  }
}

export type Destino = { funcionarioId: number } | { ubicacionId: number };

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// ---------------------------------------------------------------------------
// Validaciones internas
// ---------------------------------------------------------------------------

function validarFecha(fecha: string) {
  if (!FORMATO_FECHA_ISO.test(fecha)) {
    throw new ErrorDeNegocio("La fecha debe tener el formato AAAA-MM-DD");
  }
}

function obtenerActivo(tx: Tx, activoId: number) {
  const activo = tx.select().from(activos).where(eq(activos.id, activoId)).get();
  if (!activo) throw new ErrorDeNegocio("El activo no existe");
  return activo;
}

function obtenerActivoUtilizable(tx: Tx, activoId: number) {
  const activo = obtenerActivo(tx, activoId);
  if (activo.estado === "dado_de_baja") {
    throw new ErrorDeNegocio(`El activo ${activo.codigo} está dado de baja`);
  }
  return activo;
}

function obtenerVigente(tx: Tx, activoId: number) {
  return (
    tx
      .select()
      .from(asignaciones)
      .where(and(eq(asignaciones.activoId, activoId), isNull(asignaciones.fechaHasta)))
      .get() ?? null
  );
}

function exigirVigente(tx: Tx, activoId: number, codigo: string) {
  const vigente = obtenerVigente(tx, activoId);
  if (!vigente) {
    throw new ErrorDeNegocio(`El activo ${codigo} no tiene una asignación vigente`);
  }
  return vigente;
}

function validarDestino(tx: Tx, destino: Destino) {
  if ("funcionarioId" in destino) {
    const funcionario = tx
      .select()
      .from(funcionarios)
      .where(eq(funcionarios.id, destino.funcionarioId))
      .get();
    if (!funcionario) throw new ErrorDeNegocio("El funcionario no existe");
    if (funcionario.retirado) {
      throw new ErrorDeNegocio(`${funcionario.nombre} está retirado`);
    }
    return;
  }

  const ubicacion = tx
    .select()
    .from(ubicaciones)
    .where(eq(ubicaciones.id, destino.ubicacionId))
    .get();
  if (!ubicacion) throw new ErrorDeNegocio("La ubicación no existe");
}

function destinoDe(asignacion: typeof asignaciones.$inferSelect): Destino {
  return asignacion.funcionarioId !== null
    ? { funcionarioId: asignacion.funcionarioId }
    : { ubicacionId: asignacion.ubicacionId as number };
}

function mismoDestino(a: Destino, b: Destino): boolean {
  if ("funcionarioId" in a && "funcionarioId" in b) {
    return a.funcionarioId === b.funcionarioId;
  }
  if ("ubicacionId" in a && "ubicacionId" in b) {
    return a.ubicacionId === b.ubicacionId;
  }
  return false;
}

/** Cierra una asignación vigente; la fecha no puede ser anterior a su inicio. */
function cerrar(tx: Tx, vigente: typeof asignaciones.$inferSelect, fecha: string) {
  if (fecha < vigente.fechaDesde) {
    throw new ErrorDeNegocio(
      `La fecha no puede ser anterior al ${formatearFecha(vigente.fechaDesde)}, inicio de la asignación actual`,
    );
  }
  tx.update(asignaciones)
    .set({ fechaHasta: fecha })
    .where(eq(asignaciones.id, vigente.id))
    .run();
}

function abrir(
  tx: Tx,
  activoId: number,
  destino: Destino,
  fecha: string,
  motivo: string | undefined,
) {
  tx.insert(asignaciones)
    .values({
      activoId,
      funcionarioId: "funcionarioId" in destino ? destino.funcionarioId : null,
      ubicacionId: "ubicacionId" in destino ? destino.ubicacionId : null,
      fechaDesde: fecha,
      motivo: motivo ?? null,
    })
    .run();
}

// ---------------------------------------------------------------------------
// Operaciones
// ---------------------------------------------------------------------------

type DatosAsignar = {
  activoId: number;
  destino: Destino;
  fecha: string;
  motivo?: string;
};

export function asignar(db: Db, datos: DatosAsignar) {
  validarFecha(datos.fecha);
  db.transaction((tx) => {
    const activo = obtenerActivoUtilizable(tx, datos.activoId);
    if (obtenerVigente(tx, activo.id)) {
      throw new ErrorDeNegocio(
        `El activo ${activo.codigo} ya está asignado; use "Trasladar"`,
      );
    }
    validarDestino(tx, datos.destino);
    abrir(tx, activo.id, datos.destino, datos.fecha, datos.motivo);
  });
}

export function trasladar(db: Db, datos: DatosAsignar) {
  validarFecha(datos.fecha);
  db.transaction((tx) => {
    const activo = obtenerActivoUtilizable(tx, datos.activoId);
    const vigente = exigirVigente(tx, activo.id, activo.codigo);
    if (mismoDestino(destinoDe(vigente), datos.destino)) {
      throw new ErrorDeNegocio("El activo ya está asignado a ese destino");
    }
    validarDestino(tx, datos.destino);
    cerrar(tx, vigente, datos.fecha);
    abrir(tx, activo.id, datos.destino, datos.fecha, datos.motivo);
  });
}

export function devolver(db: Db, datos: { activoId: number; fecha: string }) {
  validarFecha(datos.fecha);
  db.transaction((tx) => {
    const activo = obtenerActivo(tx, datos.activoId);
    const vigente = exigirVigente(tx, activo.id, activo.codigo);
    cerrar(tx, vigente, datos.fecha);
  });
}

/** Cambio de equipo entre dos responsables: cada uno queda con el activo del otro. */
export function intercambiar(
  db: Db,
  datos: { activoAId: number; activoBId: number; fecha: string; motivo?: string },
) {
  validarFecha(datos.fecha);
  if (datos.activoAId === datos.activoBId) {
    throw new ErrorDeNegocio("Seleccione dos activos distintos");
  }

  db.transaction((tx) => {
    const activoA = obtenerActivoUtilizable(tx, datos.activoAId);
    const activoB = obtenerActivoUtilizable(tx, datos.activoBId);
    const vigenteA = exigirVigente(tx, activoA.id, activoA.codigo);
    const vigenteB = exigirVigente(tx, activoB.id, activoB.codigo);

    const destinoA = destinoDe(vigenteA);
    const destinoB = destinoDe(vigenteB);
    if (mismoDestino(destinoA, destinoB)) {
      throw new ErrorDeNegocio("Los dos activos tienen el mismo responsable");
    }

    cerrar(tx, vigenteA, datos.fecha);
    cerrar(tx, vigenteB, datos.fecha);
    abrir(tx, activoA.id, destinoB, datos.fecha, datos.motivo);
    abrir(tx, activoB.id, destinoA, datos.fecha, datos.motivo);
  });
}

export function darDeBaja(
  db: Db,
  datos: { activoId: number; fecha: string; motivo?: string },
) {
  validarFecha(datos.fecha);
  db.transaction((tx) => {
    const activo = obtenerActivoUtilizable(tx, datos.activoId);
    const vigente = obtenerVigente(tx, activo.id);
    if (vigente) cerrar(tx, vigente, datos.fecha);

    const nota = `Dado de baja el ${formatearFecha(datos.fecha)}${datos.motivo ? `: ${datos.motivo}` : ""}`;
    tx.update(activos)
      .set({
        estado: "dado_de_baja",
        observaciones: activo.observaciones ? `${activo.observaciones}\n${nota}` : nota,
      })
      .where(eq(activos.id, activo.id))
      .run();
  });
}

export function retirarFuncionario(
  db: Db,
  datos: { funcionarioId: number; fecha: string },
) {
  validarFecha(datos.fecha);
  db.transaction((tx) => {
    const funcionario = tx
      .select()
      .from(funcionarios)
      .where(eq(funcionarios.id, datos.funcionarioId))
      .get();
    if (!funcionario) throw new ErrorDeNegocio("El funcionario no existe");
    if (funcionario.retirado) {
      throw new ErrorDeNegocio(`${funcionario.nombre} ya está retirado`);
    }

    const vigentes = tx
      .select()
      .from(asignaciones)
      .where(
        and(
          eq(asignaciones.funcionarioId, funcionario.id),
          isNull(asignaciones.fechaHasta),
        ),
      )
      .all();
    for (const vigente of vigentes) cerrar(tx, vigente, datos.fecha);

    tx.update(funcionarios)
      .set({ retirado: true })
      .where(eq(funcionarios.id, funcionario.id))
      .run();
  });
}
