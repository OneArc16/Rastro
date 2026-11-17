import fs from "node:fs";
import net from "node:net";

/**
 * Busca el primer puerto libre desde `desde`, probando `intentos` puertos seguidos.
 */
export async function buscarPuertoLibre(
  desde: number,
  estaOcupado: (puerto: number) => Promise<boolean>,
  intentos = 20,
): Promise<number> {
  for (let puerto = desde; puerto < desde + intentos; puerto++) {
    if (!(await estaOcupado(puerto))) return puerto;
  }
  throw new Error(`No hay puertos libres entre ${desde} y ${desde + intentos - 1}.`);
}

/** Indica si el puerto ya está tomado en este equipo (no se puede escuchar en él). */
export function ocupadoEnEsteEquipo(puerto: number): Promise<boolean> {
  return new Promise((resolve) => {
    const servidor = net.createServer();
    servidor.once("error", () => resolve(true));
    servidor.listen(puerto, "0.0.0.0", () => servidor.close(() => resolve(false)));
  });
}

/** Indica si algo responde en host:puerto. Un rechazo o un tiempo de espera cuentan como libre. */
export function respondeEn(host: string, puerto: number, esperaMs = 500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port: puerto });
    const terminar = (ocupado: boolean) => {
      socket.destroy();
      resolve(ocupado);
    };
    socket.setTimeout(esperaMs, () => terminar(false));
    socket.once("connect", () => terminar(true));
    socket.once("error", () => terminar(false));
  });
}

/**
 * En WSL2 (red NAT), dirección de Windows vista desde Linux: la puerta de enlace
 * por defecto. Docker Desktop publica sus puertos ahí, invisibles para un bind
 * dentro de WSL. Devuelve null fuera de WSL.
 */
export function hostWindowsDesdeWsl(): string | null {
  try {
    if (!/microsoft/i.test(fs.readFileSync("/proc/version", "utf8"))) return null;
    const linea = fs
      .readFileSync("/proc/net/route", "utf8")
      .split("\n")
      .slice(1)
      .map((l) => l.trim().split(/\s+/))
      .find((c) => c[1] === "00000000");
    if (!linea) return null;
    // La puerta de enlace viene en hexadecimal little-endian.
    const hex = linea[2];
    return [6, 4, 2, 0].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(".");
  } catch {
    return null;
  }
}
