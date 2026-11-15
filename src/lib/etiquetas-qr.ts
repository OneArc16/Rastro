import type { ESTADOS_ACTIVO, TIPOS_ACTIVO } from "@/db/schema";

export type FilaEtiquetable = {
  codigo: string;
  tipo: (typeof TIPOS_ACTIVO)[number];
  marca: string | null;
  modelo: string | null;
  estado: (typeof ESTADOS_ACTIVO)[number];
  responsable: string | null;
  ubicacion: string | null;
};

export type FiltrosEtiquetas = {
  codigo?: string;
  tipo?: string;
  ubicacion?: string;
  texto?: string;
};

/** Activos que van en la hoja de etiquetas. Los dados de baja nunca se etiquetan. */
export function filtrarParaEtiquetas<T extends FilaEtiquetable>(
  filas: T[],
  filtros: FiltrosEtiquetas,
): T[] {
  const vigentes = filas.filter((f) => f.estado !== "dado_de_baja");

  const codigo = filtros.codigo?.trim().toUpperCase();
  if (codigo) return vigentes.filter((f) => f.codigo.toUpperCase() === codigo);

  const texto = filtros.texto?.trim().toLowerCase();
  return vigentes.filter(
    (f) =>
      (!filtros.tipo || f.tipo === filtros.tipo) &&
      (!filtros.ubicacion || f.ubicacion === filtros.ubicacion) &&
      (!texto ||
        [f.codigo, f.marca, f.modelo, f.responsable]
          .filter(Boolean)
          .some((campo) => (campo as string).toLowerCase().includes(texto))),
  );
}
