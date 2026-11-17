import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { conectar } from "@/db";
import { migrarPendientes } from "./migrar";
import { activos } from "./schema";

const CARPETA = path.resolve(__dirname, "../../drizzle");
const TOTAL = JSON.parse(fs.readFileSync(path.join(CARPETA, "meta", "_journal.json"), "utf8")).entries.length;
const temporales: string[] = [];

afterEach(() => {
  for (const dir of temporales.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

/** Copia de la carpeta de migraciones con solo la primera, para simular una base atrasada. */
function carpetaConSoloLaPrimera(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rastro-migraciones-"));
  temporales.push(dir);
  const journal = JSON.parse(fs.readFileSync(path.join(CARPETA, "meta", "_journal.json"), "utf8"));
  journal.entries = journal.entries.slice(0, 1);
  fs.mkdirSync(path.join(dir, "meta"));
  fs.writeFileSync(path.join(dir, "meta", "_journal.json"), JSON.stringify(journal));
  fs.copyFileSync(path.join(CARPETA, `${journal.entries[0].tag}.sql`), path.join(dir, `${journal.entries[0].tag}.sql`));
  return dir;
}

describe("migrarPendientes", () => {
  it("aplica todas las migraciones a una base nueva sin respaldar", async () => {
    const db = conectar(":memory:");
    const respaldar = vi.fn(async () => "respaldo.db");

    const aplicadas = await migrarPendientes(db, CARPETA, respaldar);

    expect(aplicadas).toBe(TOTAL);
    expect(respaldar).not.toHaveBeenCalled();
    expect(db.select().from(activos).all()).toEqual([]);
  });

  it("no hace nada si la base está al día", async () => {
    const db = conectar(":memory:");
    await migrarPendientes(db, CARPETA, async () => "x");
    const respaldar = vi.fn(async () => "respaldo.db");

    const aplicadas = await migrarPendientes(db, CARPETA, respaldar);

    expect(aplicadas).toBe(0);
    expect(respaldar).not.toHaveBeenCalled();
  });

  it("respalda una base existente antes de aplicar las pendientes", async () => {
    const db = conectar(":memory:");
    await migrarPendientes(db, carpetaConSoloLaPrimera(), async () => "x");
    db.insert(activos).values({ codigo: "PC-001", tipo: "pc_mesa" }).run();
    const orden: string[] = [];
    const respaldar = vi.fn(async () => {
      orden.push(`respaldo con ${db.select().from(activos).all().length} activos`);
      return "respaldo.db";
    });

    const aplicadas = await migrarPendientes(db, CARPETA, respaldar);

    expect(aplicadas).toBe(TOTAL - 1);
    expect(orden).toEqual(["respaldo con 1 activos"]);
    expect(db.select().from(activos).all()).toHaveLength(1);
  });
});
