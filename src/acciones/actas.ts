"use server";

import { db } from "@/db";
import { guardarFormatoActa } from "@/dominio/actas";
import { esquemaFormatoActaFormulario } from "@/lib/validacion/actas";
import { ejecutar } from "./ejecutar";
import type { ResultadoAccion } from "./resultado";

export async function guardarFormatoActaAccion(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaFormatoActaFormulario, datos, (d) =>
    guardarFormatoActa(db, d.tipo, d.formato),
  );
}
