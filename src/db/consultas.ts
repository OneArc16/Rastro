/**
 * Consultas de lectura de la fase 1.
 * Toda la lectura de datos de las pantallas pasa por aquí: las páginas
 * no arman SQL ni conocen los detalles del esquema.
 */
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { siguienteCodigo } from "@/lib/codigos";
import { db } from "./index";
import {
  activos,
  asignaciones,
  configuracion,
  funcionarios,
  mantenimientos,
  TIPOS_ACTIVO,
  ubicaciones,
} from "./schema";

type TipoActivo = (typeof TIPOS_ACTIVO)[number];

/** Condición de asignación vigente: fecha_hasta es null. */
const vigente = isNull(asignaciones.fechaHasta);

export function resumenInicio() {
  const totalActivos = db
    .select({ total: count() })
    .from(activos)
    .get()?.total ?? 0;

  const porEstado = db
    .select({ estado: activos.estado, total: count() })
    .from(activos)
    .groupBy(activos.estado)
    .all();

  const porTipo = db
    .select({ tipo: activos.tipo, total: count() })
    .from(activos)
    .groupBy(activos.tipo)
    .orderBy(desc(count()))
    .all();

  // Disponible = operativo y sin asignación vigente
  const disponibles = db
    .select({ total: count() })
    .from(activos)
    .leftJoin(asignaciones, and(eq(asignaciones.activoId, activos.id), vigente))
    .where(and(eq(activos.estado, "operativo"), isNull(asignaciones.id)))
    .get()?.total ?? 0;

  const totalFuncionarios = db
    .select({ total: count() })
    .from(funcionarios)
    .where(eq(funcionarios.retirado, false))
    .get()?.total ?? 0;

  return { totalActivos, porEstado, porTipo, disponibles, totalFuncionarios };
}

/**
 * Activos con su responsable o ubicación vigente (para el inventario).
 * "ubicacion" es la efectiva: la de la asignación directa o, si el activo
 * está asignado a una persona, la ubicación de esa persona.
 */
export function listarActivos() {
  const ubicacionDelFuncionario = alias(ubicaciones, "ubicacion_funcionario");

  return db
    .select({
      id: activos.id,
      codigo: activos.codigo,
      tipo: activos.tipo,
      marca: activos.marca,
      modelo: activos.modelo,
      serial: activos.serial,
      estado: activos.estado,
      responsable: funcionarios.nombre,
      ubicacionAsignada: ubicaciones.nombre,
      ubicacionResponsable: ubicacionDelFuncionario.nombre,
    })
    .from(activos)
    .leftJoin(asignaciones, and(eq(asignaciones.activoId, activos.id), vigente))
    .leftJoin(funcionarios, eq(funcionarios.id, asignaciones.funcionarioId))
    .leftJoin(ubicaciones, eq(ubicaciones.id, asignaciones.ubicacionId))
    .leftJoin(
      ubicacionDelFuncionario,
      eq(ubicacionDelFuncionario.id, funcionarios.ubicacionId),
    )
    .orderBy(asc(activos.codigo))
    .all()
    .map((fila) => ({
      ...fila,
      ubicacion: fila.ubicacionAsignada ?? fila.ubicacionResponsable,
      disponible:
        fila.estado === "operativo" &&
        fila.responsable === null &&
        fila.ubicacionAsignada === null,
    }));
}

export type FilaInventario = ReturnType<typeof listarActivos>[number];

