/**
 * Único punto que conoce la librería de Excel: convierte el archivo en celdas
 * crudas por hoja. Todo lo demás de la importación trabaja con esos valores.
 */
import ExcelJS from "exceljs";
import { normalizar, type HojaCruda, type ValorCelda } from "./lectura";
import type { FilaResumenDispensario } from "./plan";

/** Columnas A-F y filas hasta 90 cubren todo el formato de la hoja de vida. */
const ULTIMA_COLUMNA = 6;
const ULTIMA_FILA = 90;

function valorPlano(valor: ExcelJS.CellValue): ValorCelda | null {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date || typeof valor === "number" || typeof valor === "string") return valor;
  if (typeof valor === "boolean") return valor ? "SI" : "NO";
  if ("richText" in valor) return valor.richText.map((parte) => parte.text).join("");
  if ("result" in valor) return valorPlano(valor.result as ExcelJS.CellValue);
  if ("text" in valor) return String(valor.text);
  return null; // errores de fórmula u otros valores sin contenido útil
}

function celdasDe(hoja: ExcelJS.Worksheet): Record<string, ValorCelda> {
  const celdas: Record<string, ValorCelda> = {};
  hoja.eachRow((fila, numeroFila) => {
    if (numeroFila > ULTIMA_FILA) return;
    fila.eachCell((celda, numeroColumna) => {
      if (numeroColumna > ULTIMA_COLUMNA) return;
      const valor = valorPlano(celda.value);
      if (valor !== null) celdas[celda.address] = valor;
    });
  });
  return celdas;
}

function textoDe(valor: ExcelJS.CellValue): string {
  const plano = valorPlano(valor);
  return plano === null ? "" : String(plano).trim();
}

function leerResumenDispensario(hoja: ExcelJS.Worksheet | undefined): FilaResumenDispensario[] {
  if (!hoja) return [];

  const columnas = new Map<string, number>();
  hoja.getRow(1).eachCell((celda, numero) => columnas.set(normalizar(textoDe(celda.value)), numero));
  const [colIndice, colMunicipio, colArea] = ["INDICE", "MUNICIPIO", "AREA"].map((c) => columnas.get(c));
  if (!colIndice || !colMunicipio) return [];

  const filas: FilaResumenDispensario[] = [];
  hoja.eachRow((fila, numeroFila) => {
    if (numeroFila === 1) return;
    const indice = /^(\d+)/.exec(textoDe(fila.getCell(colIndice).value));
    const municipio = textoDe(fila.getCell(colMunicipio).value);
    if (!indice || !municipio) return;
    const area = colArea ? textoDe(fila.getCell(colArea).value) : "";
    filas.push({ numero: Number(indice[1]), municipio, area: area || null });
  });
  return filas;
}

export async function leerLibro(
  ruta: string,
): Promise<{ hojas: HojaCruda[]; resumenDispensario: FilaResumenDispensario[] }> {
  const libro = new ExcelJS.Workbook();
  try {
    await libro.xlsx.readFile(ruta);
  } catch {
    throw new Error(`El archivo no es un Excel (.xlsx) válido: ${ruta}`);
  }

  // Una hoja de PC se reconoce por la etiqueta "PC" en A6; los resúmenes no la tienen
  const hojas = libro.worksheets
    .filter((hoja) => normalizar(textoDe(hoja.getCell("A6").value)) === "PC")
    .map((hoja) => ({ nombre: hoja.name, celdas: celdasDe(hoja) }));

  const resumen = libro.worksheets.find((hoja) => normalizar(hoja.name) === "DISPENSARIO");
  return { hojas, resumenDispensario: leerResumenDispensario(resumen) };
}
