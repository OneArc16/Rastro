/**
 * Reglas de los mantenimientos (fase 5): registro y alertas de fechas.
 * Las alertas son funciones puras que reciben "hoy" como parámetro.
 */
import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import {
  activos,
  mantenimientos,
  type ESTADOS_ACTIVO,
  type TIPOS_MANTENIMIENTO,
} from "@/db/schema";
import { formatearFecha, sumarDias } from "@/lib/fechas";
import { ErrorDeNegocio, validarFecha } from "./comunes";

type TipoMantenimiento = (typeof TIPOS_MANTENIMIENTO)[number];
type EstadoActivo = (typeof ESTADOS_ACTIVO)[number];

/** Ventana de aviso para mantenimientos próximos (asunción A2). */
export const DIAS_AVISO_MANTENIMIENTO = 30;
/** Ventana de aviso para garantías por vencer (asunción A3). */
export const DIAS_AVISO_GARANTIA = 60;

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export function registrarMantenimiento(
  db: Db,
  datos: {
    activoId: number;
    fecha: string;
    proximaFecha?: string;
    tipo: TipoMantenimiento;
    observacion?: string;
  },
) {
  validarFecha(datos.fecha);
  if (datos.proximaFecha) {
    validarFecha(datos.proximaFecha);
    if (datos.proximaFecha <= datos.fecha) {
      throw new ErrorDeNegocio(
        `La próxima fecha debe ser posterior al ${formatearFecha(datos.fecha)}`,
      );
    }
  }

  const activo = db.select().from(activos).where(eq(activos.id, datos.activoId)).get();
  if (!activo) throw new ErrorDeNegocio("El activo no existe");
  if (activo.estado === "dado_de_baja") {
    throw new ErrorDeNegocio(`El activo ${activo.codigo} está dado de baja`);
  }

  db.insert(mantenimientos)
    .values({
      activoId: activo.id,
      fecha: datos.fecha,
      proximaFecha: datos.proximaFecha ?? null,
      tipo: datos.tipo,
      observacion: datos.observacion ?? null,
    })
    .run();
}

// ---------------------------------------------------------------------------
// Alertas
// ---------------------------------------------------------------------------

export type MantenimientoConActivo = {
  id: number;
  activoId: number;
  codigo: string;
  estadoActivo: EstadoActivo;
  fecha: string;
  proximaFecha: string | null;
  tipo: TipoMantenimiento;
};

export type Pendiente = {
  activoId: number;
  codigo: string;
  ultimaFecha: string;
  proximaFecha: string;
  tipo: TipoMantenimiento;
};

/**
 * Mantenimientos vencidos y próximos. Cada activo cuenta una sola vez, con
 * la próxima fecha de su mantenimiento más reciente (asunción A1).
 */
export function pendientesDeMantenimiento(
  lista: MantenimientoConActivo[],
  hoy: string,
  diasAviso = DIAS_AVISO_MANTENIMIENTO,
): { vencidos: Pendiente[]; proximos: Pendiente[] } {
  const masReciente = new Map<number, MantenimientoConActivo>();
  for (const m of lista) {
    const actual = masReciente.get(m.activoId);
    const esMasNuevo =
      !actual || m.fecha > actual.fecha || (m.fecha === actual.fecha && m.id > actual.id);
    if (esMasNuevo) masReciente.set(m.activoId, m);
  }

  const limite = sumarDias(hoy, diasAviso);
  const pendientes: Pendiente[] = [...masReciente.values()]
    .filter((m) => m.estadoActivo !== "dado_de_baja" && m.proximaFecha !== null)
    .map((m) => ({
      activoId: m.activoId,
      codigo: m.codigo,
      ultimaFecha: m.fecha,
      proximaFecha: m.proximaFecha as string,
      tipo: m.tipo,
    }))
    .sort((a, b) => a.proximaFecha.localeCompare(b.proximaFecha));

  return {
    vencidos: pendientes.filter((p) => p.proximaFecha < hoy),
    proximos: pendientes.filter((p) => p.proximaFecha >= hoy && p.proximaFecha <= limite),
  };
}

export type ActivoConGarantia = {
  id: number;
  codigo: string;
  garantiaHasta: string | null;
  estado: EstadoActivo;
};

/** Garantías que vencen desde hoy hasta la ventana de aviso (asunción A3). */
export function garantiasPorVencer<T extends ActivoConGarantia>(
  lista: T[],
  hoy: string,
  diasAviso = DIAS_AVISO_GARANTIA,
): T[] {
  const limite = sumarDias(hoy, diasAviso);
  return lista
    .filter(
      (a) =>
        a.estado !== "dado_de_baja" &&
        a.garantiaHasta !== null &&
        a.garantiaHasta >= hoy &&
        a.garantiaHasta <= limite,
    )
    .sort((a, b) => (a.garantiaHasta as string).localeCompare(b.garantiaHasta as string));
}
