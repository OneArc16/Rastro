import path from "node:path";
import { asc, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { conectar, type Db } from "@/db";
import {
  activos,
  asignaciones,
  funcionarios,
  ubicaciones,
} from "@/db/schema";
import {
  asignar,
  darDeBaja,
  devolver,
  intercambiar,
  retirarFuncionario,
  trasladar,
} from "./asignaciones";
import { ErrorDeNegocio } from "./comunes";

let db: Db;
let ana: number;
let beto: number;
let bodega: number;
let pc1: number;
let pc2: number;
let monitor: number;

function crearBaseDePrueba(): Db {
  const nueva = conectar(":memory:");
  migrate(nueva, {
    migrationsFolder: path.resolve(__dirname, "../../drizzle"),
  });
  return nueva;
}

function historialDe(activoId: number) {
  return db
    .select()
    .from(asignaciones)
    .where(eq(asignaciones.activoId, activoId))
    .orderBy(asc(asignaciones.id))
    .all();
}

function vigenteDe(activoId: number) {
  return historialDe(activoId).find((a) => a.fechaHasta === null) ?? null;
}

beforeEach(() => {
  db = crearBaseDePrueba();
  bodega = db.insert(ubicaciones).values({ nombre: "BODEGA" }).returning().get().id;
  ana = db.insert(funcionarios).values({ nombre: "ANA" }).returning().get().id;
  beto = db.insert(funcionarios).values({ nombre: "BETO" }).returning().get().id;
  pc1 = db
    .insert(activos)
    .values({ codigo: "PC-001", tipo: "pc_mesa" })
    .returning()
    .get().id;
  pc2 = db
    .insert(activos)
    .values({ codigo: "PC-002", tipo: "portatil" })
    .returning()
    .get().id;
  monitor = db
    .insert(activos)
    .values({ codigo: "MON-0001", tipo: "monitor" })
    .returning()
    .get().id;
});

describe("asignar", () => {
  it("crea una asignación vigente a un funcionario", () => {
    asignar(db, {
      activoId: pc1,
      destino: { funcionarioId: ana },
      fecha: "2025-01-10",
      motivo: "Asignación inicial",
    });
    expect(vigenteDe(pc1)).toMatchObject({
      funcionarioId: ana,
      ubicacionId: null,
      fechaDesde: "2025-01-10",
      motivo: "Asignación inicial",
    });
  });

  it("asigna a una ubicación (equipo compartido)", () => {
    asignar(db, { activoId: monitor, destino: { ubicacionId: bodega }, fecha: "2025-01-10" });
    expect(vigenteDe(monitor)).toMatchObject({ funcionarioId: null, ubicacionId: bodega });
  });

  it("rechaza un activo que ya tiene asignación vigente", () => {
    asignar(db, { activoId: pc1, destino: { funcionarioId: ana }, fecha: "2025-01-10" });
    expect(() =>
      asignar(db, { activoId: pc1, destino: { funcionarioId: beto }, fecha: "2025-02-01" }),
    ).toThrow(ErrorDeNegocio);
    expect(historialDe(pc1)).toHaveLength(1);
  });

  it("rechaza activos dados de baja y funcionarios retirados (asunción A1)", () => {
    db.update(activos).set({ estado: "dado_de_baja" }).where(eq(activos.id, pc1)).run();
    expect(() =>
      asignar(db, { activoId: pc1, destino: { funcionarioId: ana }, fecha: "2025-01-10" }),
    ).toThrow(ErrorDeNegocio);

    db.update(funcionarios).set({ retirado: true }).where(eq(funcionarios.id, beto)).run();
    expect(() =>
      asignar(db, { activoId: pc2, destino: { funcionarioId: beto }, fecha: "2025-01-10" }),
    ).toThrow(ErrorDeNegocio);
  });

  it("rechaza un destino inexistente", () => {
    expect(() =>
      asignar(db, { activoId: pc1, destino: { funcionarioId: 999 }, fecha: "2025-01-10" }),
    ).toThrow(ErrorDeNegocio);
  });
});

describe("trasladar", () => {
  beforeEach(() => {
    asignar(db, { activoId: monitor, destino: { funcionarioId: ana }, fecha: "2025-01-10" });
  });

  it("cierra la vigente y abre una nueva, sin editar la anterior", () => {
    trasladar(db, {
      activoId: monitor,
      destino: { funcionarioId: beto },
      fecha: "2025-03-01",
      motivo: "Traslado de monitor",
    });

    const [anterior, nueva] = historialDe(monitor);
    expect(anterior).toMatchObject({
      funcionarioId: ana,
      fechaDesde: "2025-01-10",
      fechaHasta: "2025-03-01",
    });
    expect(nueva).toMatchObject({
      funcionarioId: beto,
      fechaDesde: "2025-03-01",
      fechaHasta: null,
      motivo: "Traslado de monitor",
    });
  });

  it("rechaza una fecha anterior al inicio de la vigente sin tocar nada (asunción A2)", () => {
    expect(() =>
      trasladar(db, { activoId: monitor, destino: { funcionarioId: beto }, fecha: "2024-12-31" }),
    ).toThrow(ErrorDeNegocio);
    expect(historialDe(monitor)).toHaveLength(1);
    expect(vigenteDe(monitor)?.funcionarioId).toBe(ana);
  });

  it("rechaza trasladar al mismo destino actual", () => {
    expect(() =>
      trasladar(db, { activoId: monitor, destino: { funcionarioId: ana }, fecha: "2025-03-01" }),
    ).toThrow(ErrorDeNegocio);
  });

  it("rechaza trasladar un activo sin asignación vigente", () => {
    expect(() =>
      trasladar(db, { activoId: pc1, destino: { funcionarioId: beto }, fecha: "2025-03-01" }),
    ).toThrow(ErrorDeNegocio);
  });

  it("revierte el cierre si la apertura falla (una sola transacción)", () => {
    expect(() =>
      trasladar(db, { activoId: monitor, destino: { funcionarioId: 999 }, fecha: "2025-03-01" }),
    ).toThrow();
    expect(historialDe(monitor)).toHaveLength(1);
    expect(vigenteDe(monitor)?.funcionarioId).toBe(ana);
  });
});

describe("devolver", () => {
  it("cierra la vigente y deja el activo disponible", () => {
    asignar(db, { activoId: pc1, destino: { funcionarioId: ana }, fecha: "2025-01-10" });
    devolver(db, { activoId: pc1, fecha: "2025-04-01" });
    expect(vigenteDe(pc1)).toBeNull();
    expect(historialDe(pc1)[0].fechaHasta).toBe("2025-04-01");
  });

  it("rechaza devolver un activo sin asignación vigente", () => {
    expect(() => devolver(db, { activoId: pc1, fecha: "2025-04-01" })).toThrow(ErrorDeNegocio);
  });
});

describe("intercambiar (cambio de PC entre dos funcionarios)", () => {
  beforeEach(() => {
    asignar(db, { activoId: pc1, destino: { funcionarioId: ana }, fecha: "2025-01-10" });
    asignar(db, { activoId: pc2, destino: { funcionarioId: beto }, fecha: "2025-01-10" });
  });

  it("en una operación, cada funcionario queda con el equipo del otro", () => {
    intercambiar(db, {
      activoAId: pc1,
      activoBId: pc2,
      fecha: "2025-05-01",
      motivo: "Cambio de PC",
    });

    expect(vigenteDe(pc1)).toMatchObject({ funcionarioId: beto, fechaDesde: "2025-05-01", motivo: "Cambio de PC" });
    expect(vigenteDe(pc2)).toMatchObject({ funcionarioId: ana, fechaDesde: "2025-05-01", motivo: "Cambio de PC" });
    expect(historialDe(pc1)[0]).toMatchObject({ funcionarioId: ana, fechaHasta: "2025-05-01" });
    expect(historialDe(pc2)[0]).toMatchObject({ funcionarioId: beto, fechaHasta: "2025-05-01" });
  });

  it("rechaza intercambiar un activo consigo mismo o con uno sin asignación, sin cambios", () => {
    expect(() =>
      intercambiar(db, { activoAId: pc1, activoBId: pc1, fecha: "2025-05-01" }),
    ).toThrow(ErrorDeNegocio);
    expect(() =>
      intercambiar(db, { activoAId: pc1, activoBId: monitor, fecha: "2025-05-01" }),
    ).toThrow(ErrorDeNegocio);
    expect(historialDe(pc1)).toHaveLength(1);
    expect(vigenteDe(pc1)?.funcionarioId).toBe(ana);
  });

  it("rechaza intercambiar dos activos del mismo responsable", () => {
    asignar(db, { activoId: monitor, destino: { funcionarioId: ana }, fecha: "2025-01-10" });
    expect(() =>
      intercambiar(db, { activoAId: pc1, activoBId: monitor, fecha: "2025-05-01" }),
    ).toThrow(ErrorDeNegocio);
  });
});

describe("darDeBaja", () => {
  it("cierra la vigente, cambia el estado y anota el motivo", () => {
    asignar(db, { activoId: pc1, destino: { funcionarioId: ana }, fecha: "2025-01-10" });
    darDeBaja(db, { activoId: pc1, fecha: "2025-06-01", motivo: "Board dañada" });

    const activo = db.select().from(activos).where(eq(activos.id, pc1)).get();
    expect(activo?.estado).toBe("dado_de_baja");
    expect(activo?.observaciones).toContain("Dado de baja el 01/06/2025: Board dañada");
    expect(vigenteDe(pc1)).toBeNull();
    expect(historialDe(pc1)[0].fechaHasta).toBe("2025-06-01");
  });

  it("funciona con un activo disponible y rechaza uno ya dado de baja", () => {
    darDeBaja(db, { activoId: pc2, fecha: "2025-06-01" });
    expect(() => darDeBaja(db, { activoId: pc2, fecha: "2025-06-02" })).toThrow(ErrorDeNegocio);
  });
});

describe("retirarFuncionario", () => {
  it("cierra todas sus asignaciones vigentes y lo marca retirado", () => {
    asignar(db, { activoId: pc1, destino: { funcionarioId: ana }, fecha: "2025-01-10" });
    asignar(db, { activoId: monitor, destino: { funcionarioId: ana }, fecha: "2025-01-10" });
    asignar(db, { activoId: pc2, destino: { funcionarioId: beto }, fecha: "2025-01-10" });

    retirarFuncionario(db, { funcionarioId: ana, fecha: "2025-07-01" });

    const funcionario = db.select().from(funcionarios).where(eq(funcionarios.id, ana)).get();
    expect(funcionario?.retirado).toBe(true);
    expect(vigenteDe(pc1)).toBeNull();
    expect(vigenteDe(monitor)).toBeNull();
    expect(historialDe(pc1)[0].fechaHasta).toBe("2025-07-01");
    expect(vigenteDe(pc2)?.funcionarioId).toBe(beto);
  });

  it("rechaza retirar a alguien ya retirado", () => {
    retirarFuncionario(db, { funcionarioId: beto, fecha: "2025-07-01" });
    expect(() => retirarFuncionario(db, { funcionarioId: beto, fecha: "2025-07-02" })).toThrow(
      ErrorDeNegocio,
    );
  });
});
