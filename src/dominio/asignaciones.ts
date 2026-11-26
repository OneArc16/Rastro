/**
 * Reglas de negocio de las asignaciones (fase 3).
 * Toda operación que toca más de una fila corre en una sola transacción:
 * si algo falla, no queda ningún cambio a medias.
 */
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db";
import { activos, asignaciones, funcionarios, ubicaciones } from "@/db/schema";
import { formatearFecha } from "@/lib/fechas";
import { ErrorDeNegocio, validarFecha } from "./comunes";

export type Destino = { funcionarioId: number } | { ubicacionId: number };

/**
 * Al trasladar un equipo a un funcionario de otra ubicación: si es el
 * funcionario el que se va a la ubicación del equipo, o el equipo el que va
 * a la ubicación del funcionario.
 */
export type QuienSeMueve = "funcionario" | "equipo";

export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// ---------------------------------------------------------------------------
// Validaciones internas
// ---------------------------------------------------------------------------

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

/**
 * Ubicación donde está hoy el activo: la de su asignación si es compartido,
 * o la de su responsable si está asignado a un funcionario.
 */
export function ubicacionActualDelActivo(tx: Db | Tx, activoId: number): number | null {
  const vigente = obtenerVigente(tx as Tx, activoId);
  if (!vigente) return null;
  if (vigente.ubicacionId !== null) return vigente.ubicacionId;
  return (
    tx
      .select({ ubicacionId: funcionarios.ubicacionId })
      .from(funcionarios)
      .where(eq(funcionarios.id, vigente.funcionarioId as number))
      .get()?.ubicacionId ?? null
  );
}

function nombreUbicacion(tx: Tx, ubicacionId: number) {
  return tx.select().from(ubicaciones).where(eq(ubicaciones.id, ubicacionId)).get()?.nombre ?? "";
}

/**
 * Si el equipo va a un funcionario que está en otra ubicación, exige saber
 * quién se mueve; si se va el funcionario, actualiza su ubicación.
 */
