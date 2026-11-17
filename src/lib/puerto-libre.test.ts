import net from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { buscarPuertoLibre, ocupadoEnEsteEquipo } from "./puerto-libre";

const servidores: net.Server[] = [];

afterEach(async () => {
  await Promise.all(servidores.splice(0).map((s) => new Promise((r) => s.close(r))));
});

function escucharEnPuertoAlAzar(): Promise<number> {
  return new Promise((resolve) => {
    const servidor = net.createServer().listen(0, "0.0.0.0", () => {
      servidores.push(servidor);
      resolve((servidor.address() as net.AddressInfo).port);
    });
  });
}

describe("buscarPuertoLibre", () => {
  it("devuelve el puerto inicial si está libre", async () => {
    expect(await buscarPuertoLibre(3000, async () => false)).toBe(3000);
  });

  it("salta los puertos ocupados y devuelve el siguiente libre", async () => {
    const ocupados = new Set([3000, 3001]);
    expect(await buscarPuertoLibre(3000, async (p) => ocupados.has(p))).toBe(3002);
  });

  it("falla si no encuentra un puerto libre en los intentos permitidos", async () => {
    await expect(buscarPuertoLibre(3000, async () => true, 3)).rejects.toThrow(
      "No hay puertos libres entre 3000 y 3002.",
    );
  });
});

describe("ocupadoEnEsteEquipo", () => {
  it("detecta un puerto en uso y uno libre", async () => {
    const puerto = await escucharEnPuertoAlAzar();
    expect(await ocupadoEnEsteEquipo(puerto)).toBe(true);

    servidores.splice(0).forEach((s) => s.close());
    await new Promise((r) => setTimeout(r, 50));
    expect(await ocupadoEnEsteEquipo(puerto)).toBe(false);
  });
});
