"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { funcionarios } from "@/db/schema";
import { primerErrorZod } from "@/lib/validacion/comunes";
import { esquemaFuncionarioFormulario } from "@/lib/validacion/funcionarios";
import type { ResultadoAccion } from "./resultado";

function aValoresDeFila(datos: {
  nombre: string;
  cargo?: string | null;
  telefono?: string | null;
  correo?: string | null;
  ubicacionId: number | null;
}) {
  return {
    nombre: datos.nombre,
    cargo: datos.cargo ?? null,
    telefono: datos.telefono ?? null,
    correo: datos.correo ?? null,
    ubicacionId: datos.ubicacionId,
  };
}

export async function crearFuncionario(datos: unknown): Promise<ResultadoAccion> {
  const resultado = esquemaFuncionarioFormulario.safeParse(datos);
  if (!resultado.success) {
    return { ok: false, error: primerErrorZod(resultado.error) };
  }

  db.insert(funcionarios).values(aValoresDeFila(resultado.data)).run();

  revalidatePath("/funcionarios");
  return { ok: true };
}

export async function actualizarFuncionario(
  id: number,
  datos: unknown,
): Promise<ResultadoAccion> {
  const resultado = esquemaFuncionarioFormulario.safeParse(datos);
  if (!resultado.success) {
    return { ok: false, error: primerErrorZod(resultado.error) };
  }

  db.update(funcionarios)
    .set(aValoresDeFila(resultado.data))
    .where(eq(funcionarios.id, id))
    .run();

  revalidatePath("/funcionarios");
  return { ok: true };
}
