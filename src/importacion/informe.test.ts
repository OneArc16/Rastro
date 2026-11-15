import { describe, expect, it } from "vitest";
import { formatearInforme } from "./informe";
import type { PlanImportacion } from "./plan";

const PLAN: PlanImportacion = {
  ubicaciones: ["IPS - CONTABILIDAD", "DISPENSARIO REMOLINO - LINEA DE FRENTE"],
  funcionarios: [{ clave: "ANA", nombre: "ANA", ubicacion: "IPS - CONTABILIDAD" }],
  activos: [
    { hoja: "1", codigo: "PC-001", tipo: "pc_mesa", marca: null, modelo: null, serial: null, color: null, valor: null, fechaCompra: null, garantiaHasta: null, specs: null, observaciones: null, destino: { tipo: "funcionario", clave: "ANA" }, fechaDesde: "2025-07-09" },
    { hoja: "1", codigo: "MON-0001", tipo: "monitor", marca: null, modelo: null, serial: null, color: null, valor: null, fechaCompra: null, garantiaHasta: null, specs: null, observaciones: null, destino: null, fechaDesde: "2025-07-09" },
  ],
  mantenimientos: [],
  avisos: [
    { hoja: "18", mensaje: 'La celda PC dice "17" pero la hoja se llama "18"; se usa el nombre de la hoja.' },
    { hoja: null, mensaje: 'El serial "38P0D42" se repite en PC-104, PC-105. Revisá cuál es el correcto.' },
  ],
};

describe("formatearInforme", () => {
  it("resume lo que se va a crear, por tipo, y lista los avisos con su hoja", () => {
    const informe = formatearInforme(PLAN, 0);
    expect(informe).toContain("Ubicaciones: 2");
    expect(informe).toContain("Funcionarios: 1");
    expect(informe).toContain("Activos: 2 (Monitor: 1, PC de mesa: 1)");
    expect(informe).toContain("Asignados: 1 · sin asignar: 1");
    expect(informe).toContain("Avisos (2):");
    expect(informe).toContain('[hoja 18] La celda PC dice "17"');
    expect(informe).toContain('[general] El serial "38P0D42"');
  });

  it("advierte cuántos activos actuales se borrarían", () => {
    expect(formatearInforme(PLAN, 7)).toContain(
      "La base tiene 7 activos: importar con --reemplazar los borra (se conserva la configuración).",
    );
    expect(formatearInforme(PLAN, 0)).not.toContain("--reemplazar");
  });

  it("muestra como error los códigos repetidos, que impiden importar", () => {
    const repetido = { ...PLAN, activos: [...PLAN.activos, { ...PLAN.activos[0], hoja: "02" }] };
    expect(formatearInforme(repetido, 0)).toContain(
      "ERROR: hay códigos repetidos en el Excel (PC-001). No se puede importar hasta corregir las hojas.",
    );
    expect(formatearInforme(PLAN, 0)).not.toContain("ERROR");
  });
});
