import { describe, expect, it } from "vitest";
import { normalizarTema } from "./tema";

describe("normalizarTema", () => {
  it("acepta los tres temas de la app", () => {
    expect(normalizarTema("light")).toBe("light");
    expect(normalizarTema("dark")).toBe("dark");
    expect(normalizarTema("system")).toBe("system");
  });

  it("usa el tema del sistema ante valores ajenos o vacíos", () => {
    expect(normalizarTema("azul")).toBe("system");
    expect(normalizarTema('"system"')).toBe("system");
    expect(normalizarTema("Dark")).toBe("system");
    expect(normalizarTema(undefined)).toBe("system");
    expect(normalizarTema("")).toBe("system");
  });
});
