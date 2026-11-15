import { describe, expect, it } from "vitest";
import { normalizarUrlBase, origenDesdeEncabezados, urlDeActivo } from "./url-publica";

describe("normalizarUrlBase", () => {
  it("acepta http o https y quita la barra final y los espacios", () => {
    expect(normalizarUrlBase("http://192.168.1.50:3000/")).toBe("http://192.168.1.50:3000");
    expect(normalizarUrlBase("  https://rastro.local  ")).toBe("https://rastro.local");
    expect(normalizarUrlBase("http://pc-sistemas:3000/rastro/")).toBe("http://pc-sistemas:3000/rastro");
  });

  it("rechaza valores vacíos, sin protocolo o con otro protocolo", () => {
    expect(normalizarUrlBase(undefined)).toBeNull();
    expect(normalizarUrlBase("")).toBeNull();
    expect(normalizarUrlBase("192.168.1.50:3000")).toBeNull();
    expect(normalizarUrlBase("ftp://192.168.1.50")).toBeNull();
  });
});

describe("urlDeActivo", () => {
  it("arma la dirección de la ficha del activo", () => {
    expect(urlDeActivo("http://192.168.1.50:3000", "PC-014")).toBe(
      "http://192.168.1.50:3000/activos/PC-014",
    );
  });

  it("codifica los caracteres que no van en una URL", () => {
    expect(urlDeActivo("http://x", "PC 14/2")).toBe("http://x/activos/PC%2014%2F2");
  });
});

describe("origenDesdeEncabezados", () => {
  it("arma el origen del pedido actual", () => {
    expect(origenDesdeEncabezados("localhost:3000", null)).toBe("http://localhost:3000");
    expect(origenDesdeEncabezados("192.168.1.50:3000", "https")).toBe("https://192.168.1.50:3000");
  });

  it("devuelve null sin host", () => {
    expect(origenDesdeEncabezados(null, "http")).toBeNull();
  });
});
