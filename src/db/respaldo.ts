import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { fechaIsoLocal } from "@/lib/fechas";
import { DIR_RESPALDOS, RUTA_DB } from "./rutas";

/**
 * Copia de la base con la API de backup de SQLite (segura con modo WAL).
 * Devuelve la ruta del archivo creado, con la fecha y hora en el nombre.
 */
export async function crearRespaldo(
  rutaDb: string = RUTA_DB,
  directorio: string = DIR_RESPALDOS,
  ahora: Date = new Date(),
): Promise<string> {
  if (!fs.existsSync(rutaDb)) {
    throw new Error(`No existe la base de datos en ${rutaDb}`);
  }
  fs.mkdirSync(directorio, { recursive: true });

  const hora = [ahora.getHours(), ahora.getMinutes(), ahora.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join("");
  const destino = path.join(directorio, `rastro-${fechaIsoLocal(ahora)}_${hora}.db`);

  const sqlite = new Database(rutaDb, { readonly: true });
  try {
    await sqlite.backup(destino);
  } finally {
    sqlite.close();
  }
  return destino;
}
