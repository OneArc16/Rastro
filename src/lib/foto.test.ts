import { describe, expect, it } from "vitest";
import { dimensionesReducidas } from "./foto";

describe("dimensionesReducidas", () => {
  it("lleva el lado mayor a 1600 px manteniendo la proporción", () => {
    expect(dimensionesReducidas(4000, 3000)).toEqual({ ancho: 1600, alto: 1200 });
    expect(dimensionesReducidas(3000, 4000)).toEqual({ ancho: 1200, alto: 1600 });
  });

  it("no agranda una foto pequeña", () => {
    expect(dimensionesReducidas(800, 600)).toEqual({ ancho: 800, alto: 600 });
  });

  it("acepta otro tope", () => {
    expect(dimensionesReducidas(4000, 1000, 1000)).toEqual({ ancho: 1000, alto: 250 });
  });
});
