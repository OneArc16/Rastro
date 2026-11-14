"use server";

import { db } from "@/db";
import { registrarMantenimiento } from "@/dominio/mantenimientos";
import { esquemaMantenimiento } from "@/lib/validacion/mantenimientos";
import { ejecutar } from "./ejecutar";
import type { ResultadoAccion } from "./resultado";

export async function registrarMantenimientoAccion(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaMantenimiento, datos, (d) => registrarMantenimiento(db, d));
}
