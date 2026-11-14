import { createInsertSchema } from "drizzle-zod";
import { configuracion } from "@/db/schema";
import { fechaOpcional, textoOpcional } from "./comunes";

export const esquemaConfiguracionFormulario = createInsertSchema(configuracion, {
  codigoFormato: textoOpcional,
  versionFormato: textoOpcional,
  fechaEmision: fechaOpcional,
  elaboradoNombre: textoOpcional,
  elaboradoCargo: textoOpcional,
  revisadoNombre: textoOpcional,
  revisadoCargo: textoOpcional,
  aprobadoNombre: textoOpcional,
  aprobadoCargo: textoOpcional,
}).omit({ id: true });
