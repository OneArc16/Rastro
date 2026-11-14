/**
 * Copia de respaldo de la base de datos.
 * Usa la API de backup de SQLite (segura con modo WAL) y guarda el archivo
 * en data/respaldos/ con la fecha y hora en el nombre.
 *
 * Uso: pnpm db:respaldo
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const RUTA_DB = path.join(process.cwd(), "data", "rastro.db");
const DIR_RESPALDOS = path.join(process.cwd(), "data", "respaldos");

async function main() {
  if (!fs.existsSync(RUTA_DB)) {
    console.error(`No existe la base de datos en ${RUTA_DB}`);
    process.exit(1);
  }

  fs.mkdirSync(DIR_RESPALDOS, { recursive: true });

  const ahora = new Date();
  const fecha = [
    ahora.getFullYear(),
    String(ahora.getMonth() + 1).padStart(2, "0"),
    String(ahora.getDate()).padStart(2, "0"),
  ].join("-");
  const hora = [
    String(ahora.getHours()).padStart(2, "0"),
    String(ahora.getMinutes()).padStart(2, "0"),
    String(ahora.getSeconds()).padStart(2, "0"),
  ].join("");

  const destino = path.join(DIR_RESPALDOS, `rastro-${fecha}_${hora}.db`);

  const sqlite = new Database(RUTA_DB, { readonly: true });
  try {
    await sqlite.backup(destino);
    console.log(`Respaldo creado: ${destino}`);
  } finally {
    sqlite.close();
  }
}

main();
