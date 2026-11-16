import type { TipoActa } from "@/db/schema";

/** Nombre de cada acta tal como aparece en su formato. */
export const NOMBRES_ACTA: Record<TipoActa, string> = {
  entrega: "Acta de entrega de equipos de cómputo",
  egreso: "Acta de egreso de equipos de cómputo",
  baja: "Acta de baja",
};

/** Etiquetas del pie de firmas: cada formato aprobado usa las suyas. */
export const ETIQUETAS_PIE: Record<TipoActa, [string, string, string]> = {
  entrega: ["Elaboró", "Revisó", "Aprobó"],
  egreso: ["Elaborado por", "Revisado por", "Aprobado por"],
  baja: ["Elaborado por", "Revisado por", "Autorizado por"],
};
