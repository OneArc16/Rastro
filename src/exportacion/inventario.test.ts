import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { ENCABEZADOS_INVENTARIO, libroInventario, nombreArchivoInventario, type ActivoExportable } from "./inventario";

const pc: ActivoExportable = {
  codigo: "PC-001",
  tipo: "portatil",
  marca: "LENOVO",
  modelo: "THINKPAD E14",
  serial: "SN123",
  color: "NEGRO",
  estado: "operativo",
  responsable: "JOHN PERTUZ",
  ubicacion: "LINEA DE FRENTE 2do PISO",
  valor: 3500000,
  fechaCompra: "2024-03-15",
  garantiaHasta: "2026-03-15",
  specs: { ram: "16 GB", procesador: "INTEL CORE I5", bateria: { estado: "BUENA" } },
  observaciones: "Pantalla rayada",
};

const mouse: ActivoExportable = {
  codigo: "MOU-002",
  tipo: "mouse",
  marca: null,
  modelo: null,
  serial: null,
  color: null,
  estado: "dado_de_baja",
  responsable: null,
  ubicacion: null,
  valor: null,
  fechaCompra: null,
  garantiaHasta: null,
  specs: null,
  observaciones: null,
};

async function leer(buffer: Buffer) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const hoja = libro.getWorksheet("Inventario");
  if (!hoja) throw new Error("Falta la hoja Inventario");
  return hoja;
}

describe("libroInventario", () => {
  it("escribe una fila por activo bajo los encabezados, con etiquetas legibles", async () => {
    const hoja = await leer(await libroInventario([pc, mouse]));

    expect(hoja.getRow(1).values).toEqual([undefined, ...ENCABEZADOS_INVENTARIO]);
    expect(hoja.rowCount).toBe(3);

    const fila = hoja.getRow(2);
    expect(fila.getCell(1).value).toBe("PC-001");
    expect(fila.getCell(2).value).toBe("Portátil");
    expect(fila.getCell(7).value).toBe("Operativo");
    expect(fila.getCell(8).value).toBe("JOHN PERTUZ");
    expect(fila.getCell(9).value).toBe("LINEA DE FRENTE 2do PISO");
    expect(fila.getCell(10).value).toBe(3500000);
    expect(fila.getCell(11).value).toEqual(new Date(Date.UTC(2024, 2, 15)));
    expect(fila.getCell(12).value).toEqual(new Date(Date.UTC(2026, 2, 15)));
    expect(fila.getCell(13).value).toBe(
      "Cantidad de RAM: 16 GB; Procesador: INTEL CORE I5; Batería (estado): BUENA",
    );
    expect(fila.getCell(14).value).toBe("Pantalla rayada");
  });

  it("deja vacías las celdas sin dato y muestra los activos dados de baja", async () => {
    const hoja = await leer(await libroInventario([mouse]));
    const fila = hoja.getRow(2);

    expect(fila.getCell(1).value).toBe("MOU-002");
    expect(fila.getCell(7).value).toBe("Dado de baja");
    for (const columna of [3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14]) {
      expect(fila.getCell(columna).value).toBeNull();
    }
  });

  it("produce un libro con solo encabezados cuando no hay activos", async () => {
    const hoja = await leer(await libroInventario([]));
    expect(hoja.rowCount).toBe(1);
  });
});

describe("nombreArchivoInventario", () => {
  it("incluye la fecha del día", () => {
    expect(nombreArchivoInventario("2026-11-16")).toBe("inventario-2026-11-16.xlsx");
  });
});
