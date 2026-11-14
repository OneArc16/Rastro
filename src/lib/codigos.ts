import type { TIPOS_ACTIVO } from "@/db/schema";

type TipoActivo = (typeof TIPOS_ACTIVO)[number];

/**
 * Prefijo del código interno por tipo de activo (regla del plan).
 * Los tres tipos de computador comparten el prefijo PC.
 * PAR/AUD/OTR no aparecen en el plan: asunción A1 de la fase 2.
 */
export const PREFIJOS_TIPO: Record<TipoActivo, string> = {
  pc_mesa: "PC",
  portatil: "PC",
  todo_en_uno: "PC",
  monitor: "MON",
  teclado: "TEC",
  mouse: "MOU",
  impresora: "IMP",
  parlantes: "PAR",
  audifonos: "AUD",
  otro: "OTR",
};

/** Relleno según los ejemplos del plan: PC-014 (3 dígitos), MON-0023 (4). */
const RELLENO_POR_PREFIJO: Record<string, number> = { PC: 3 };
const RELLENO_PREDETERMINADO = 4;

/**
 * Propone el siguiente código interno para un tipo de activo:
 * toma el consecutivo más alto de los códigos existentes con el mismo
 * prefijo y suma 1. El usuario siempre puede cambiar la propuesta.
 */
export function siguienteCodigo(
  tipo: TipoActivo,
  codigosExistentes: string[],
): string {
  const prefijo = PREFIJOS_TIPO[tipo];
  const patron = new RegExp(`^${prefijo}-(\\d+)$`);

  let mayor = 0;
  for (const codigo of codigosExistentes) {
    const coincidencia = patron.exec(codigo);
    if (!coincidencia) continue;
    const numero = Number.parseInt(coincidencia[1], 10);
    if (numero > mayor) mayor = numero;
  }

  const relleno = RELLENO_POR_PREFIJO[prefijo] ?? RELLENO_PREDETERMINADO;
  const consecutivo = String(mayor + 1).padStart(relleno, "0");
  return `${prefijo}-${consecutivo}`;
}
