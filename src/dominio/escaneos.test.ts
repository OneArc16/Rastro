import path from "node:path";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { conectar, type Db } from "@/db";
import { actas, actasEscaneos } from "@/db/schema";
import { ErrorDeNegocio } from "./comunes";
import { adjuntarEscaneo, eliminarEscaneo } from "./escaneos";

const PDF = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(32)]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);

let db: Db;
let numero = 0;

function nuevaActa() {
  numero++;
  return db.insert(actas).values({ tipo: "entrega", numero, fecha: "2026-11-18", datos: {} }).returning().get().id;
}

beforeEach(() => {
  db = conectar(":memory:");
  migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
});

const escaneos = (actaId: number) =>
  db.select().from(actasEscaneos).where(eq(actasEscaneos.actaId, actaId)).all();

describe("adjuntarEscaneo", () => {
  it("guarda un PDF o una imagen con su nombre, tipo, tamaño y contenido", () => {
    const [a, b, c] = [nuevaActa(), nuevaActa(), nuevaActa()];
    adjuntarEscaneo(db, { actaId: a, nombre: "ENT-0001 firmada.pdf", tipo: "application/pdf", contenido: PDF });
    adjuntarEscaneo(db, { actaId: b, nombre: "acta.jpg", tipo: "image/jpeg", contenido: JPEG });
    adjuntarEscaneo(db, { actaId: c, nombre: "acta.png", tipo: "image/png", contenido: PNG });

    const [pdf] = escaneos(a);
    expect([pdf.nombre, pdf.tipo, pdf.tamano]).toEqual(["ENT-0001 firmada.pdf", "application/pdf", PDF.length]);
    expect(pdf.contenido.equals(PDF)).toBe(true);
    expect(pdf.subidoEn).toBeInstanceOf(Date);
    expect(escaneos(b).map((e) => e.tipo)).toEqual(["image/jpeg"]);
    expect(escaneos(c).map((e) => e.tipo)).toEqual(["image/png"]);
  });

  it("limpia el nombre del archivo y usa uno por defecto si queda vacío", () => {
    const [a, b] = [nuevaActa(), nuevaActa()];
    adjuntarEscaneo(db, { actaId: a, nombre: "C:\\escaner\\..\\acta\u0007 firmada.pdf", tipo: "application/pdf", contenido: PDF });
    adjuntarEscaneo(db, { actaId: b, nombre: "   ", tipo: "application/pdf", contenido: PDF });
    expect(escaneos(a)[0].nombre).toBe("acta firmada.pdf");
    expect(escaneos(b)[0].nombre).toBe("acta-escaneada");
  });

  it("rechaza tipos no permitidos, archivos falsos, vacíos o grandes y actas que no existen", () => {
    const actaId = nuevaActa();
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

  it("admite un solo archivo por acta: para cambiarlo hay que eliminar el actual", () => {
    const actaId = nuevaActa();
    const primero = adjuntarEscaneo(db, { actaId, nombre: "uno.pdf", tipo: "application/pdf", contenido: PDF });

    expect(() =>
      adjuntarEscaneo(db, { actaId, nombre: "dos.pdf", tipo: "application/pdf", contenido: PDF }),
    ).toThrow(new ErrorDeNegocio("El acta ya tiene su copia escaneada; elimínela para subir otra"));
    expect(escaneos(actaId).map((e) => e.nombre)).toEqual(["uno.pdf"]);

    eliminarEscaneo(db, actaId, primero);
    adjuntarEscaneo(db, { actaId, nombre: "dos.pdf", tipo: "application/pdf", contenido: PDF });
    expect(escaneos(actaId).map((e) => e.nombre)).toEqual(["dos.pdf"]);
  });
});

describe("eliminarEscaneo", () => {
  it("elimina solo el archivo de esa acta", () => {
    const [actaId, otra] = [nuevaActa(), nuevaActa()];
    const propio = adjuntarEscaneo(db, { actaId, nombre: "a.pdf", tipo: "application/pdf", contenido: PDF });
    const ajeno = adjuntarEscaneo(db, { actaId: otra, nombre: "b.pdf", tipo: "application/pdf", contenido: PDF });

    expect(() => eliminarEscaneo(db, actaId, ajeno)).toThrow(
      new ErrorDeNegocio("El archivo no pertenece al acta"),
    );
    eliminarEscaneo(db, actaId, propio);

    expect(escaneos(actaId)).toHaveLength(0);
    expect(escaneos(otra)).toHaveLength(1);
  });
});
