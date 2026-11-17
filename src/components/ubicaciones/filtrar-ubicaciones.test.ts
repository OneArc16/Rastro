import { describe, expect, it } from "vitest";
import { filtrarUbicaciones } from "./filtrar-ubicaciones";

const filas = [
  {
    nombre: "SANTA MARTA - BODEGA",
    funcionarios: [{ nombre: "Ana María Pérez" }],
    equiposCompartidos: [{ codigo: "IMP-003" }],
  },
  {
    nombre: "CONCORDIA - LÍNEA DE FRENTE",
    funcionarios: [{ nombre: "Luis Gómez" }, { nombre: "Carlos Ruiz" }],
    equiposCompartidos: [],
  },
  { nombre: "IPS - ADMINISTRATIVO", funcionarios: [], equiposCompartidos: [{ codigo: "PC-014" }] },
];

const nombres = (texto: string) => filtrarUbicaciones(filas, texto).map((u) => u.nombre);

describe("filtrarUbicaciones", () => {
  it("devuelve todas si la búsqueda está vacía", () => {
    expect(nombres("")).toHaveLength(3);
  });

  it("busca por nombre sin distinguir mayúsculas ni tildes", () => {
    expect(nombres("linea de frente")).toEqual(["CONCORDIA - LÍNEA DE FRENTE"]);
    expect(nombres("santa marta")).toEqual(["SANTA MARTA - BODEGA"]);
  });

  it("encuentra la ubicación por sus funcionarios y sus equipos compartidos", () => {
    expect(nombres("gomez")).toEqual(["CONCORDIA - LÍNEA DE FRENTE"]);
    expect(nombres("pc-014")).toEqual(["IPS - ADMINISTRATIVO"]);
  });

  it("exige que cada palabra aparezca", () => {
    expect(nombres("concordia ruiz")).toEqual(["CONCORDIA - LÍNEA DE FRENTE"]);
    expect(nombres("concordia perez")).toEqual([]);
  });
});
