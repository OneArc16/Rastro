/**
 * Búsqueda en el historial de actas. Recibe la base para poder probarse con
 * SQLite en memoria.
 */
import { and, desc, eq, gte, lte, or, sql, type SQL } from "drizzle-orm";
import { codigoActa } from "@/dominio/actas";
import type { Db } from "./index";
import { actas, actasActivos, activos, funcionarios, ubicaciones, type TipoActa } from "./schema";


export type FiltrosActas = {
  tipo?: TipoActa;
  /** Texto libre: número de acta, código de equipo, funcionario o contenido. */
  texto?: string;
  desde?: string;
  hasta?: string;
  funcionarioId?: number;
  activoId?: number;
};

const PREFIJO_A_TIPO: Record<string, TipoActa> = { ENT: "entrega", EGR: "egreso", BAJ: "baja" };

/** "ENT-0003", "ent3" o "BAJ 12" → tipo y número del acta. */
export function interpretarCodigoActa(texto: string) {
  const partes = /^(ENT|EGR|BAJ)[\s-]*0*(\d+)$/i.exec(texto.trim());
  if (!partes) return null;
  return { tipo: PREFIJO_A_TIPO[partes[1].toUpperCase()], numero: Number(partes[2]) };
}

/** Escapa los comodines de LIKE para buscar el texto tal cual. */
const patron = (texto: string) => `%${texto.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export function buscarActasEn(base: Db, filtros: FiltrosActas, limite = 200) {
  const condiciones: SQL[] = [];
  if (filtros.tipo) condiciones.push(eq(actas.tipo, filtros.tipo));
  if (filtros.desde) condiciones.push(gte(actas.fecha, filtros.desde));
  if (filtros.hasta) condiciones.push(lte(actas.fecha, filtros.hasta));
  if (filtros.funcionarioId) condiciones.push(eq(actas.funcionarioId, filtros.funcionarioId));
  if (filtros.activoId) {
    condiciones.push(
      sql`exists (select 1 from ${actasActivos} where ${actasActivos.actaId} = ${actas.id} and ${actasActivos.activoId} = ${filtros.activoId})`,
    );
  }

  const texto = filtros.texto?.trim();
  if (texto) {
    const codigo = interpretarCodigoActa(texto);
    const like = patron(texto);
    const coincidencias = [
      sql`${actas.datos} like ${like} escape '\\'`,
      sql`${funcionarios.nombre} like ${like} escape '\\'`,
      sql`${ubicaciones.nombre} like ${like} escape '\\'`,
      sql`exists (select 1 from ${actasActivos} inner join ${activos} on ${activos.id} = ${actasActivos.activoId} where ${actasActivos.actaId} = ${actas.id} and ${activos.codigo} like ${like} escape '\\')`,
    ];
    if (codigo) {
      coincidencias.push(and(eq(actas.tipo, codigo.tipo), eq(actas.numero, codigo.numero)) as SQL);
    }
    condiciones.push(or(...coincidencias) as SQL);
  }

  const filas = base
    .select({
      id: actas.id,
      tipo: actas.tipo,
      numero: actas.numero,
      fecha: actas.fecha,
      editadaEn: actas.editadaEn,
      funcionario: funcionarios.nombre,
      ubicacion: ubicaciones.nombre,
      equipos: sql<string | null>`(select group_concat(${activos.codigo}, ', ') from ${actasActivos} inner join ${activos} on ${activos.id} = ${actasActivos.activoId} where ${actasActivos.actaId} = ${actas.id})`,
    })
    .from(actas)
    .leftJoin(funcionarios, eq(funcionarios.id, actas.funcionarioId))
    .leftJoin(ubicaciones, eq(ubicaciones.id, actas.ubicacionId))
    .where(condiciones.length > 0 ? and(...condiciones) : undefined)
    .orderBy(desc(actas.fecha), desc(actas.id))
    .limit(limite)
    .all();

  return filas.map((fila) => ({ ...fila, codigo: codigoActa(fila.tipo, fila.numero) }));
}

export type FilaActa = ReturnType<typeof buscarActasEn>[number];
