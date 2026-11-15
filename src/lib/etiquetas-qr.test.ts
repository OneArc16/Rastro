import { describe, expect, it } from "vitest";
import { filtrarParaEtiquetas, type FilaEtiquetable } from "./etiquetas-qr";

function fila(codigo: string, cambios: Partial<FilaEtiquetable> = {}): FilaEtiquetable {
  return {
    codigo,
    tipo: "pc_mesa",
    marca: "DELL",
    modelo: "OPTIPLEX",
    estado: "operativo",
    responsable: null,
    ubicacion: null,
    ...cambios,
  };
}

const FILAS = [
  fila("IMP-0001", { tipo: "impresora", marca: "EPSON", ubicacion: "IPS - CONTABILIDAD" }),
  fila("MON-0001", { tipo: "monitor", marca: "LG", ubicacion: "IPS - CONTABILIDAD" }),
  fila("PC-014", { responsable: "TEYLIN MARTINEZ", ubicacion: "IPS - LINEA DE FRENTE 2DO PISO" }),
  fila("PC-101", { marca: "LENOVO", ubicacion: "DISPENSARIO GUACAMAYAL - LINEA DE FRENTE" }),
  fila("PC-099", { estado: "dado_de_baja" }),
];

const codigos = (filas: FilaEtiquetable[]) => filas.map((f) => f.codigo);

describe("filtrarParaEtiquetas", () => {
  it("sin filtros devuelve todo menos lo dado de baja", () => {
    expect(codigos(filtrarParaEtiquetas(FILAS, {}))).toEqual(["IMP-0001", "MON-0001", "PC-014", "PC-101"]);
  });

  it("con un código devuelve solo ese activo", () => {
    expect(codigos(filtrarParaEtiquetas(FILAS, { codigo: "pc-014" }))).toEqual(["PC-014"]);
  });

  it("filtra por tipo y por ubicación, combinados", () => {
    expect(codigos(filtrarParaEtiquetas(FILAS, { tipo: "monitor" }))).toEqual(["MON-0001"]);
    expect(codigos(filtrarParaEtiquetas(FILAS, { ubicacion: "IPS - CONTABILIDAD" }))).toEqual([
      "IMP-0001",
      "MON-0001",
    ]);
    expect(
      codigos(filtrarParaEtiquetas(FILAS, { tipo: "impresora", ubicacion: "IPS - CONTABILIDAD" })),
    ).toEqual(["IMP-0001"]);
  });

  it("busca texto en código, marca, modelo y responsable, sin importar mayúsculas", () => {
    expect(codigos(filtrarParaEtiquetas(FILAS, { texto: "lenovo" }))).toEqual(["PC-101"]);
    expect(codigos(filtrarParaEtiquetas(FILAS, { texto: "teylin" }))).toEqual(["PC-014"]);
    expect(codigos(filtrarParaEtiquetas(FILAS, { texto: "  " }))).toHaveLength(4);
  });

  it("nunca incluye un activo dado de baja, aunque se lo pida por código", () => {
    expect(filtrarParaEtiquetas(FILAS, { codigo: "PC-099" })).toEqual([]);
  });
});
