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

const FECHA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Día, mes y año de una fecha "AAAA-MM-DD"; vacíos si no lo es. */
export function partesFecha(texto: string) {
  const partes = FECHA_ISO.exec(texto);
  if (!partes) return { dia: "", mes: "", anio: "" };
  return { dia: partes[3], mes: partes[2], anio: partes[1] };
}

/** Fecha como la escribe cada formato (15/05/2025 o 23-02-2022). */
export function fechaImpresa(texto: string, separador: "/" | "-" = "/") {
  const { dia, mes, anio } = partesFecha(texto);
  return dia ? [dia, mes, anio].join(separador) : texto;
}

/** Nombre corto de cada tipo para listados y filtros. */
export const TIPOS_ACTA_CORTOS: Record<TipoActa, string> = {
  entrega: "Entrega",
  egreso: "Egreso",
  baja: "Baja",
};
