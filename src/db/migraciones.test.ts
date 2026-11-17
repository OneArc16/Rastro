import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { conectar } from "@/db";
import { migrarPendientes } from "./migrar";

const CARPETA = path.resolve(__dirname, "../../drizzle");
const temporales: string[] = [];

afterEach(() => {
  for (const dir of temporales.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

/** Copia de la carpeta de migraciones con solo las primeras `cantidad`. */
function carpetaHasta(cantidad: number): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rastro-migraciones-"));
  temporales.push(dir);
  const journal = JSON.parse(fs.readFileSync(path.join(CARPETA, "meta", "_journal.json"), "utf8"));
  journal.entries = journal.entries.slice(0, cantidad);
  fs.mkdirSync(path.join(dir, "meta"));
  fs.writeFileSync(path.join(dir, "meta", "_journal.json"), JSON.stringify(journal));
  for (const { tag } of journal.entries) {
    fs.copyFileSync(path.join(CARPETA, `${tag}.sql`), path.join(dir, `${tag}.sql`));
  }
  return dir;
}

describe("migración a actas_fotos", () => {
  it("mueve la foto del acta y la de sus versiones a la tabla nueva", async () => {
    const db = conectar(":memory:");
    await migrarPendientes(db, carpetaHasta(2), async () => "x");
    const fotoActa = Buffer.from([0xff, 0xd8, 0xff, 1]);
    const fotoVersion = Buffer.from([0x89, 0x50, 0x4e, 0x47, 2]);
    db.run(sql`insert into actas (id, tipo, numero, fecha, datos, foto, foto_tipo)
      values (1, 'baja', 1, '2026-11-01', '{}', ${fotoActa}, 'image/jpeg'),
             (2, 'baja', 2, '2026-11-02', '{}', null, null)`);
    db.run(sql`insert into actas_versiones (id, acta_id, fecha, activo_ids, datos, foto, foto_tipo, reemplazada_en)
      values (7, 1, '2026-10-30', '[]', '{}', ${fotoVersion}, 'image/png', 0),
             (8, 2, '2026-10-30', '[]', '{}', null, null, 0)`);

    await migrarPendientes(db, CARPETA, async () => "respaldo.db");

    const fotos = db.all<{ acta_id: number; version_id: number | null; orden: number; contenido: Buffer; tipo: string }>(
      sql`select acta_id, version_id, orden, contenido, tipo from actas_fotos order by id`,
    );
    expect(fotos).toHaveLength(2);
    expect(fotos[0]).toMatchObject({ acta_id: 1, version_id: null, orden: 1, tipo: "image/jpeg" });
    expect(Buffer.from(fotos[0].contenido).equals(fotoActa)).toBe(true);
    expect(fotos[1]).toMatchObject({ acta_id: 1, version_id: 7, orden: 1, tipo: "image/png" });
    expect(Buffer.from(fotos[1].contenido).equals(fotoVersion)).toBe(true);

    const columnas = db.all<{ name: string }>(sql`select name from pragma_table_info('actas')`).map((c) => c.name);
    expect(columnas).not.toContain("foto");
  });
});
