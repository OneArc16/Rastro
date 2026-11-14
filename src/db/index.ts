import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export const RUTA_DB = path.join(process.cwd(), "data", "rastro.db");

function crearConexion() {
  fs.mkdirSync(path.dirname(RUTA_DB), { recursive: true });
  const sqlite = new Database(RUTA_DB);
  // Requisitos del proyecto: claves foráneas activas y modo WAL en cada conexión
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

type ConexionDb = ReturnType<typeof crearConexion>;

// En desarrollo, Next recarga los módulos en caliente; se guarda la conexión
// en globalThis para no abrir un archivo nuevo en cada recarga.
const globalDb = globalThis as typeof globalThis & { __rastroDb?: ConexionDb };

export const db: ConexionDb = globalDb.__rastroDb ?? crearConexion();

if (process.env.NODE_ENV !== "production") {
  globalDb.__rastroDb = db;
}
