import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { conectar, type Db } from "@/db";
import { crearActa, crearActaDeBaja, crearActaDeEgreso, FORMATOS_PREDETERMINADOS } from "@/dominio/actas";
import { adjuntarEscaneo } from "@/dominio/escaneos";
import { esquemaDatosBaja, esquemaDatosEgreso, esquemaDatosEntrega } from "@/lib/validacion/actas";
import { buscarActasEn, interpretarCodigoActa } from "./busqueda-actas";
import { activos, funcionarios, ubicaciones } from "./schema";

let db: Db;
let ana: number;
let pc: number;
let usb: number;
let sede: number;

const codigos = (filas: { codigo: string }[]) => filas.map((f) => f.codigo);

beforeEach(() => {
  db = conectar(":memory:");
  migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
  ana = db.insert(funcionarios).values({ nombre: "Ana Prueba" }).returning().get().id;
  sede = db.insert(ubicaciones).values({ nombre: "DISPENSARIO SUR" }).returning().get().id;
  pc = db.insert(activos).values({ codigo: "PC-014", tipo: "pc_mesa" }).returning().get().id;
  usb = db.insert(activos).values({ codigo: "OTR-002", tipo: "otro" }).returning().get().id;

  crearActa(db, {
    tipo: "entrega",
    fecha: "2026-01-10",
    funcionarioId: ana,
    activoIds: [pc],
    datos: esquemaDatosEntrega.parse({
      formato: FORMATOS_PREDETERMINADOS.entrega,
      responsable: { nombre: "Ana Prueba" },
      perifericos: [],
      torre: {},
      pruebas: [],
      entrega: {},
      observacion: "Equipo con 100% de garantía",
    }),
  });
  crearActaDeEgreso(db, {
    fecha: "2026-03-05",
    ubicacionId: sede,
    activoIds: [pc],
    trasladar: false,
    datos: esquemaDatosEgreso.parse({
      formato: FORMATOS_PREDETERMINADOS.egreso,
      funcionarioTi: {},
      dispositivos: [],
      recibe: {},
      detalleEnvio: "Salida con cargador",
    }),
  });
  crearActaDeBaja(db, {
    fecha: "2026-05-29",
    activoId: usb,
    datos: esquemaDatosBaja.parse({
      formato: FORMATOS_PREDETERMINADOS.baja,
      responsable: {},
      equipo: {},
      calificaciones: [],
      diagnostico: {},
      jefeArea: {},
      especificacion: "Memoria con daño en circuitos",
    }),
  });
});

describe("interpretarCodigoActa", () => {
  it("reconoce el código con o sin guion y ceros", () => {
    expect(interpretarCodigoActa("ENT-0003")).toEqual({ tipo: "entrega", numero: 3 });
    expect(interpretarCodigoActa(" baj 12 ")).toEqual({ tipo: "baja", numero: 12 });
    expect(interpretarCodigoActa("egr1")).toEqual({ tipo: "egreso", numero: 1 });
    expect(interpretarCodigoActa("PC-014")).toBeNull();
  });
});

describe("buscarActasEn", () => {
  it("sin filtros lista todas, de la más reciente a la más antigua, con sus equipos", () => {
    const filas = buscarActasEn(db, {});
    expect(codigos(filas)).toEqual(["BAJ-0001", "EGR-0001", "ENT-0001"]);
    expect(filas[1]).toMatchObject({ ubicacion: "DISPENSARIO SUR", equipos: "PC-014" });
    expect(filas[2]).toMatchObject({ funcionario: "Ana Prueba", editadaEn: null });
  });

  it("filtra por tipo, rango de fechas, funcionario y equipo", () => {
    expect(codigos(buscarActasEn(db, { tipo: "egreso" }))).toEqual(["EGR-0001"]);
    expect(codigos(buscarActasEn(db, { desde: "2026-03-01", hasta: "2026-04-30" }))).toEqual([
      "EGR-0001",
    ]);
    expect(codigos(buscarActasEn(db, { funcionarioId: ana }))).toEqual(["ENT-0001"]);
    expect(codigos(buscarActasEn(db, { activoId: pc }))).toEqual(["EGR-0001", "ENT-0001"]);
  });

  it("busca por número de acta, código de equipo, nombres y contenido", () => {
    expect(codigos(buscarActasEn(db, { texto: "baj-1" }))).toEqual(["BAJ-0001"]);
    expect(codigos(buscarActasEn(db, { texto: "pc-014" }))).toEqual(["EGR-0001", "ENT-0001"]);
    expect(codigos(buscarActasEn(db, { texto: "dispensario" }))).toEqual(["EGR-0001"]);
    expect(codigos(buscarActasEn(db, { texto: "circuitos" }))).toEqual(["BAJ-0001"]);
    expect(codigos(buscarActasEn(db, { texto: "ana prueba" }))).toEqual(["ENT-0001"]);
  });

  it("indica cuántos archivos escaneados tiene cada acta", () => {
    const [baja, egreso] = buscarActasEn(db, {});
    const pdf = Buffer.from("%PDF-1.7 firmada");
    adjuntarEscaneo(db, { actaId: baja.id, nombre: "a.pdf", tipo: "application/pdf", contenido: pdf });
    adjuntarEscaneo(db, { actaId: baja.id, nombre: "b.pdf", tipo: "application/pdf", contenido: pdf });

    const porId = new Map(buscarActasEn(db, {}).map((a) => [a.id, a.escaneos]));
    expect(porId.get(baja.id)).toBe(2);
    expect(porId.get(egreso.id)).toBe(0);
  });

  it("trata % y _ como texto, no como comodines", () => {
    expect(codigos(buscarActasEn(db, { texto: "100%" }))).toEqual(["ENT-0001"]);
    expect(codigos(buscarActasEn(db, { texto: "%" }))).toEqual(["ENT-0001"]);
    expect(buscarActasEn(db, { texto: "_" })).toEqual([]);
  });
});
