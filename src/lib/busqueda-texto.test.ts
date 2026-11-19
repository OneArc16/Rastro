import { describe, expect, it } from "vitest";
import { coincideConBusqueda } from "./busqueda-texto";

describe("coincideConBusqueda", () => {
  it("ignora mayúsculas y tildes y exige que cada palabra aparezca", () => {
    expect(coincideConBusqueda("DANIEL CASTAÑO NAVARRO", "castano")).toBe(true);
    expect(coincideConBusqueda("KARINA TEJADA REALES", "karina reales")).toBe(true);
    expect(coincideConBusqueda("KARINA TEJADA REALES", "karina perez")).toBe(false);
  });

  it("acepta todo con la búsqueda vacía", () => {
    expect(coincideConBusqueda("ANA PEREIRA", "   ")).toBe(true);
  });
});
