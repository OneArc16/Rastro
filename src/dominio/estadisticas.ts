/**
 * Cálculos del módulo de gráficas de mantenimientos.
 * Funciones puras: reciben las filas ya leídas y "hoy" como parámetro.
 */
import type { TIPOS_MANTENIMIENTO } from "@/db/schema";
import { pendientesDeMantenimiento, type MantenimientoConActivo } from "./mantenimientos";

export type FilaEstadistica = {
  activoId: number;
  fecha: string; // "AAAA-MM-DD"
  tipo: (typeof TIPOS_MANTENIMIENTO)[number];
  ubicacion: string | null;
};

export type MesResumen = { mes: number; preventivos: number; correctivos: number };

const anioDe = (fecha: string) => Number(fecha.slice(0, 4));

/** Años que tienen mantenimientos, del más reciente al más antiguo. */
export function aniosConDatos(filas: Pick<FilaEstadistica, "fecha">[]): number[] {
  return [...new Set(filas.map((f) => anioDe(f.fecha)))].sort((a, b) => b - a);
}

/** El año actual si tiene datos; si no, el más reciente con datos. */
export function anioPorDefecto(anios: number[], hoy: string): number {
  const actual = anioDe(hoy);
  return anios.includes(actual) || anios.length === 0 ? actual : anios[0];
}

/** Totales del año y su desglose por mes (siempre 12 meses). */
export function resumenDelAnio(filas: FilaEstadistica[], anio: number) {
  const delAnio = filas.filter((f) => anioDe(f.fecha) === anio);
  const porMes: MesResumen[] = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    preventivos: 0,
    correctivos: 0,
  }));
  for (const f of delAnio) {
    const mes = porMes[Number(f.fecha.slice(5, 7)) - 1];
    if (f.tipo === "preventivo") mes.preventivos++;
    else mes.correctivos++;
  }
  const preventivos = delAnio.filter((f) => f.tipo === "preventivo").length;
  return {
    total: delAnio.length,
    preventivos,
    correctivos: delAnio.length - preventivos,
    equipos: new Set(delAnio.map((f) => f.activoId)).size,
    porMes,
  };
}

/** Sede de una ubicación: lo que va antes del primer " - " ("IPS - CALL CENTER" → "IPS"). */
export function sedeDe(ubicacion: string | null): string {
  if (!ubicacion) return "Sin ubicación";
  return ubicacion.split(" - ")[0].trim();
}

/** Mantenimientos del año por sede, de mayor a menor; el resto se agrupa en "Otras". */
export function porSede(filas: FilaEstadistica[], anio: number, limite = 12) {
  const conteo = new Map<string, number>();
  for (const f of filas) {
    if (anioDe(f.fecha) !== anio) continue;
    const sede = sedeDe(f.ubicacion);
    conteo.set(sede, (conteo.get(sede) ?? 0) + 1);
  }
  const ordenadas = [...conteo.entries()]
    .map(([sede, total]) => ({ sede, total }))
    .sort((a, b) => b.total - a.total || a.sede.localeCompare(b.sede));
  if (ordenadas.length <= limite) return ordenadas;
  const resto = ordenadas.slice(limite).reduce((suma, s) => suma + s.total, 0);
  return [...ordenadas.slice(0, limite), { sede: "Otras", total: resto }];
}

/**
 * Equipos (no dados de baja) según la próxima fecha de su mantenimiento más
 * reciente: vencidos, próximos (ventana de aviso) o al día. Los que no tienen
 * próxima fecha no cuentan. Usa las mismas reglas que las alertas.
 */
export function estadoActual(lista: MantenimientoConActivo[], hoy: string) {
  const { vencidos, proximos } = pendientesDeMantenimiento(lista, hoy);
  // Ventana de 200 años: en la práctica, todos los equipos con próxima fecha
  const todos = pendientesDeMantenimiento(lista, hoy, 365 * 200);
  const conProxima = todos.vencidos.length + todos.proximos.length;
  return {
    vencidos: vencidos.length,
    proximos: proximos.length,
    alDia: conProxima - vencidos.length - proximos.length,
  };
}
