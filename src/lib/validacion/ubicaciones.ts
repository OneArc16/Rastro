import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { ubicaciones } from "@/db/schema";

export const esquemaUbicacionFormulario = createInsertSchema(ubicaciones, {
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150),
}).omit({ id: true });

export type UbicacionFormulario = z.input<typeof esquemaUbicacionFormulario>;
