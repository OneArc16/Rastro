import { ETIQUETAS_TIPO } from "@/lib/etiquetas";
import type { PlanImportacion } from "./plan";

/** Texto de la vista previa: qué se va a crear y todo lo que conviene revisar. */
export function formatearInforme(plan: PlanImportacion, activosActuales: number): string {
  const porTipo = new Map<string, number>();
  for (const a of plan.activos) {
    const etiqueta = ETIQUETAS_TIPO[a.tipo];
    porTipo.set(etiqueta, (porTipo.get(etiqueta) ?? 0) + 1);
  }
  const detalleTipos = [...porTipo.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "es"))
    .map(([etiqueta, total]) => `${etiqueta}: ${total}`)
    .join(", ");
  const asignados = plan.activos.filter((a) => a.destino !== null).length;

  const lineas = [
    "Vista previa de la importación",
    "",
    `Ubicaciones: ${plan.ubicaciones.length}`,
    `Funcionarios: ${plan.funcionarios.length}`,
    `Activos: ${plan.activos.length} (${detalleTipos})`,
    `  Asignados: ${asignados} · sin asignar: ${plan.activos.length - asignados}`,
    `Mantenimientos: ${plan.mantenimientos.length}`,
  ];

  if (activosActuales > 0) {
    lineas.push(
      "",
      `La base tiene ${activosActuales} activos: importar con --reemplazar los borra (se conserva la configuración).`,
    );
  }

  lineas.push("", `Avisos (${plan.avisos.length}):`);
  for (const aviso of plan.avisos) {
    lineas.push(`  ${aviso.hoja ? `[hoja ${aviso.hoja}]` : "[general]"} ${aviso.mensaje}`);
  }

  return lineas.join("\n");
}
