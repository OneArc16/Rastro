import path from "node:path";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { conectar, type Db } from "@/db";
import { actas, actasEscaneos } from "@/db/schema";
import { ErrorDeNegocio } from "./comunes";
import { adjuntarEscaneo, eliminarEscaneo, MAXIMO_ESCANEOS } from "./escaneos";

const PDF = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(32)]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);

let db: Db;
let actaId: number;
let otraActa: number;

beforeEach(() => {
  db = conectar(":memory:");
  migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
  const crear = (numero: number) =>
    db.insert(actas).values({ tipo: "entrega", numero, fecha: "2026-11-18", datos: {} }).returning().get().id;
  actaId = crear(1);
  otraActa = crear(2);
});

const escaneos = (id = actaId) =>
  db.select().from(actasEscaneos).where(eq(actasEscaneos.actaId, id)).all();

describe("adjuntarEscaneo", () => {
  it("guarda PDF e imágenes con su nombre, tipo, tamaño y contenido", () => {
    adjuntarEscaneo(db, { actaId, nombre: "ENT-0001 firmada.pdf", tipo: "application/pdf", contenido: PDF });
    adjuntarEscaneo(db, { actaId, nombre: "hoja 2.jpg", tipo: "image/jpeg", contenido: JPEG });
    adjuntarEscaneo(db, { actaId, nombre: "hoja 3.png", tipo: "image/png", contenido: PNG });

    const guardados = escaneos();
    expect(guardados.map((e) => [e.nombre, e.tipo, e.tamano])).toEqual([
      ["ENT-0001 firmada.pdf", "application/pdf", PDF.length],
      ["hoja 2.jpg", "image/jpeg", JPEG.length],
      ["hoja 3.png", "image/png", PNG.length],
    ]);
    expect(guardados[0].contenido.equals(PDF)).toBe(true);
    expect(guardados[0].subidoEn).toBeInstanceOf(Date);
  });

  it("limpia el nombre del archivo y usa uno por defecto si queda vacío", () => {
    adjuntarEscaneo(db, { actaId, nombre: "C:\\escaner\\..\\acta\u0007 firmada.pdf", tipo: "application/pdf", contenido: PDF });
    adjuntarEscaneo(db, { actaId, nombre: "   ", tipo: "application/pdf", contenido: PDF });
    expect(escaneos().map((e) => e.nombre)).toEqual(["acta firmada.pdf", "acta-escaneada"]);
  });

  it("rechaza tipos no permitidos, archivos falsos, vacíos o grandes y actas que no existen", () => {
    const adjuntar = (contenido: Buffer, tipo: string, id = actaId) =>
      adjuntarEscaneo(db, { actaId: id, nombre: "x", tipo, contenido });

    expect(() => adjuntar(PDF, "application/msword")).toThrow(
      new ErrorDeNegocio("El archivo debe ser PDF, JPG o PNG"),
    );
    expect(() => adjuntar(Buffer.from("<script>"), "application/pdf")).toThrow(
      new ErrorDeNegocio("El archivo no es un PDF o una imagen válida"),
    );
    expect(() => adjuntar(Buffer.alloc(0), "application/pdf")).toThrow(
      new ErrorDeNegocio("El archivo está vacío"),
    );
    expect(() => adjuntar(Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024)]), "application/pdf")).toThrow(
      new ErrorDeNegocio("El archivo supera los 10 MB"),
    );
    expect(() => adjuntar(PDF, "application/pdf", 9999)).toThrow(new ErrorDeNegocio("El acta no existe"));
    expect(db.select().from(actasEscaneos).all()).toHaveLength(0);
  });

  it("no deja pasar del máximo de archivos por acta", () => {
    for (let i = 0; i < MAXIMO_ESCANEOS; i++) {
      adjuntarEscaneo(db, { actaId, nombre: `h${i}.pdf`, tipo: "application/pdf", contenido: PDF });
    }
    expect(() =>
      adjuntarEscaneo(db, { actaId, nombre: "otra.pdf", tipo: "application/pdf", contenido: PDF }),
    ).toThrow(new ErrorDeNegocio(`El acta ya tiene ${MAXIMO_ESCANEOS} archivos escaneados`));
  });
});

describe("eliminarEscaneo", () => {
  it("elimina solo el archivo indicado de esa acta", () => {
    const uno = adjuntarEscaneo(db, { actaId, nombre: "a.pdf", tipo: "application/pdf", contenido: PDF });
    adjuntarEscaneo(db, { actaId, nombre: "b.pdf", tipo: "application/pdf", contenido: PDF });
    const ajeno = adjuntarEscaneo(db, { actaId: otraActa, nombre: "c.pdf", tipo: "application/pdf", contenido: PDF });

    expect(() => eliminarEscaneo(db, actaId, ajeno)).toThrow(
      new ErrorDeNegocio("El archivo no pertenece al acta"),
    );
    eliminarEscaneo(db, actaId, uno);

    expect(escaneos().map((e) => e.nombre)).toEqual(["b.pdf"]);
    expect(escaneos(otraActa)).toHaveLength(1);
  });
});
