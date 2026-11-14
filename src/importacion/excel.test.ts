import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ExcelJS from "exceljs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { leerLibro } from "./excel";

let carpeta: string;
let archivo: string;

beforeAll(async () => {
  carpeta = fs.mkdtempSync(path.join(os.tmpdir(), "rastro-excel-"));
  archivo = path.join(carpeta, "muestra.xlsx");

  const libro = new ExcelJS.Workbook();
  const resumenIps = libro.addWorksheet("SISM");
  resumenIps.addRow(["INDICE", "SERIAL", "MARCA", "RESPONSABLE", "ESTADO"]);

  const pc = libro.addWorksheet("1");
  pc.getCell("A6").value = "PC";
  pc.getCell("B6").value = 1;
  pc.getCell("D6").value = "JOHN PERTUZ";
  pc.getCell("D7").value = new Date(Date.UTC(2021, 2, 16));
  pc.getCell("A43").value = "1. ANTERIOR PC DE MICHAEL";
  pc.mergeCells("A43:F43");
  pc.getCell("B7").value = { formula: "1000+2000", result: 3000 };
  pc.getCell("B14").value = { richText: [{ text: "AS" }, { text: "US" }] };

  const resumenDisp = libro.addWorksheet("DISPENSARIO");
  resumenDisp.addRow(["INDICE", "SERIAL", "MARCA", "MUNICIPIO", "UBICACIÓN", "AREA", "RESPONSABLE", "ESTADO"]);
  resumenDisp.addRow(["6 DISP", "", "DELL", "REMOLINO", "DISPENSARIO", "LINEA DE FRENTE", "REMOLINO", "INSTALADO"]);
  resumenDisp.addRow(["27 DISP", "", "", "", "DISPENSARIO", "", "", ""]);

  await libro.xlsx.writeFile(archivo);
});

afterAll(() => {
  fs.rmSync(carpeta, { recursive: true, force: true });
});

describe("leerLibro", () => {
  it("toma solo las hojas de PC (las que tienen la etiqueta PC en A6)", async () => {
    const { hojas } = await leerLibro(archivo);
    expect(hojas.map((h) => h.nombre)).toEqual(["1"]);
  });

  it("entrega fechas como Date, el resultado de las fórmulas y el texto enriquecido unido", async () => {
    const { hojas } = await leerLibro(archivo);
    const { celdas } = hojas[0];
    expect(celdas.D6).toBe("JOHN PERTUZ");
    expect(celdas.D7).toEqual(new Date(Date.UTC(2021, 2, 16)));
    expect(celdas.B7).toBe(3000);
    expect(celdas.B14).toBe("ASUS");
    expect(celdas.A43).toBe("1. ANTERIOR PC DE MICHAEL");
  });

  it("lee el resumen de dispensarios por número, ignorando las filas sin municipio", async () => {
    const { resumenDispensario } = await leerLibro(archivo);
    expect(resumenDispensario).toEqual([
      { numero: 6, municipio: "REMOLINO", area: "LINEA DE FRENTE" },
    ]);
  });
});
