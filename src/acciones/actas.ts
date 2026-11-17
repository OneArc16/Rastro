"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  crearActa,
  crearActaDeBaja,
  crearActaDeEgreso,
  editarActa,
  guardarFormatoActa,
  type Foto,
} from "@/dominio/actas";
import { ErrorDeNegocio } from "@/dominio/comunes";
import { primerErrorZod } from "@/lib/validacion/comunes";
import {
  esquemaEnvioActa,
  esquemaFormatoActaFormulario,
  MAXIMO_BYTES_FOTO,
  MAXIMO_FOTOS,
} from "@/lib/validacion/actas";
import { ejecutar } from "./ejecutar";
import type { ResultadoAccion } from "./resultado";

type ResultadoActa = { ok: true; id: number; codigo?: string } | { ok: false; error: string };

export async function guardarFormatoActaAccion(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaFormatoActaFormulario, datos, (d) =>
    guardarFormatoActa(db, d.tipo, d.formato),
  );
}

/** Lee el envío del formulario: el acta en JSON y las fotos como archivos ("fotos"). */
async function leerEnvio(formulario: FormData) {
  let json: unknown;
  try {
    json = JSON.parse(String(formulario.get("envio") ?? ""));
  } catch {
    return { ok: false, error: "Datos inválidos" } as const;
  }
  const envio = esquemaEnvioActa.safeParse(json);
  if (!envio.success) return { ok: false, error: primerErrorZod(envio.error) } as const;

  const archivos = formulario
    .getAll("fotos")
    .filter((a): a is File => a instanceof File && a.size > 0);
  if (archivos.length > MAXIMO_FOTOS) {
    return { ok: false, error: `El acta admite como máximo ${MAXIMO_FOTOS} fotos` } as const;
  }
  if (archivos.some((a) => a.size > MAXIMO_BYTES_FOTO)) {
    return { ok: false, error: "La foto es demasiado grande" } as const;
  }
  if (
    (archivos.length > 0 || envio.data.fotosConservadas?.length) &&
    envio.data.acta.tipo !== "baja"
  ) {
    return { ok: false, error: "Solo el acta de baja lleva foto" } as const;
  }
  const fotos: Foto[] = await Promise.all(
    archivos.map(async (a) => ({ contenido: Buffer.from(await a.arrayBuffer()), tipo: a.type })),
  );
  return { ok: true, envio: envio.data, fotos } as const;
}

/** Ejecuta la operación y traduce los errores de negocio para el formulario. */
function intentar(operacion: () => { id: number; codigo?: string }): ResultadoActa {
  try {
    const resultado = operacion();
    revalidatePath("/", "layout");
    return { ok: true, ...resultado };
  } catch (error) {
    if (error instanceof ErrorDeNegocio) return { ok: false, error: error.message };
    throw error;
  }
}

export async function crearActaAccion(formulario: FormData): Promise<ResultadoActa> {
  const leido = await leerEnvio(formulario);
  if (!leido.ok) return leido;
  const { envio, fotos } = leido;
  const { acta } = envio;

  return intentar(() => {
    switch (acta.tipo) {
      case "entrega":
        return crearActa(db, { ...acta, fotos });
      case "egreso":
        return crearActaDeEgreso(db, { ...acta, trasladar: envio.trasladar });
      case "baja": {
        const [activoId, ...otros] = acta.activoIds;
        if (activoId === undefined || otros.length > 0) {
          throw new ErrorDeNegocio("El acta de baja es de un solo equipo");
        }
        return crearActaDeBaja(db, { ...acta, activoId, fotos });
      }
    }
  });
}

export async function editarActaAccion(id: number, formulario: FormData): Promise<ResultadoActa> {
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "El acta no existe" };
  const leido = await leerEnvio(formulario);
  if (!leido.ok) return leido;
  const { envio, fotos } = leido;
  // Sin fotosConservadas ni fotos nuevas, las fotos guardadas no se tocan
  const cambio =
    envio.fotosConservadas === undefined && fotos.length === 0
      ? undefined
      : { conservar: envio.fotosConservadas, nuevas: fotos };

  return intentar(() => {
    editarActa(db, { ...envio.acta, id, fotos: cambio });
    return { id };
  });
}
