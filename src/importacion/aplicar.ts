/**
 * Escribe un plan de importación en la base, todo en una sola transacción:
 * si algo falla, no queda nada a medias y los datos anteriores siguen intactos.
 *
 * Se inserta directamente (no con las operaciones del dominio) para que la
 * carga completa sea atómica; las reglas de asignación las garantizan el plan
 * (un destino por activo) y las restricciones de la base (índice único parcial
 * de asignación vigente y CHECK de destino).
 */
import { count } from "drizzle-orm";
import type { Db } from "@/db";
import {
  activos,
  asignaciones,
  funcionarios,
  mantenimientos,
  ubicaciones,
} from "@/db/schema";
import { ErrorDeNegocio, MOTIVO_CARGA_INICIAL } from "@/dominio/comunes";
import type { PlanImportacion } from "./plan";

/** "AAAA-MM-DD" → Date a la medianoche local, para que se muestre como ese mismo día. */
function fechaLocal(iso: string): Date {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

export type ResultadoAplicacion = {
  ubicaciones: number;
  funcionarios: number;
  activos: number;
  asignaciones: number;
  mantenimientos: number;
  /** Activos que había antes y se borraron al reemplazar. */
  borrados: number;
};

export function aplicarPlan(
  db: Db,
  plan: PlanImportacion,
  opciones: { reemplazar: boolean },
): ResultadoAplicacion {
  return db.transaction((tx) => {
    const existentes = tx.select({ total: count() }).from(activos).get()?.total ?? 0;
    if (existentes > 0 && !opciones.reemplazar) {
      throw new ErrorDeNegocio(
        `La base ya tiene ${existentes} activos. Para importar hay que reemplazarlos (--reemplazar).`,
      );
    }

    if (opciones.reemplazar) {
      // Orden por claves foráneas; la configuración (encabezado y firmas) se conserva
      tx.delete(mantenimientos).run();
      tx.delete(asignaciones).run();
      tx.delete(activos).run();
      tx.delete(funcionarios).run();
      tx.delete(ubicaciones).run();
    }

    const idUbicacion = new Map<string, number>();
    for (const nombre of plan.ubicaciones) {
      idUbicacion.set(nombre, tx.insert(ubicaciones).values({ nombre }).returning().get().id);
    }

    const idFuncionario = new Map<string, number>();
    for (const f of plan.funcionarios) {
      const fila = tx
        .insert(funcionarios)
        .values({ nombre: f.nombre, ubicacionId: f.ubicacion ? (idUbicacion.get(f.ubicacion) ?? null) : null })
        .returning()
        .get();
      idFuncionario.set(f.clave, fila.id);
    }

    const idActivo = new Map<string, number>();
    let asignadas = 0;
    for (const a of plan.activos) {
      const fila = tx
        .insert(activos)
        .values({
          codigo: a.codigo,
          tipo: a.tipo,
          marca: a.marca,
          modelo: a.modelo,
          serial: a.serial,
          color: a.color,
          valor: a.valor,
          fechaCompra: a.fechaCompra,
          garantiaHasta: a.garantiaHasta,
          specs: a.specs,
          observaciones: a.observaciones,
          // La última modificación conocida es la de la hoja del Excel, no la importación
          actualizadoEn: fechaLocal(a.fechaDesde),
        })
        .returning()
        .get();
      idActivo.set(a.codigo, fila.id);

      if (a.destino) {
        tx.insert(asignaciones)
          .values({
            activoId: fila.id,
            funcionarioId: a.destino.tipo === "funcionario" ? idFuncionario.get(a.destino.clave) : null,
            ubicacionId: a.destino.tipo === "ubicacion" ? idUbicacion.get(a.destino.nombre) : null,
            fechaDesde: a.fechaDesde,
            motivo: MOTIVO_CARGA_INICIAL,
          })
          .run();
        asignadas++;
      }
    }

    for (const m of plan.mantenimientos) {
      tx.insert(mantenimientos)
        .values({
          activoId: idActivo.get(m.codigoActivo) as number,
          fecha: m.fecha,
          proximaFecha: m.proximaFecha,
          tipo: m.tipo,
          observacion: m.observacion,
        })
        .run();
    }

    return {
      ubicaciones: plan.ubicaciones.length,
      funcionarios: plan.funcionarios.length,
      activos: plan.activos.length,
      asignaciones: asignadas,
      mantenimientos: plan.mantenimientos.length,
      borrados: opciones.reemplazar ? existentes : 0,
    };
  });
}
