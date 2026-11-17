/**
 * Se ejecuta una vez al iniciar el servidor de Next.js.
 * En la imagen de Docker (RASTRO_MIGRAR_AL_INICIAR=1) pone al día el esquema
 * de la base antes de la primera petición, para que un volumen nuevo o una
 * versión nueva de la imagen funcionen sin correr drizzle-kit a mano.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.RASTRO_MIGRAR_AL_INICIAR !== "1") return;

  const { db } = await import("./db");
  const { CARPETA_MIGRACIONES, migrarPendientes } = await import("./db/migrar");
  const { crearRespaldo } = await import("./db/respaldo");

  const aplicadas = await migrarPendientes(db, CARPETA_MIGRACIONES, () => crearRespaldo());
  if (aplicadas > 0) console.log(`Rastro: se aplicaron ${aplicadas} migraciones.`);
}
