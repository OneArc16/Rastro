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

/** Suma (o resta) días a una fecha "AAAA-MM-DD". Usa UTC para no depender del huso horario. */
export function sumarDias(fechaIso: string, dias: number): string {
  const [anio, mes, dia] = fechaIso.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return fecha.toISOString().slice(0, 10);
}

/** Días desde `desde` hasta `hasta` (negativo si `hasta` es anterior). */
export function diasEntre(desde: string, hasta: string): number {
  const aUtc = (iso: string) => {
    const [anio, mes, dia] = iso.split("-").map(Number);
    return Date.UTC(anio, mes - 1, dia);
  };
  return Math.round((aUtc(hasta) - aUtc(desde)) / 86_400_000);
}

/** Fecha de hoy en formato "AAAA-MM-DD" (hora local). */
export function hoyIso(): string {
  return fechaIsoLocal(new Date());
}
