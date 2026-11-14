"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { activos } from "@/db/schema";
import {
  esquemaActivoFormulario,
  specsDesdeFormulario,
  type ActivoValidado,
} from "@/lib/validacion/activos";
import { primerErrorZod } from "@/lib/validacion/comunes";
import { esErrorDeUnicidad, type ResultadoAccion } from "./resultado";

function aValoresDeFila(datos: ActivoValidado) {
  return {
    codigo: datos.codigo,
    tipo: datos.tipo,
    marca: datos.marca ?? null,
    modelo: datos.modelo ?? null,
    serial: datos.serial ?? null,
    color: datos.color ?? null,
    estado: datos.estado,
    valor: datos.valor ?? null,
    fechaCompra: datos.fechaCompra ?? null,
    garantiaHasta: datos.garantiaHasta ?? null,
    observaciones: datos.observaciones ?? null,
    specs: specsDesdeFormulario(datos.tipo, datos.specs ?? {}),
  };
}

function revalidarPantallasDeActivos(codigo: string) {
  revalidatePath("/");
  revalidatePath("/inventario");
  revalidatePath(`/activos/${codigo}`);
}

export async function crearActivo(datos: unknown): Promise<ResultadoAccion> {
  const resultado = esquemaActivoFormulario.safeParse(datos);
  if (!resultado.success) {
    return { ok: false, error: primerErrorZod(resultado.error) };
  }

  try {
    db.insert(activos).values(aValoresDeFila(resultado.data)).run();
  } catch (error) {
    if (esErrorDeUnicidad(error)) {
      return {
        ok: false,
        error: `Ya existe un activo con el código ${resultado.data.codigo}`,
      };
    }
    throw error;
  }

  revalidarPantallasDeActivos(resultado.data.codigo);
  return { ok: true };
}

export async function actualizarActivo(
  id: number,
  datos: unknown,
): Promise<ResultadoAccion> {
  const resultado = esquemaActivoFormulario.safeParse(datos);
  if (!resultado.success) {
    return { ok: false, error: primerErrorZod(resultado.error) };
  }

  try {
    db.update(activos)
      .set(aValoresDeFila(resultado.data))
      .where(eq(activos.id, id))
      .run();
  } catch (error) {
    if (esErrorDeUnicidad(error)) {
      return {
        ok: false,
        error: `Ya existe un activo con el código ${resultado.data.codigo}`,
      };
    }
    throw error;
  }

  revalidarPantallasDeActivos(resultado.data.codigo);
  return { ok: true };
}
