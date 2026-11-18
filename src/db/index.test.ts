import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  delete (globalThis as { __rastroDb?: unknown }).__rastroDb;
});

describe("conexión de la app", () => {
  it("durante next build usa una base en memoria y no abre el archivo de datos", async () => {
    // Next carga los módulos en varios procesos a la vez al recolectar datos de las
    // páginas; abrir el archivo en cada uno chocaba con "database is locked".
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    const { db } = await import("./index");
    expect(db.$client.name).toBe(":memory:");
  });
});
