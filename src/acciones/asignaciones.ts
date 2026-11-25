"use server";

import { db } from "@/db";
import {
  asignar,
  cruzarPuestos,
  darDeBaja,
  devolver,
  intercambiar,
  retirarFuncionario,
  trasladar,
} from "@/dominio/asignaciones";
import {
  aDestino,
  esquemaBaja,
  esquemaCrucePuestos,
  esquemaDevolucion,
  esquemaIntercambio,
  esquemaMovimiento,
  esquemaRetiro,
} from "@/lib/validacion/asignaciones";
import { ejecutar } from "./ejecutar";
import type { ResultadoAccion } from "./resultado";

export async function asignarActivo(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaMovimiento, datos, (d) =>
    asignar(db, {
      activoId: d.activoId,
      destino: aDestino(d.tipoDestino, d.destinoId),
      fecha: d.fecha,
      motivo: d.motivo,
    }),
  );
}

export async function trasladarActivo(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaMovimiento, datos, (d) =>
    trasladar(db, {
      activoId: d.activoId,
      destino: aDestino(d.tipoDestino, d.destinoId),
      fecha: d.fecha,
      motivo: d.motivo,
      seMueve: d.seMueve,
    }),
  );
}

export async function devolverActivo(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaDevolucion, datos, (d) => devolver(db, d));
}

export async function intercambiarActivos(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaIntercambio, datos, (d) => intercambiar(db, d));
}

export async function cruzarPuestosAccion(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaCrucePuestos, datos, (d) => cruzarPuestos(db, d));
}

export async function darDeBajaActivo(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaBaja, datos, (d) => darDeBaja(db, d));
}

export async function retirarFuncionarioAccion(datos: unknown): Promise<ResultadoAccion> {
  return ejecutar(esquemaRetiro, datos, (d) => retirarFuncionario(db, d));
}
