import { FORMATO_FECHA_ISO } from "@/lib/validacion/comunes";

/**
 * Motivo de las asignaciones creadas al importar el Excel: registran el estado
 * inicial, no un cambio de equipo.
 */
export const MOTIVO_CARGA_INICIAL = "Importado del Excel";

/** Error esperado por una regla de negocio; su mensaje se muestra al usuario. */
export class ErrorDeNegocio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorDeNegocio";
  }
}

export function validarFecha(fecha: string) {
  if (!FORMATO_FECHA_ISO.test(fecha)) {
    throw new ErrorDeNegocio("La fecha debe tener el formato AAAA-MM-DD");
  }
}
