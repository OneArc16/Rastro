import { FORMATO_FECHA_ISO } from "@/lib/validacion/comunes";

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
