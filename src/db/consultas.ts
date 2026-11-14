/**
 * Consultas de lectura de la fase 1.
 * Toda la lectura de datos de las pantallas pasa por aquí: las páginas
 * no arman SQL ni conocen los detalles del esquema.
 */
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "./index";
import {
  activos,
  asignaciones,
  configuracion,
  funcionarios,
  mantenimientos,
  ubicaciones,
} from "./schema";

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

/** Activos con su responsable o ubicación vigente (para el inventario). */
export function listarActivos() {
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
      ubicacion: ubicaciones.nombre,
    })
    .from(activos)
    .leftJoin(asignaciones, and(eq(asignaciones.activoId, activos.id), vigente))
    .leftJoin(funcionarios, eq(funcionarios.id, asignaciones.funcionarioId))
    .leftJoin(ubicaciones, eq(ubicaciones.id, asignaciones.ubicacionId))
    .orderBy(asc(activos.codigo))
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
