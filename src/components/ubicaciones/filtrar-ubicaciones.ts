import { filtrarPorTexto } from "@/lib/busqueda-texto";

type Buscable = {
  nombre: string;
  funcionarios: { nombre: string }[];
  equiposCompartidos: { codigo: string }[];
};

/** Filtra por nombre de la ubicación, sus funcionarios y sus equipos compartidos. */
export function filtrarUbicaciones<T extends Buscable>(filas: T[], texto: string): T[] {
  return filtrarPorTexto(filas, texto, (u) => [
    u.nombre,
    ...u.funcionarios.map((f) => f.nombre),
    ...u.equiposCompartidos.map((e) => e.codigo),
  ]);
}
