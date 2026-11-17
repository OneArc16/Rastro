import { filtrarPorTexto } from "@/lib/busqueda-texto";

type Buscable = {
  nombre: string;
  cargo: string | null;
  ubicacion: string | null;
  telefono: string | null;
};

/** Filtra por nombre, cargo, ubicación y teléfono (ver filtrarPorTexto). */
export function filtrarFuncionarios<T extends Buscable>(filas: T[], texto: string): T[] {
  return filtrarPorTexto(filas, texto, (f) => [f.nombre, f.cargo, f.ubicacion, f.telefono]);
}
