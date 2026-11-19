/**
 * Inicia `next dev` en el primer puerto libre desde 3000.
 * En WSL también se descartan los puertos ocupados del lado de Windows
 * (por ejemplo, el contenedor de Docker en el 3000).
 *
 * También aplica las migraciones pendientes al arrancar, como el contenedor.
 *
 * Uso: pnpm dev            busca desde 3000
 *      PORT=4000 pnpm dev  usa exactamente ese puerto
 */
import { spawn } from "node:child_process";
import { buscarPuertoLibre, hostWindowsDesdeWsl, ocupadoEnEsteEquipo, respondeEn } from "../src/lib/puerto-libre";

async function main() {
  const fijo = process.env.PORT;
  let puerto: number;

  if (fijo) {
    puerto = Number(fijo);
  } else {
    const windows = hostWindowsDesdeWsl();
    puerto = await buscarPuertoLibre(
      3000,
      async (p) => (await ocupadoEnEsteEquipo(p)) || (windows !== null && (await respondeEn(windows, p))),
    );
    if (puerto !== 3000) console.log(`El puerto 3000 está en uso; se usa el ${puerto}.`);
  }

  const next = spawn("next", ["dev", "-H", "0.0.0.0", "-p", String(puerto)], {
    stdio: "inherit",
    shell: process.platform === "win32",
    // Igual que en Docker: aplica las migraciones pendientes al arrancar
    // (con respaldo previo), para que la base local no quede atrasada.
    env: { ...process.env, RASTRO_MIGRAR_AL_INICIAR: process.env.RASTRO_MIGRAR_AL_INICIAR ?? "1" },
  });
  for (const senal of ["SIGINT", "SIGTERM"] as const) {
    process.on(senal, () => next.kill(senal));
  }
  next.on("exit", (codigo, senal) => process.exit(codigo ?? (senal ? 1 : 0)));
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exit(1);
});