/** Ficha completa de un activo: datos, historial de asignaciones y mantenimientos. */
export function obtenerFichaActivo(codigo: string) {
  const activo = db.select().from(activos).where(eq(activos.codigo, codigo)).get();
  if (!activo) return null;

  const historial = db
    .select({
      id: asignaciones.id,
      fechaDesde: asignaciones.fechaDesde,
      fechaHasta: asignaciones.fechaHasta,
      motivo: asignaciones.motivo,
      funcionario: funcionarios.nombre,
      ubicacion: ubicaciones.nombre,
    })
    .from(asignaciones)
    .leftJoin(funcionarios, eq(funcionarios.id, asignaciones.funcionarioId))
    .leftJoin(ubicaciones, eq(ubicaciones.id, asignaciones.ubicacionId))
    .where(eq(asignaciones.activoId, activo.id))
    .orderBy(desc(asignaciones.fechaDesde))
    .all();

  const historialMantenimientos = db
    .select()
    .from(mantenimientos)
    .where(eq(mantenimientos.activoId, activo.id))
    .orderBy(desc(mantenimientos.fecha))
    .all();

  const asignacionVigente = historial.find((h) => h.fechaHasta === null) ?? null;

  return { activo, historial, mantenimientos: historialMantenimientos, asignacionVigente };
}

/** Activo por id, para el formulario de edición. */
export function obtenerActivoPorId(id: number) {
  return db.select().from(activos).where(eq(activos.id, id)).get() ?? null;
}

export function obtenerFuncionarioPorId(id: number) {
  return db.select().from(funcionarios).where(eq(funcionarios.id, id)).get() ?? null;
}

/** Código propuesto para cada tipo de activo, a partir de los códigos existentes. */
export function propuestasDeCodigo(): Record<TipoActivo, string> {
  const codigos = db
    .select({ codigo: activos.codigo })
    .from(activos)
    .all()
    .map((fila) => fila.codigo);

  return Object.fromEntries(
    TIPOS_ACTIVO.map((tipo) => [tipo, siguienteCodigo(tipo, codigos)]),
  ) as Record<TipoActivo, string>;
}

/** Ubicaciones para poblar selects de formularios. */
export function listarUbicacionesSimple() {
  return db
    .select({ id: ubicaciones.id, nombre: ubicaciones.nombre })
    .from(ubicaciones)
    .orderBy(asc(ubicaciones.nombre))
    .all();
}

/** Funcionarios activos con su ubicación y cuántos equipos vigentes tienen. */
export function listarFuncionarios() {
  return db
    .select({
      id: funcionarios.id,
      nombre: funcionarios.nombre,
      cargo: funcionarios.cargo,
      telefono: funcionarios.telefono,
      ubicacion: ubicaciones.nombre,
      equiposVigentes: count(asignaciones.id),
    })
    .from(funcionarios)
    .leftJoin(ubicaciones, eq(ubicaciones.id, funcionarios.ubicacionId))
    .leftJoin(
      asignaciones,
      and(eq(asignaciones.funcionarioId, funcionarios.id), vigente),
    )
    .where(eq(funcionarios.retirado, false))
    .groupBy(funcionarios.id)
    .orderBy(asc(funcionarios.nombre))
    .all();
}

export function listarUbicaciones() {
  return db
    .select({
      id: ubicaciones.id,
      nombre: ubicaciones.nombre,
      funcionarios: count(funcionarios.id),
    })
    .from(ubicaciones)
    .leftJoin(
      funcionarios,
      and(eq(funcionarios.ubicacionId, ubicaciones.id), eq(funcionarios.retirado, false)),
    )
    .groupBy(ubicaciones.id)
    .orderBy(asc(ubicaciones.nombre))
    .all();
}

/** Mantenimientos con su activo, los más recientes primero. */
export function listarMantenimientos() {
  return db
    .select({
      id: mantenimientos.id,
      fecha: mantenimientos.fecha,
      proximaFecha: mantenimientos.proximaFecha,
      tipo: mantenimientos.tipo,
      observacion: mantenimientos.observacion,
      activoCodigo: activos.codigo,
      activoMarca: activos.marca,
      activoModelo: activos.modelo,
    })
    .from(mantenimientos)
    .innerJoin(activos, eq(activos.id, mantenimientos.activoId))
    .orderBy(desc(mantenimientos.fecha))
    .all();
}

export function obtenerConfiguracion() {
  return db.select().from(configuracion).where(eq(configuracion.id, 1)).get() ?? null;
}
