import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { Db } from "./index";

/** Carpeta de migraciones de drizzle-kit, relativa al directorio de trabajo de la app. */
export const CARPETA_MIGRACIONES = path.join(process.cwd(), "drizzle");

function migracionesAplicadas(db: Db): number {
  const tabla = db.get<{ n: number }>(
    sql`select count(*) as n from sqlite_master where type = 'table' and name = '__drizzle_migrations'`,
  );
  if (!tabla || tabla.n === 0) return 0;
  return db.get<{ n: number }>(sql`select count(*) as n from __drizzle_migrations`)?.n ?? 0;
}

/**
 * Aplica las migraciones pendientes y devuelve cuántas había.
 * Si la base ya tenía migraciones aplicadas (tiene datos reales), primero se
 * respalda para poder deshacer una migración fallida.
 */
export async function migrarPendientes(
  db: Db,
  carpeta: string,
  respaldar: () => Promise<string>,
): Promise<number> {
  const journal = JSON.parse(fs.readFileSync(path.join(carpeta, "meta", "_journal.json"), "utf8")) as {
    entries: unknown[];
  };
  const aplicadas = migracionesAplicadas(db);
  const pendientes = journal.entries.length - aplicadas;
  if (pendientes <= 0) return 0;

  if (aplicadas > 0) await respaldar();
  migrate(db, { migrationsFolder: carpeta });
  return pendientes;
}
