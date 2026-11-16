import { describe, expect, it } from "vitest";
import { fechaImpresa, partesFecha } from "./actas";

describe("fechaImpresa", () => {
  it("imprime la fecha con el separador de cada formato", () => {
    expect(fechaImpresa("2025-05-15")).toBe("15/05/2025");
    expect(fechaImpresa("2022-02-23", "-")).toBe("23-02-2022");
  });

  it("deja en blanco lo vacío y respeta un texto que no es fecha", () => {
    expect(fechaImpresa("")).toBe("");
    expect(fechaImpresa("SIN FECHA")).toBe("SIN FECHA");
  });
});

describe("partesFecha", () => {
  it("separa día, mes y año para las casillas de la baja", () => {
    expect(partesFecha("2026-05-29")).toEqual({ dia: "29", mes: "05", anio: "2026" });
    expect(partesFecha("")).toEqual({ dia: "", mes: "", anio: "" });
  });
});
