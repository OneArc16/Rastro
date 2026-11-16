import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { funcionarios } from "@/db/schema";
import { textoOpcional } from "./comunes";

/**
 * El campo `retirado` queda fuera del formulario: retirar a un funcionario
 * exige cerrar sus asignaciones vigentes en transacción (acción de la fase 3).
 */
export const esquemaFuncionarioFormulario = createInsertSchema(funcionarios, {
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150),
  cargo: textoOpcional,
  telefono: textoOpcional,
  correo: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().email("El correo no es válido").max(150).optional(),
  ),
  ubicacionId: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.coerce.number().int().positive().nullable(),
  ),
}).omit({ id: true, retirado: true });

export type FuncionarioFormulario = z.input<typeof esquemaFuncionarioFormulario>;
