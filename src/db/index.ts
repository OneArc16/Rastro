import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { RUTA_DB } from "./rutas";
import * as schema from "./schema";

export { RUTA_DB };

/**
 * Abre una conexión con la configuración obligatoria del proyecto.
 * Acepta ":memory:" para las pruebas.
 */
export function conectar(ruta: string) {
  if (ruta !== ":memory:") {
    fs.mkdirSync(path.dirname(ruta), { recursive: true });
  }
  const sqlite = new Database(ruta);
  // Requisitos del proyecto: claves foráneas activas y modo WAL en cada conexión
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export type Db = ReturnType<typeof conectar>;

// En desarrollo, Next recarga los módulos en caliente; se guarda la conexión
// en globalThis para no abrir un archivo nuevo en cada recarga.
const globalDb = globalThis as typeof globalThis & { __rastroDb?: Db };

export const db: Db = globalDb.__rastroDb ?? conectar(RUTA_DB);

if (process.env.NODE_ENV !== "production") {
  globalDb.__rastroDb = db;
}
