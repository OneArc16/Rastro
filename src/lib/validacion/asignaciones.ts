import { z } from "zod";
import type { Destino } from "@/dominio/asignaciones";
import { fechaObligatoria, idPositivo, textoOpcional } from "./comunes";

export const TIPOS_DESTINO = ["funcionario", "ubicacion"] as const;

export const esquemaMovimiento = z.object({
  activoId: idPositivo("Activo inválido"),
  tipoDestino: z.enum(TIPOS_DESTINO),
  destinoId: idPositivo("Seleccione el destino"),
  fecha: fechaObligatoria,
  motivo: textoOpcional,
  /** Solo al trasladar a un funcionario de otra ubicación: quién cambia de lugar. */
  seMueve: z.enum(["funcionario", "equipo"]).optional(),
});

export const esquemaDevolucion = z.object({
  activoId: idPositivo("Activo inválido"),
  fecha: fechaObligatoria,
});

export const esquemaIntercambio = z.object({
  activoAId: idPositivo("Activo inválido"),
  activoBId: idPositivo("Seleccione el activo con el que se intercambia"),
  fecha: fechaObligatoria,
  motivo: textoOpcional,
});

export const esquemaCrucePuestos = z.object({
  funcionarioAId: idPositivo("Funcionario inválido"),
  funcionarioBId: idPositivo("Seleccione con quién cambia de puesto"),
  fecha: fechaObligatoria,
  motivo: textoOpcional,
});

export const esquemaBaja = z.object({
  activoId: idPositivo("Activo inválido"),
  fecha: fechaObligatoria,
  motivo: textoOpcional,
});

export const esquemaRetiro = z.object({
  funcionarioId: idPositivo("Funcionario inválido"),
  fecha: fechaObligatoria,
});

export function aDestino(
  tipoDestino: (typeof TIPOS_DESTINO)[number],
  destinoId: number,
): Destino {
  return tipoDestino === "funcionario"
    ? { funcionarioId: destinoId }
    : { ubicacionId: destinoId };
}
