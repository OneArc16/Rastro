import { filtrarPorTexto } from "@/lib/busqueda-texto";
import { ETIQUETAS_ESTADO, ETIQUETAS_TIPO } from "@/lib/etiquetas";

type Buscable = {
  codigo: string;
  tipo: keyof typeof ETIQUETAS_TIPO;
  marca: string | null;
  modelo: string | null;
  serial: string | null;
  estado: keyof typeof ETIQUETAS_ESTADO;
  responsable: string | null;
  ubicacionAsignada: string | null;
  ubicacion: string | null;
};

/**
 * Filtra por código, serial, marca, modelo, tipo, estado, responsable y
 * ubicación (ver filtrarPorTexto).
 */
export function filtrarInventario<T extends Buscable>(filas: T[], texto: string): T[] {
  return filtrarPorTexto(filas, texto, (f) => [
    f.codigo,
    f.serial,
    f.marca,
    f.modelo,
    ETIQUETAS_TIPO[f.tipo],
    ETIQUETAS_ESTADO[f.estado],
    f.responsable,
    f.ubicacionAsignada,
    f.ubicacion,
  ]);
}
