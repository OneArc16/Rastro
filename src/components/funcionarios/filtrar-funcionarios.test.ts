import { describe, expect, it } from "vitest";
import { filtrarFuncionarios } from "./filtrar-funcionarios";

const filas = [
  { nombre: "Ana María Pérez", cargo: "Auxiliar", ubicacion: "SANTA MARTA - BODEGA", telefono: "3001112233" },
  { nombre: "Luis Gómez", cargo: null, ubicacion: "CONCORDIA - LINEA DE FRENTE", telefono: null },
  { nombre: "Carlos Ruiz", cargo: "Jefe de bodega", ubicacion: null, telefono: "3104445566" },
];

const nombres = (texto: string) => filtrarFuncionarios(filas, texto).map((f) => f.nombre);

describe("filtrarFuncionarios", () => {
  it("devuelve todos si la búsqueda está vacía", () => {
    expect(nombres("   ")).toEqual(["Ana María Pérez", "Luis Gómez", "Carlos Ruiz"]);
  });

  it("ignora mayúsculas y tildes", () => {
    expect(nombres("maria perez")).toEqual(["Ana María Pérez"]);
    expect(nombres("GÓMEZ")).toEqual(["Luis Gómez"]);
  });

  it("busca en cargo, ubicación y teléfono", () => {
    expect(nombres("bodega")).toEqual(["Ana María Pérez", "Carlos Ruiz"]);
    expect(nombres("concordia")).toEqual(["Luis Gómez"]);
    expect(nombres("310444")).toEqual(["Carlos Ruiz"]);
  });

  it("exige que cada palabra aparezca en algún campo", () => {
    expect(nombres("ana bodega")).toEqual(["Ana María Pérez"]);
    expect(nombres("luis bodega")).toEqual([]);
  });
});
