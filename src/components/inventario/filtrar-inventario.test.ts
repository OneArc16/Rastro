import { describe, expect, it } from "vitest";
import { filtrarInventario } from "./filtrar-inventario";

const filas = [
  {
    codigo: "MON-0037",
    tipo: "monitor" as const,
    marca: "LG",
    modelo: "24MR400",
    serial: "412TOJK1Q596",
    estado: "operativo" as const,
    responsable: "Ana Pérez",
    ubicacionAsignada: null,
    ubicacion: "SANTA MARTA - BODEGA",
  },
  {
    codigo: "PC-003",
    tipo: "pc_mesa" as const,
    marca: "COMPUMAX",
    modelo: "1053-900-0066",
    serial: null,
    estado: "en_reparacion" as const,
    responsable: null,
    ubicacionAsignada: "CONCORDIA - LINEA DE FRENTE",
    ubicacion: "CONCORDIA - LINEA DE FRENTE",
  },
];

const codigos = (texto: string) => filtrarInventario(filas, texto).map((f) => f.codigo);

describe("filtrarInventario", () => {
  it("devuelve todos si la búsqueda está vacía", () => {
    expect(codigos("  ")).toEqual(["MON-0037", "PC-003"]);
  });

  it("encuentra un activo por su serial, sin importar mayúsculas", () => {
    expect(codigos("412TOJK1Q596")).toEqual(["MON-0037"]);
    expect(codigos("412tojk1q596")).toEqual(["MON-0037"]);
  });

  it("busca por código, marca, modelo, responsable y ubicación, ignorando tildes", () => {
    expect(codigos("pc-003")).toEqual(["PC-003"]);
    expect(codigos("lg 24mr400")).toEqual(["MON-0037"]);
    expect(codigos("ana perez")).toEqual(["MON-0037"]);
    expect(codigos("concordia")).toEqual(["PC-003"]);
  });

  it("busca por el tipo y el estado como se ven en la tabla", () => {
    expect(codigos("monitor")).toEqual(["MON-0037"]);
    expect(codigos("reparación")).toEqual(["PC-003"]);
  });
});
