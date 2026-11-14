/**
 * Consultas de lectura de la fase 1.
 * Toda la lectura de datos de las pantallas pasa por aquí: las páginas
 * no arman SQL ni conocen los detalles del esquema.
 */
import { and, asc, count, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import type { DatosHojaDeVida } from "@/dominio/hoja-de-vida";
import { garantiasPorVencer, pendientesDeMantenimiento } from "@/dominio/mantenimientos";
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

  // Misma definición de "disponible" que el inventario
  const disponibles = listarActivos().filter((activo) => activo.disponible);

  const totalFuncionarios = db
    .select({ total: count() })
    .from(funcionarios)
    .where(eq(funcionarios.retirado, false))
    .get()?.total ?? 0;

  return { totalActivos, porEstado, porTipo, disponibles, totalFuncionarios };
}

/** Mantenimientos vencidos y próximos a la fecha dada. */
export function alertasDeMantenimiento(hoy: string) {
  const lista = db
    .select({
      id: mantenimientos.id,
      activoId: mantenimientos.activoId,
      codigo: activos.codigo,
      estadoActivo: activos.estado,
      fecha: mantenimientos.fecha,
      proximaFecha: mantenimientos.proximaFecha,
      tipo: mantenimientos.tipo,
    })
    .from(mantenimientos)
    .innerJoin(activos, eq(activos.id, mantenimientos.activoId))
    .all();
  return pendientesDeMantenimiento(lista, hoy);
}

/** Activos cuya garantía vence pronto, a la fecha dada. */
export function alertasDeGarantia(hoy: string) {
  const lista = db
    .select({
      id: activos.id,
      codigo: activos.codigo,
      tipo: activos.tipo,
      garantiaHasta: activos.garantiaHasta,
      estado: activos.estado,
    })
    .from(activos)
    .all();
  return garantiasPorVencer(lista, hoy);
}

/** Activos que admiten mantenimiento (no dados de baja), para el registro rápido. */
export function listarActivosParaMantenimiento() {
  return db
    .select({
      id: activos.id,
      codigo: activos.codigo,
      tipo: activos.tipo,
      marca: activos.marca,
      modelo: activos.modelo,
    })
    .from(activos)
    .where(ne(activos.estado, "dado_de_baja"))
    .orderBy(asc(activos.codigo))
    .all();
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
      funcionarioId: asignaciones.funcionarioId,
      ubicacionId: asignaciones.ubicacionId,
      funcionario: funcionarios.nombre,
      ubicacion: ubicaciones.nombre,
    })
    .from(asignaciones)
    .leftJoin(funcionarios, eq(funcionarios.id, asignaciones.funcionarioId))
    .leftJoin(ubicaciones, eq(ubicaciones.id, asignaciones.ubicacionId))
    .where(eq(asignaciones.activoId, activo.id))
    .orderBy(desc(asignaciones.fechaDesde), desc(asignaciones.id))
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

/** Posibles destinos de una asignación: funcionarios no retirados y ubicaciones. */
export function listarDestinos() {
  const funcionariosActivos = db
    .select({ id: funcionarios.id, nombre: funcionarios.nombre })
    .from(funcionarios)
    .where(eq(funcionarios.retirado, false))
    .orderBy(asc(funcionarios.nombre))
    .all();
  return { funcionarios: funcionariosActivos, ubicaciones: listarUbicacionesSimple() };
}

export type Destinos = ReturnType<typeof listarDestinos>;

/** Activos con asignación vigente, para elegir la contraparte de un intercambio. */
export function listarActivosAsignados() {
  return db
    .select({
      id: activos.id,
      codigo: activos.codigo,
      tipo: activos.tipo,
      responsable: funcionarios.nombre,
      ubicacion: ubicaciones.nombre,
    })
    .from(activos)
    .innerJoin(asignaciones, and(eq(asignaciones.activoId, activos.id), vigente))
    .leftJoin(funcionarios, eq(funcionarios.id, asignaciones.funcionarioId))
    .leftJoin(ubicaciones, eq(ubicaciones.id, asignaciones.ubicacionId))
    .orderBy(asc(activos.codigo))
    .all();
}

/** Ficha de funcionario: datos, equipos vigentes e historial completo. */
export function obtenerFichaFuncionario(id: number) {
  const funcionario = db
    .select({
      id: funcionarios.id,
      nombre: funcionarios.nombre,
      cargo: funcionarios.cargo,
      telefono: funcionarios.telefono,
      retirado: funcionarios.retirado,
      ubicacion: ubicaciones.nombre,
    })
    .from(funcionarios)
    .leftJoin(ubicaciones, eq(ubicaciones.id, funcionarios.ubicacionId))
    .where(eq(funcionarios.id, id))
    .get();
  if (!funcionario) return null;

  const historial = db
    .select({
      id: asignaciones.id,
      fechaDesde: asignaciones.fechaDesde,
      fechaHasta: asignaciones.fechaHasta,
      motivo: asignaciones.motivo,
      activoCodigo: activos.codigo,
      activoTipo: activos.tipo,
      activoMarca: activos.marca,
      activoModelo: activos.modelo,
    })
    .from(asignaciones)
    .innerJoin(activos, eq(activos.id, asignaciones.activoId))
    .where(eq(asignaciones.funcionarioId, id))
    .orderBy(desc(asignaciones.fechaDesde), desc(asignaciones.id))
    .all();

  return {
    funcionario,
    vigentes: historial.filter((h) => h.fechaHasta === null),
    historial,
  };
}

