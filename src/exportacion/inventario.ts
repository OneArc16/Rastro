/**
 * Arma el libro de Excel con el inventario completo de equipos.
 * Recibe filas ya consultadas: no conoce la base de datos ni HTTP.
 */
import ExcelJS from "exceljs";
import type { ESTADOS_ACTIVO, Specs, TIPOS_ACTIVO } from "@/db/schema";
import { paresDeSpecs } from "@/components/activos/detalle-specs";
import { ETIQUETAS_ESTADO, ETIQUETAS_TIPO } from "@/lib/etiquetas";

export type ActivoExportable = {
  codigo: string;
  tipo: (typeof TIPOS_ACTIVO)[number];
  marca: string | null;
  modelo: string | null;
  serial: string | null;
  color: string | null;
  estado: (typeof ESTADOS_ACTIVO)[number];
  responsable: string | null;
  ubicacion: string | null;
  valor: number | null;
  fechaCompra: string | null;
  garantiaHasta: string | null;
  specs: Specs | null;
  observaciones: string | null;
};

type Columna = { encabezado: string; ancho: number; formato?: string };

const COLUMNAS: Columna[] = [
  { encabezado: "Código", ancho: 12 },
  { encabezado: "Tipo", ancho: 14 },
  { encabezado: "Marca", ancho: 16 },
  { encabezado: "Modelo", ancho: 22 },
  { encabezado: "Serial", ancho: 22 },
  { encabezado: "Color", ancho: 12 },
  { encabezado: "Estado", ancho: 15 },
  { encabezado: "Responsable", ancho: 28 },
  { encabezado: "Ubicación", ancho: 28 },
  { encabezado: "Valor", ancho: 15, formato: '"$" #,##0' },
  { encabezado: "Fecha de compra", ancho: 16, formato: "dd/mm/yyyy" },
  { encabezado: "Garantía hasta", ancho: 16, formato: "dd/mm/yyyy" },
  { encabezado: "Especificaciones", ancho: 60 },
  { encabezado: "Observaciones", ancho: 40 },
];

export const ENCABEZADOS_INVENTARIO = COLUMNAS.map((columna) => columna.encabezado);

/** "AAAA-MM-DD" a fecha de Excel; en UTC para que no se corra un día por la zona horaria. */
function fechaExcel(fechaIso: string | null): Date | null {
  if (!fechaIso) return null;
  const [anio, mes, dia] = fechaIso.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function textoSpecs(activo: ActivoExportable): string | null {
  const pares = paresDeSpecs(activo.tipo, activo.specs);
  return pares.length > 0 ? pares.map(([etiqueta, valor]) => `${etiqueta}: ${valor}`).join("; ") : null;
}

function filaDe(activo: ActivoExportable): Array<string | number | Date | null> {
  return [
    activo.codigo,
    ETIQUETAS_TIPO[activo.tipo],
    activo.marca,
    activo.modelo,
    activo.serial,
    activo.color,
    ETIQUETAS_ESTADO[activo.estado],
    activo.responsable,
    activo.ubicacion,
    activo.valor,
    fechaExcel(activo.fechaCompra),
    fechaExcel(activo.garantiaHasta),
    textoSpecs(activo),
    activo.observaciones,
  ];
}

export async function libroInventario(activos: ActivoExportable[]): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Rastro";
  const hoja = libro.addWorksheet("Inventario", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  hoja.columns = COLUMNAS.map(({ ancho, formato }) => ({
    width: ancho,
    style: formato ? { numFmt: formato } : {},
  }));

  const encabezado = hoja.addRow(ENCABEZADOS_INVENTARIO);
  encabezado.font = { bold: true, color: { argb: "FFFFFFFF" } };
  encabezado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10509A" } };
  encabezado.alignment = { vertical: "middle" };

  for (const activo of activos) hoja.addRow(filaDe(activo));

  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNAS.length } };

  return Buffer.from(await libro.xlsx.writeBuffer());
}

export function nombreArchivoInventario(hoyIso: string): string {
  return `inventario-${hoyIso}.xlsx`;
}
