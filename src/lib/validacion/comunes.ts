import { z } from "zod";

/** Los formularios envían "" en los campos vacíos; se normaliza a undefined. */
const vacioAUndefined = (valor: unknown) =>
  typeof valor === "string" && valor.trim() === "" ? undefined : valor;

export const textoOpcional = z.preprocess(
  vacioAUndefined,
  z.string().trim().max(300).optional(),
);

export const FORMATO_FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export const fechaOpcional = z.preprocess(
  vacioAUndefined,
  z
    .string()
    .regex(FORMATO_FECHA_ISO, "Use el formato AAAA-MM-DD")
    .optional(),
);

export const enteroOpcional = z.preprocess(
  vacioAUndefined,
  z.coerce
    .number({ message: "Debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "No puede ser negativo")
    .optional(),
);

/** Devuelve el primer mensaje de error de un resultado Zod, para mostrarlo al usuario. */
export function primerErrorZod(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos";
}