/** Todo lo que necesita la hoja de vida de un funcionario, ya consultado. */
export function obtenerDatosHojaDeVida(funcionarioId: number): DatosHojaDeVida | null {
  const funcionario = db
    .select({
      nombre: funcionarios.nombre,
      telefono: funcionarios.telefono,
      ubicacionId: funcionarios.ubicacionId,
      ubicacion: ubicaciones.nombre,
    })
    .from(funcionarios)
    .leftJoin(ubicaciones, eq(ubicaciones.id, funcionarios.ubicacionId))
    .where(eq(funcionarios.id, funcionarioId))
    .get();
  if (!funcionario) return null;

  const asignados = db
    .select({ activo: activos, fechaDesde: asignaciones.fechaDesde })
    .from(asignaciones)
    .innerJoin(activos, eq(activos.id, asignaciones.activoId))
    .where(and(eq(asignaciones.funcionarioId, funcionarioId), vigente))
    .all();

  const ids = asignados.map((a) => a.activo.id);
  const movimientos = ids.length
    ? db.select().from(asignaciones).where(inArray(asignaciones.activoId, ids)).all()
    : [];
  const historialMantenimiento = ids.length
    ? db.select().from(mantenimientos).where(inArray(mantenimientos.activoId, ids)).all()
    : [];

  const ultimoMovimiento = (activoId: number) =>
    movimientos
      .filter((m) => m.activoId === activoId)
      .flatMap((m) => [m.fechaDesde, m.fechaHasta ?? m.fechaDesde])
      .reduce((mayor, fecha) => (fecha > mayor ? fecha : mayor), "");

  const impresorasDeUbicacion =
    funcionario.ubicacionId === null
      ? []
      : db
          .select({ activo: activos })
          .from(asignaciones)
          .innerJoin(activos, eq(activos.id, asignaciones.activoId))
          .where(
            and(
              eq(asignaciones.ubicacionId, funcionario.ubicacionId),
              eq(activos.tipo, "impresora"),
              vigente,
            ),
          )
          .orderBy(asc(activos.codigo))
          .all()
          .map((fila) => fila.activo);

  const historial = db
    .select({
      codigo: activos.codigo,
      tipo: activos.tipo,
      fechaDesde: asignaciones.fechaDesde,
      fechaHasta: asignaciones.fechaHasta,
      motivo: asignaciones.motivo,
    })
    .from(asignaciones)
    .innerJoin(activos, eq(activos.id, asignaciones.activoId))
    .where(eq(asignaciones.funcionarioId, funcionarioId))
    .orderBy(asc(asignaciones.fechaDesde), asc(asignaciones.id))
    .all();

  return {
    funcionario: {
      nombre: funcionario.nombre,
      telefono: funcionario.telefono,
      ubicacion: funcionario.ubicacion,
    },
    configuracion: obtenerConfiguracion(),
    vigentes: asignados.map(({ activo, fechaDesde }) => ({
      activo,
      fechaDesde,
      ultimoMovimiento: ultimoMovimiento(activo.id),
      mantenimientos: historialMantenimiento.filter((m) => m.activoId === activo.id),
    })),
    impresorasDeUbicacion,
    historial,
  };
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

/** Ubicaciones con sus funcionarios activos y sus equipos compartidos vigentes. */
export function listarUbicaciones() {
  const lista = db
    .select({ id: ubicaciones.id, nombre: ubicaciones.nombre })
    .from(ubicaciones)
    .orderBy(asc(ubicaciones.nombre))
    .all();

  const personas = db
    .select({
      id: funcionarios.id,
      nombre: funcionarios.nombre,
      ubicacionId: funcionarios.ubicacionId,
    })
    .from(funcionarios)
    .where(eq(funcionarios.retirado, false))
    .orderBy(asc(funcionarios.nombre))
    .all();

  const compartidos = db
    .select({
      codigo: activos.codigo,
      tipo: activos.tipo,
      ubicacionId: asignaciones.ubicacionId,
    })
    .from(asignaciones)
    .innerJoin(activos, eq(activos.id, asignaciones.activoId))
    .where(vigente)
    .orderBy(asc(activos.codigo))
    .all();

  return lista.map((ubicacion) => ({
    ...ubicacion,
    funcionarios: personas.filter((p) => p.ubicacionId === ubicacion.id),
    equiposCompartidos: compartidos.filter((c) => c.ubicacionId === ubicacion.id),
  }));
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