function resolverUbicacion(
  tx: Tx,
  activoId: number,
  destino: Destino,
  seMueve: QuienSeMueve | undefined,
) {
  if (!("funcionarioId" in destino)) return;
  const delEquipo = ubicacionActualDelActivo(tx, activoId);
  if (delEquipo === null) return;
  const funcionario = tx
    .select()
    .from(funcionarios)
    .where(eq(funcionarios.id, destino.funcionarioId))
    .get();
  if (!funcionario || funcionario.ubicacionId === delEquipo) return;

  if (!seMueve) {
    const equipoVa =
      funcionario.ubicacionId === null
        ? `si el equipo queda con ${funcionario.nombre}, que no tiene ubicación`
        : `si el equipo va a ${nombreUbicacion(tx, funcionario.ubicacionId)}`;
    throw new ErrorDeNegocio(
      `Indique si ${funcionario.nombre} se va a ${nombreUbicacion(tx, delEquipo)} (la ubicación del equipo) o ${equipoVa}`,
    );
  }
  if (seMueve === "funcionario") {
    tx.update(funcionarios).set({ ubicacionId: delEquipo }).where(eq(funcionarios.id, funcionario.id)).run();
  }
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

type DatosTrasladar = DatosAsignar & { seMueve?: QuienSeMueve };

export function asignar(db: Db, datos: DatosAsignar) {
  db.transaction((tx) => asignarEn(tx, datos));
}

/** Igual que asignar, dentro de una transacción ya abierta. */
export function asignarEn(tx: Tx, datos: DatosAsignar) {
  validarFecha(datos.fecha);
  const activo = obtenerActivoUtilizable(tx, datos.activoId);
  if (obtenerVigente(tx, activo.id)) {
    throw new ErrorDeNegocio(
      `El activo ${activo.codigo} ya está asignado; use "Trasladar"`,
    );
  }
  validarDestino(tx, datos.destino);
  abrir(tx, activo.id, datos.destino, datos.fecha, datos.motivo);
}

export function trasladar(db: Db, datos: DatosTrasladar) {
  db.transaction((tx) => trasladarEn(tx, datos));
}

/** Igual que trasladar, dentro de una transacción ya abierta. */
export function trasladarEn(tx: Tx, datos: DatosTrasladar) {
  validarFecha(datos.fecha);
  const activo = obtenerActivoUtilizable(tx, datos.activoId);
  const vigente = exigirVigente(tx, activo.id, activo.codigo);
  if (mismoDestino(destinoDe(vigente), datos.destino)) {
    throw new ErrorDeNegocio("El activo ya está asignado a ese destino");
  }
  validarDestino(tx, datos.destino);
  // Antes de cerrar la vigente: la ubicación del equipo sale de ella
  resolverUbicacion(tx, activo.id, datos.destino, datos.seMueve);
  cerrar(tx, vigente, datos.fecha);
  abrir(tx, activo.id, datos.destino, datos.fecha, datos.motivo);
}

/**
 * Deja el activo en el destino: lo asigna si está disponible, lo traslada si
 * está en otro lado y no hace nada si ya está ahí.
 */
export function llevarADestinoEn(tx: Tx, datos: DatosTrasladar) {
  validarFecha(datos.fecha);
  const activo = obtenerActivoUtilizable(tx, datos.activoId);
  const vigente = obtenerVigente(tx, activo.id);
  if (!vigente) return asignarEn(tx, datos);
  if (mismoDestino(destinoDe(vigente), datos.destino)) return;
  trasladarEn(tx, datos);
}

export function devolver(db: Db, datos: { activoId: number; fecha: string }) {
  validarFecha(datos.fecha);
  db.transaction((tx) => {
    const activo = obtenerActivo(tx, datos.activoId);
    const vigente = exigirVigente(tx, activo.id, activo.codigo);
    cerrar(tx, vigente, datos.fecha);
  });
}

/**
 * Deja varios equipos a cargo de un funcionario en una sola operación:
 * asigna los disponibles, trae los que están con otro y deja igual los que ya
 * tiene. Los equipos van al funcionario: su ubicación no cambia.
 */
export function asignarVarios(
  db: Db,
  datos: { funcionarioId: number; activoIds: number[]; fecha: string; motivo?: string },
) {
  validarFecha(datos.fecha);
  if (datos.activoIds.length === 0) {
    throw new ErrorDeNegocio("Seleccione al menos un equipo");
  }
  const destino = { funcionarioId: datos.funcionarioId };

  db.transaction((tx) => {
    validarDestino(tx, destino);
    for (const activoId of new Set(datos.activoIds)) {
      llevarADestinoEn(tx, {
        activoId,
        destino,
        fecha: datos.fecha,
        motivo: datos.motivo,
        seMueve: "equipo",
      });
    }
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

/**
 * Dos funcionarios cambian de puesto: cada uno queda con todos los equipos
 * del otro y con su ubicación, en una sola operación.
 */
export function cruzarPuestos(
  db: Db,
  datos: { funcionarioAId: number; funcionarioBId: number; fecha: string; motivo?: string },
) {
  validarFecha(datos.fecha);
  if (datos.funcionarioAId === datos.funcionarioBId) {
    throw new ErrorDeNegocio("Seleccione dos funcionarios distintos");
  }

  db.transaction((tx) => {
    const a = obtenerFuncionarioActivo(tx, datos.funcionarioAId);
    const b = obtenerFuncionarioActivo(tx, datos.funcionarioBId);
    const vigentesA = vigentesDeFuncionario(tx, a.id);
    const vigentesB = vigentesDeFuncionario(tx, b.id);

    for (const vigente of vigentesA) {
      cerrar(tx, vigente, datos.fecha);
      abrir(tx, vigente.activoId, { funcionarioId: b.id }, datos.fecha, datos.motivo);
    }
    for (const vigente of vigentesB) {
      cerrar(tx, vigente, datos.fecha);
      abrir(tx, vigente.activoId, { funcionarioId: a.id }, datos.fecha, datos.motivo);
    }

    tx.update(funcionarios).set({ ubicacionId: b.ubicacionId }).where(eq(funcionarios.id, a.id)).run();
    tx.update(funcionarios).set({ ubicacionId: a.ubicacionId }).where(eq(funcionarios.id, b.id)).run();
  });
}

function obtenerFuncionarioActivo(tx: Tx, funcionarioId: number) {
  validarDestino(tx, { funcionarioId });
  return tx.select().from(funcionarios).where(eq(funcionarios.id, funcionarioId)).get()!;
}

function vigentesDeFuncionario(tx: Tx, funcionarioId: number) {
  return tx
    .select()
    .from(asignaciones)
    .where(and(eq(asignaciones.funcionarioId, funcionarioId), isNull(asignaciones.fechaHasta)))
    .all();
}

type DatosBaja = { activoId: number; fecha: string; motivo?: string };

export function darDeBaja(db: Db, datos: DatosBaja) {
  db.transaction((tx) => darDeBajaEn(tx, datos));
}

/** Igual que darDeBaja, dentro de una transacción ya abierta. */
export function darDeBajaEn(tx: Tx, datos: DatosBaja) {
  validarFecha(datos.fecha);
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
