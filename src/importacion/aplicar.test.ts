import path from "node:path";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { conectar, type Db } from "@/db";
import {
  activos,
  asignaciones,
  configuracion,
  funcionarios,
  mantenimientos,
  ubicaciones,
} from "@/db/schema";
import { ErrorDeNegocio, MOTIVO_CARGA_INICIAL } from "@/dominio/comunes";
import { fechaIsoLocal } from "@/lib/fechas";
import { aplicarPlan } from "./aplicar";
import type { ActivoPlaneado, PlanImportacion } from "./plan";

let db: Db;

beforeEach(() => {
  db = conectar(":memory:");
  migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
});

function activo(codigo: string, destino: ActivoPlaneado["destino"], cambios: Partial<ActivoPlaneado> = {}): ActivoPlaneado {
  return {
    hoja: "1",
    codigo,
    tipo: "pc_mesa",
    marca: "DELL",
    modelo: null,
    serial: null,
    color: null,
    valor: null,
    fechaCompra: null,
    garantiaHasta: null,
    specs: null,
    observaciones: null,
    destino,
    fechaDesde: "2025-07-09",
    ...cambios,
  };
}

const PLAN: PlanImportacion = {
  ubicaciones: ["IPS - CONTABILIDAD", "IPS - CONSULTORIO 9"],
  funcionarios: [{ clave: "ANA PEREZ", nombre: "ANA PEREZ", ubicacion: "IPS - CONTABILIDAD" }],
  activos: [
    activo("PC-001", { tipo: "funcionario", clave: "ANA PEREZ" }, { specs: { ram: "8 GB" }, observaciones: "ANTERIOR PC DE LUIS" }),
    activo("MON-0001", { tipo: "funcionario", clave: "ANA PEREZ" }, { tipo: "monitor" }),
    activo("PC-015", { tipo: "ubicacion", nombre: "IPS - CONSULTORIO 9" }),
    activo("PC-043", null),
  ],
  mantenimientos: [
    { codigoActivo: "PC-001", fecha: "2026-04-09", proximaFecha: "2026-10-09", tipo: "preventivo", observacion: "LIMPIEZA" },
  ],
  avisos: [],
};

const contar = () => ({
  ubicaciones: db.select().from(ubicaciones).all().length,
  funcionarios: db.select().from(funcionarios).all().length,
  activos: db.select().from(activos).all().length,
  asignaciones: db.select().from(asignaciones).all().length,
  mantenimientos: db.select().from(mantenimientos).all().length,
});

describe("aplicarPlan", () => {
  it("crea todo y deja cada activo con su asignación vigente o disponible", () => {
    const resultado = aplicarPlan(db, PLAN, { reemplazar: false });
    expect(resultado).toEqual({
      ubicaciones: 2, funcionarios: 1, activos: 4, asignaciones: 3, mantenimientos: 1, borrados: 0,
    });

    const ana = db.select().from(funcionarios).get();
    const contabilidad = db.select().from(ubicaciones).where(eq(ubicaciones.nombre, "IPS - CONTABILIDAD")).get();
    expect(ana).toMatchObject({ nombre: "ANA PEREZ", ubicacionId: contabilidad?.id, retirado: false });

    const pc1 = db.select().from(activos).where(eq(activos.codigo, "PC-001")).get();
    expect(pc1).toMatchObject({ estado: "operativo", specs: { ram: "8 GB" }, observaciones: "ANTERIOR PC DE LUIS" });
    // La última modificación es la de la hoja del Excel, no el momento de importar
    expect(fechaIsoLocal(pc1!.actualizadoEn)).toBe("2025-07-09");
    expect(db.select().from(asignaciones).where(eq(asignaciones.activoId, pc1!.id)).get()).toMatchObject({
      funcionarioId: ana!.id, ubicacionId: null, fechaDesde: "2025-07-09", fechaHasta: null, motivo: MOTIVO_CARGA_INICIAL,
    });

    const pc43 = db.select().from(activos).where(eq(activos.codigo, "PC-043")).get();
    expect(db.select().from(asignaciones).where(eq(asignaciones.activoId, pc43!.id)).all()).toEqual([]);
    expect(db.select().from(mantenimientos).get()).toMatchObject({ activoId: pc1!.id, tipo: "preventivo" });
  });

  it("se niega a importar sobre una base con activos si no se pide reemplazar, sin cambiar nada", () => {
    db.insert(activos).values({ codigo: "PC-999", tipo: "pc_mesa" }).run();
    expect(() => aplicarPlan(db, PLAN, { reemplazar: false })).toThrow(ErrorDeNegocio);
    expect(contar()).toEqual({ ubicaciones: 0, funcionarios: 0, activos: 1, asignaciones: 0, mantenimientos: 0 });
  });

  it("al reemplazar borra los datos anteriores pero conserva la configuración", () => {
    db.insert(configuracion).values({ id: 1, elaboradoNombre: "Daniel" }).run();
    const ubicacionVieja = db.insert(ubicaciones).values({ nombre: "VIEJA" }).returning().get();
    const viejo = db.insert(funcionarios).values({ nombre: "VIEJO", ubicacionId: ubicacionVieja.id }).returning().get();
    const pcViejo = db.insert(activos).values({ codigo: "PC-999", tipo: "pc_mesa" }).returning().get();
    db.insert(asignaciones).values({ activoId: pcViejo.id, funcionarioId: viejo.id, fechaDesde: "2024-01-01" }).run();
    db.insert(mantenimientos).values({ activoId: pcViejo.id, fecha: "2024-02-01", tipo: "correctivo" }).run();

    const resultado = aplicarPlan(db, PLAN, { reemplazar: true });

    expect(resultado.borrados).toBe(1);
    expect(contar()).toEqual({ ubicaciones: 2, funcionarios: 1, activos: 4, asignaciones: 3, mantenimientos: 1 });
    expect(db.select().from(activos).where(eq(activos.codigo, "PC-999")).get()).toBeUndefined();
    expect(db.select().from(configuracion).get()?.elaboradoNombre).toBe("Daniel");
  });

  it("rechaza un plan con códigos repetidos antes de tocar la base", () => {
    db.insert(activos).values({ codigo: "PC-999", tipo: "pc_mesa" }).run();
    const planRepetido: PlanImportacion = { ...PLAN, activos: [...PLAN.activos, activo("PC-001", null)] };

    expect(() => aplicarPlan(db, planRepetido, { reemplazar: true })).toThrow(
      new ErrorDeNegocio("Hay códigos repetidos en el Excel: PC-001. Corregí las hojas antes de importar."),
    );
    expect(contar()).toEqual({ ubicaciones: 0, funcionarios: 0, activos: 1, asignaciones: 0, mantenimientos: 0 });
  });

  it("si algo falla a mitad de camino no queda nada a medias, ni se borran los datos anteriores", () => {
    db.insert(activos).values({ codigo: "PC-999", tipo: "pc_mesa" }).run();
    // Un destino que no está en el plan deja la asignación sin funcionario ni ubicación: la base la rechaza
    const planRoto: PlanImportacion = {
      ...PLAN,
      activos: [...PLAN.activos, activo("PC-050", { tipo: "ubicacion", nombre: "NO EXISTE" })],
    };

    expect(() => aplicarPlan(db, planRoto, { reemplazar: true })).toThrow();
    expect(contar()).toEqual({ ubicaciones: 0, funcionarios: 0, activos: 1, asignaciones: 0, mantenimientos: 0 });
    expect(db.select().from(activos).get()?.codigo).toBe("PC-999");
  });
});
