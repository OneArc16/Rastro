import { z } from "zod";
import { TIPOS_MANTENIMIENTO } from "@/db/schema";
import { fechaObligatoria, fechaOpcional, idPositivo, textoOpcional } from "./comunes";

export const esquemaMantenimiento = z.object({
  activoId: idPositivo("Seleccione el activo"),
  fecha: fechaObligatoria,
  proximaFecha: fechaOpcional,
  tipo: z.enum(TIPOS_MANTENIMIENTO, { message: "Seleccione el tipo de mantenimiento" }),
  observacion: textoOpcional,
});
