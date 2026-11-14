import path from "node:path";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { conectar, type Db } from "@/db";
import { activos, mantenimientos } from "@/db/schema";
import { diasEntre, sumarDias } from "@/lib/fechas";
import { ErrorDeNegocio } from "./comunes";
import {
  garantiasPorVencer,
  pendientesDeMantenimiento,
  registrarMantenimiento,
  type ActivoConGarantia,
  type MantenimientoConActivo,
} from "./mantenimientos";

describe("sumarDias", () => {
  it("suma días cruzando meses y años", () => {
    expect(sumarDias("2026-11-14", 30)).toBe("2026-12-14");
    expect(sumarDias("2026-12-20", 15)).toBe("2027-01-04");
    expect(sumarDias("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("diasEntre", () => {
  it("cuenta días hacia adelante y hacia atrás", () => {
    expect(diasEntre("2026-11-14", "2026-12-14")).toBe(30);
    expect(diasEntre("2026-11-14", "2026-11-02")).toBe(-12);
    expect(diasEntre("2026-11-14", "2026-11-14")).toBe(0);
  });
});

describe("registrarMantenimiento", () => {
  let db: Db;
  let pc: number;

  beforeEach(() => {
    db = conectar(":memory:");
    migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
    pc = db.insert(activos).values({ codigo: "PC-001", tipo: "pc_mesa" }).returning().get().id;
  });

  const historial = () =>
    db.select().from(mantenimientos).where(eq(mantenimientos.activoId, pc)).all();

  it("guarda el mantenimiento con su próxima fecha", () => {
    registrarMantenimiento(db, {
      activoId: pc,
      fecha: "2026-11-14",
      proximaFecha: "2027-05-14",
      tipo: "preventivo",
      observacion: "Limpieza",
    });
    expect(historial()).toEqual([
      expect.objectContaining({
        fecha: "2026-11-14",
        proximaFecha: "2027-05-14",
        tipo: "preventivo",
        observacion: "Limpieza",
      }),
    ]);
  });

  it("permite no indicar próxima fecha ni observación", () => {
    registrarMantenimiento(db, { activoId: pc, fecha: "2026-11-14", tipo: "correctivo" });
    expect(historial()[0]).toMatchObject({ proximaFecha: null, observacion: null });
  });

  it("rechaza una próxima fecha que no sea posterior (asunción A5), sin guardar", () => {
    expect(() =>
      registrarMantenimiento(db, {
        activoId: pc,
        fecha: "2026-11-14",
        proximaFecha: "2026-11-14",
        tipo: "preventivo",
      }),
    ).toThrow(ErrorDeNegocio);
    expect(historial()).toHaveLength(0);
  });

  it("rechaza activos dados de baja o inexistentes y fechas mal escritas (asunción A4)", () => {
    db.update(activos).set({ estado: "dado_de_baja" }).where(eq(activos.id, pc)).run();
    expect(() =>
      registrarMantenimiento(db, { activoId: pc, fecha: "2026-11-14", tipo: "preventivo" }),
    ).toThrow(ErrorDeNegocio);
    expect(() =>
      registrarMantenimiento(db, { activoId: 999, fecha: "2026-11-14", tipo: "preventivo" }),
    ).toThrow(ErrorDeNegocio);
    expect(() =>
      registrarMantenimiento(db, { activoId: pc, fecha: "14/11/2026", tipo: "preventivo" }),
    ).toThrow(ErrorDeNegocio);
  });
});

function mant(
  parcial: Partial<MantenimientoConActivo> &
    Pick<MantenimientoConActivo, "id" | "activoId" | "fecha">,
): MantenimientoConActivo {
  return {
    proximaFecha: null,
    tipo: "preventivo",
    codigo: `ACT-${parcial.activoId}`,
    estadoActivo: "operativo",
    ...parcial,
  };
}

describe("pendientesDeMantenimiento", () => {
  const HOY = "2026-11-14";

  it("clasifica en vencidos y próximos según la próxima fecha y la ventana de 30 días (A2)", () => {
    const resultado = pendientesDeMantenimiento(
      [
        mant({ id: 1, activoId: 1, fecha: "2026-05-01", proximaFecha: "2026-11-13" }),
        mant({ id: 2, activoId: 2, fecha: "2026-06-01", proximaFecha: "2026-11-14" }),
        mant({ id: 3, activoId: 3, fecha: "2026-06-01", proximaFecha: "2026-12-14" }),
        mant({ id: 4, activoId: 4, fecha: "2026-06-01", proximaFecha: "2026-12-15" }),
      ],
      HOY,
    );
    expect(resultado.vencidos.map((p) => p.codigo)).toEqual(["ACT-1"]);
    expect(resultado.proximos.map((p) => p.codigo)).toEqual(["ACT-2", "ACT-3"]);
  });

  it("solo cuenta el mantenimiento más reciente de cada activo (A1)", () => {
    const resultado = pendientesDeMantenimiento(
      [
        mant({ id: 1, activoId: 1, fecha: "2025-11-05", proximaFecha: "2026-05-05" }),
        mant({ id: 2, activoId: 1, fecha: "2026-05-10", proximaFecha: "2026-11-20" }),
      ],
      HOY,
    );
    expect(resultado.vencidos).toEqual([]);
    expect(resultado.proximos).toEqual([
      expect.objectContaining({ codigo: "ACT-1", proximaFecha: "2026-11-20", ultimaFecha: "2026-05-10" }),
    ]);
  });

  it("ignora activos dados de baja y mantenimientos más recientes sin próxima fecha", () => {
    const resultado = pendientesDeMantenimiento(
      [
        mant({ id: 1, activoId: 1, fecha: "2026-01-01", proximaFecha: "2026-02-01", estadoActivo: "dado_de_baja" }),
        mant({ id: 2, activoId: 2, fecha: "2026-01-01", proximaFecha: "2026-02-01" }),
        mant({ id: 3, activoId: 2, fecha: "2026-10-01", proximaFecha: null, tipo: "correctivo" }),
      ],
      HOY,
    );
    expect(resultado).toEqual({ vencidos: [], proximos: [] });
  });

  it("ordena cada lista por próxima fecha, de la más antigua a la más lejana", () => {
    const resultado = pendientesDeMantenimiento(
      [
        mant({ id: 1, activoId: 1, fecha: "2026-01-01", proximaFecha: "2026-09-01" }),
        mant({ id: 2, activoId: 2, fecha: "2026-01-01", proximaFecha: "2026-03-01" }),
      ],
      HOY,
    );
    expect(resultado.vencidos.map((p) => p.proximaFecha)).toEqual(["2026-03-01", "2026-09-01"]);
  });
});

describe("garantiasPorVencer", () => {
  const HOY = "2026-11-14";
  const activo = (parcial: Partial<ActivoConGarantia> & Pick<ActivoConGarantia, "id">) => ({
    codigo: `ACT-${parcial.id}`,
    garantiaHasta: null,
    estado: "operativo" as const,
    ...parcial,
  });

  it("lista las que vencen desde hoy hasta 60 días, ordenadas (A3)", () => {
    const resultado = garantiasPorVencer(
      [
        activo({ id: 1, garantiaHasta: "2027-01-13" }),
        activo({ id: 2, garantiaHasta: "2026-11-14" }),
        activo({ id: 3, garantiaHasta: "2027-01-14" }),
        activo({ id: 4, garantiaHasta: "2026-11-13" }),
        activo({ id: 5 }),
        activo({ id: 6, garantiaHasta: "2026-12-01", estado: "dado_de_baja" }),
      ],
      HOY,
    );
    expect(resultado.map((a) => a.codigo)).toEqual(["ACT-2", "ACT-1"]);
  });
});
