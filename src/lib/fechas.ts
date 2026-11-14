/** Fechas en la base: texto "AAAA-MM-DD". Al usuario se muestran "DD/MM/AAAA". */
export function formatearFecha(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "—";
  const [anio, mes, dia] = fechaIso.split("-");
  if (!anio || !mes || !dia) return fechaIso;
  return `${dia}/${mes}/${anio}`;
}

/** Fecha en formato "AAAA-MM-DD" según la hora local. */
export function fechaIsoLocal(fecha: Date): string {
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Fecha de hoy en formato "AAAA-MM-DD" (hora local). */
export function hoyIso(): string {
  return fechaIsoLocal(new Date());
}
