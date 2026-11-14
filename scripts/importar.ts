/**
 * Importación del Excel actual de hojas de vida (fase 6).
 *
 * Uso:
 *   pnpm importar "docs/HOJAS DE VIDA DE PC.xlsx"                          vista previa, no escribe
 *   pnpm importar "docs/HOJAS DE VIDA DE PC.xlsx" --confirmar              importa en una base sin activos
 *   pnpm importar "docs/HOJAS DE VIDA DE PC.xlsx" --confirmar --reemplazar borra los activos actuales e importa
 *
 * Antes de escribir siempre se crea un respaldo en data/respaldos/.
 */
import fs from "node:fs";
import { count } from "drizzle-orm";
import { db } from "../src/db";
import { crearRespaldo } from "../src/db/respaldo";
import { activos } from "../src/db/schema";
import { ErrorDeNegocio } from "../src/dominio/comunes";
import { aplicarPlan } from "../src/importacion/aplicar";
import { leerLibro } from "../src/importacion/excel";
import { formatearInforme } from "../src/importacion/informe";
import { leerHoja } from "../src/importacion/lectura";
import { construirPlan } from "../src/importacion/plan";
import { hoyIso } from "../src/lib/fechas";

const USO = 'Uso: pnpm importar "<archivo.xlsx>" [--confirmar] [--reemplazar]';

function salir(mensaje: string): never {
  console.error(mensaje);
  process.exit(1);
}

async function main() {
  const argumentos = process.argv.slice(2);
  const banderas = new Set(argumentos.filter((a) => a.startsWith("--")));
  const archivos = argumentos.filter((a) => !a.startsWith("--"));

  const desconocidas = [...banderas].filter((b) => b !== "--confirmar" && b !== "--reemplazar");
  if (desconocidas.length > 0) salir(`Opción desconocida: ${desconocidas.join(", ")}\n${USO}`);
  if (archivos.length !== 1) salir(USO);

  const archivo = archivos[0];
  if (!fs.existsSync(archivo)) salir(`No existe el archivo: ${archivo}`);

  const confirmar = banderas.has("--confirmar");
  const reemplazar = banderas.has("--reemplazar");

  const { hojas, resumenDispensario } = await leerLibro(archivo);
  if (hojas.length === 0) salir("El archivo no tiene hojas con el formato de hoja de vida.");

  const plan = construirPlan(hojas.map(leerHoja), resumenDispensario, hoyIso());
  const activosActuales = db.select({ total: count() }).from(activos).get()?.total ?? 0;

  console.log(`Hojas de PC leídas: ${hojas.length}\n`);
  console.log(formatearInforme(plan, activosActuales));

  if (!confirmar) {
    console.log(
      `\nNo se escribió nada. Para importar, agregá --confirmar${activosActuales > 0 ? " --reemplazar" : ""}.`,
    );
    return;
  }

  if (activosActuales > 0 && !reemplazar) {
    salir(`\nLa base ya tiene ${activosActuales} activos. Agregá --reemplazar para borrarlos e importar.`);
  }

  const respaldo = await crearRespaldo();
  console.log(`\nRespaldo creado: ${respaldo}`);

  try {
    const r = aplicarPlan(db, plan, { reemplazar });
    console.log(
      `Importación terminada: ${r.activos} activos, ${r.funcionarios} funcionarios, ` +
        `${r.ubicaciones} ubicaciones, ${r.asignaciones} asignaciones, ${r.mantenimientos} mantenimientos.` +
        (r.borrados > 0 ? ` Se reemplazaron ${r.borrados} activos anteriores.` : ""),
    );
  } catch (error) {
    if (error instanceof ErrorDeNegocio) salir(error.message);
    throw error;
  }
}

main();
