/** Fechas en la base: texto "AAAA-MM-DD". Al usuario se muestran "DD/MM/AAAA". */
export function formatearFecha(fechaIso: string | null | undefined): string {
  if (!fechaIso) return "—";
  const [anio, mes, dia] = fechaIso.split("-");
  if (!anio || !mes || !dia) return fechaIso;
  return `${dia}/${mes}/${anio}`;
}

/** Fecha de hoy en formato "AAAA-MM-DD" (hora local). */
export function hoyIso(): string {
  const ahora = new Date();
  return [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, "0"),
    String(ahora.getDate()).padStart(2, "0"),
  ].join("-");
}
