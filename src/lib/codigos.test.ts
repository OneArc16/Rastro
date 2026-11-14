import { describe, expect, it } from "vitest";
import { siguienteCodigo } from "./codigos";

describe("siguienteCodigo", () => {
  it("propone el siguiente consecutivo para PC con 3 dígitos", () => {
    expect(siguienteCodigo("pc_mesa", ["PC-001", "PC-013"])).toBe("PC-014");
  });

  it("propone el siguiente consecutivo para monitor con 4 dígitos", () => {
    expect(siguienteCodigo("monitor", ["MON-0003", "MON-0022"])).toBe("MON-0023");
  });

  it("empieza en 1 cuando no hay códigos del prefijo", () => {
    expect(siguienteCodigo("pc_mesa", [])).toBe("PC-001");
    expect(siguienteCodigo("impresora", [])).toBe("IMP-0001");
    expect(siguienteCodigo("teclado", ["PC-010"])).toBe("TEC-0001");
  });

  it("portátil y todo en uno comparten el prefijo PC", () => {
    expect(siguienteCodigo("portatil", ["PC-014"])).toBe("PC-015");
    expect(siguienteCodigo("todo_en_uno", ["PC-014"])).toBe("PC-015");
  });

  it("ignora códigos con otro prefijo o mal formados", () => {
    expect(siguienteCodigo("mouse", ["MOU-0004", "MOU-X", "MON-0099"])).toBe(
      "MOU-0005",
    );
  });

  it("no recorta cuando el consecutivo supera el relleno", () => {
    expect(siguienteCodigo("pc_mesa", ["PC-999"])).toBe("PC-1000");
  });

  it("cubre los tipos sin ejemplo en el plan (asunción A1)", () => {
    expect(siguienteCodigo("parlantes", [])).toBe("PAR-0001");
    expect(siguienteCodigo("audifonos", [])).toBe("AUD-0001");
    expect(siguienteCodigo("otro", [])).toBe("OTR-0001");
  });
});
