import { describe, expect, it } from "vitest";
import type { FichaExcel } from "./lectura";
import { codigosRepetidos, construirPlan, type FilaResumenDispensario } from "./plan";

const HOY = "2026-11-14";

function ficha(hoja: string, cambios: Partial<FichaExcel> = {}): FichaExcel {
  return {
    hoja,
    responsable: "ANA PEREZ",
    telefono: null,
    valor: null,
    fechaCompra: null,
    garantia: null,
    ubicacion: "CONTABILIDAD",
    tipoComputador: "PC DE MESA",
    fechaActualizacion: "2025-07-09",
    bateria: null,
    equipo: {
      marca: "DELL", serial: `SER-${hoja}`, color: null, modelo: null, unidadDisco: null,
      puertosUsb: null, capacidad: null, ram: null, tipoRam: null, procesador: null,
      velocidad: null, tarjetaGrafica: false, graficaModelo: null, graficaCapacidad: null,
      wifi: false, tarjetaWifi: null, puertoRed: null, tarjetaSonido: false,
      sonidoModelo: null, board: null, sistemaOperativo: null, ofimatica: null, antivirus: null,
    },
    perifericos: [],
    monitor: null,
    impresora: null,
    observaciones: [],
    novedades: [],
    avisos: [],
    ...cambios,
  };
}

const pc = (plan: ReturnType<typeof construirPlan>, hoja: string) =>
  plan.activos.find((a) => a.hoja === hoja && (a.tipo === "pc_mesa" || a.tipo === "portatil" || a.tipo === "todo_en_uno"));

describe("construirPlan — códigos", () => {
  it("usa el nombre de la hoja: IPS → PC-0NN y dispensarios → PC-1NN", () => {
    const plan = construirPlan([ficha("2"), ficha("10"), ficha("03 DISP")], [], HOY);
    expect(plan.activos.map((a) => a.codigo)).toEqual(["PC-002", "PC-010", "PC-103"]);
  });

  it("una hoja fuera de la numeración recibe el siguiente número libre y queda sin asignar, con aviso", () => {
    const plan = construirPlan([ficha("14"), ficha("42"), ficha("14 (2)")], [], HOY);
    const extra = pc(plan, "14 (2)");
    expect(extra?.codigo).toBe("PC-043");
    expect(extra?.destino).toBeNull();
    expect(plan.avisos).toContainEqual({
      hoja: "14 (2)",
      mensaje: 'La hoja "14 (2)" no sigue la numeración: se importa como PC-043 sin asignar. Revisá a quién pertenece.',
    });
  });

  it("ordena IPS y dispensarios por número, sin importar el orden de las hojas", () => {
    const plan = construirPlan([ficha("02 DISP"), ficha("10"), ficha("2")], [], HOY);
    expect(plan.activos.map((a) => a.codigo)).toEqual(["PC-002", "PC-010", "PC-102"]);
  });
});

describe("codigosRepetidos", () => {
  it("detecta dos hojas que dan el mismo código", () => {
    const plan = construirPlan([ficha("2"), ficha("02"), ficha("3")], [], HOY);
    expect(codigosRepetidos(plan)).toEqual(["PC-002"]);
  });

  it("no informa nada cuando todos los códigos son distintos", () => {
    expect(codigosRepetidos(construirPlan([ficha("2"), ficha("3")], [], HOY))).toEqual([]);
  });
});

describe("construirPlan — sedes, ubicaciones y responsables", () => {
  it("una persona queda como funcionario con su ubicación en la sede IPS", () => {
    const plan = construirPlan([ficha("6", { responsable: "YEISON RUIZ", ubicacion: "Contabilidad" })], [], HOY);
    expect(plan.funcionarios).toEqual([
      { clave: "YEISON RUIZ", nombre: "YEISON RUIZ", ubicacion: "IPS - CONTABILIDAD" },
    ]);
    expect(pc(plan, "6")?.destino).toEqual({ tipo: "funcionario", clave: "YEISON RUIZ" });
    expect(plan.ubicaciones).toEqual(["IPS - CONTABILIDAD"]);
  });

  it("un mismo nombre en varias hojas es un solo funcionario", () => {
    const plan = construirPlan(
      [ficha("1", { responsable: "Diana Solano" }), ficha("2", { responsable: "DIANA  SOLANO" })],
      [],
      HOY,
    );
    expect(plan.funcionarios).toHaveLength(1);
    expect(pc(plan, "2")?.destino).toEqual({ tipo: "funcionario", clave: "DIANA SOLANO" });
  });

  it("los responsables genéricos asignan el equipo a la ubicación", () => {
    const plan = construirPlan(
      [
        ficha("15", { responsable: "MEDICO DE TURNO", ubicacion: "CONSULTORIO 9" }),
        ficha("22", { responsable: "CONSULTORIO 11", ubicacion: "CONSULTORIO 11" }),
        ficha("19", { responsable: "CONSULTORIO PURPURA", ubicacion: null }),
        ficha("07 DISP", { responsable: "AUXILIAR DE TURNO", ubicacion: "ORIHUECA" }),
        ficha("26 DISP", { responsable: null, ubicacion: "PIJIÑO" }),
      ],
      [],
      HOY,
    );
    expect(plan.funcionarios).toEqual([]);
    expect(plan.activos.map((a) => a.destino)).toEqual([
      { tipo: "ubicacion", nombre: "IPS - CONSULTORIO 9" },
      { tipo: "ubicacion", nombre: "IPS - CONSULTORIO PURPURA" },
      { tipo: "ubicacion", nombre: "IPS - CONSULTORIO 11" },
      { tipo: "ubicacion", nombre: "DISPENSARIO ORIHUECA" },
      { tipo: "ubicacion", nombre: "DISPENSARIO PIJIÑO" },
    ]);
  });

  it("en un dispensario, el responsable que es el municipio también va a la ubicación", () => {
    const resumen: FilaResumenDispensario[] = [{ numero: 2, municipio: "EL DIFICIL", area: "LINEA DE FRENTE" }];
    const plan = construirPlan(
      [ficha("02 DISP", { responsable: "EL DIFICIL (ARIGUANI)", ubicacion: "DISPENSARIO EL DIFICIL (ARIGUANI)" })],
      resumen,
      HOY,
    );
    expect(plan.funcionarios).toEqual([]);
    expect(pc(plan, "02 DISP")?.destino).toEqual({
      tipo: "ubicacion",
      nombre: "DISPENSARIO EL DIFICIL - LINEA DE FRENTE",
    });
  });

  it("nombra las ubicaciones de dispensario con municipio y área del resumen, y avisa si la hoja contradice", () => {
    const resumen: FilaResumenDispensario[] = [
      { numero: 3, municipio: "SANTA MARTA", area: "BODEGA" },
      { numero: 24, municipio: "CONCORDIA", area: "LINEA DE FRENTE" },
    ];
    const plan = construirPlan(
      [
        ficha("03 DISP", { responsable: "DARLEY MENDOZA", ubicacion: "BODEGA" }),
        ficha("24 DISP", { responsable: "ALEXANDER VILLA", ubicacion: "SANTA MARTA" }),
        ficha("05 DISP", { responsable: "JORGE ACOSTA", ubicacion: "SITIONUEVO" }),
        ficha("01 DISP", { responsable: "GUACAMAYAL", ubicacion: "DISPENSARIO GUACAMAYAL" }),
      ],
      resumen,
      HOY,
    );
    expect(plan.ubicaciones).toEqual([
      "DISPENSARIO GUACAMAYAL",
      "DISPENSARIO SANTA MARTA - BODEGA",
      "DISPENSARIO SITIONUEVO",
      "DISPENSARIO CONCORDIA - LINEA DE FRENTE",
    ]);
    expect(plan.avisos).toContainEqual({
      hoja: "24 DISP",
      mensaje: 'La hoja dice ubicación "SANTA MARTA" y el resumen dice CONCORDIA - LINEA DE FRENTE; se usa el resumen.',
    });
    expect(plan.avisos.filter((a) => a.hoja === "03 DISP")).toEqual([]);
  });

  it("si un responsable genérico no tiene ubicación, el equipo queda sin asignar con aviso", () => {
    const plan = construirPlan([ficha("9", { responsable: "MEDICO DE TURNO", ubicacion: null })], [], HOY);
    expect(pc(plan, "9")?.destino).toBeNull();
    expect(plan.avisos).toContainEqual({
      hoja: "9",
      mensaje: 'El responsable "MEDICO DE TURNO" no es una persona y la hoja no tiene ubicación: el equipo queda sin asignar.',
    });
  });

  it("avisa las ubicaciones que parecen la misma escrita distinto, sin unirlas", () => {
    const plan = construirPlan(
      [
        ficha("14", { ubicacion: "LINEA DE FRENTE 2do PISO" }),
        ficha("42", { responsable: "KELLY TAMARA", ubicacion: "LINEA DE FRENTE 2D0 PISO" }),
      ],
      [],
      HOY,
    );
    expect(plan.ubicaciones).toHaveLength(2);
    expect(plan.avisos).toContainEqual({
      hoja: null,
      mensaje: 'Ubicaciones que parecen la misma: "IPS - LINEA DE FRENTE 2DO PISO", "IPS - LINEA DE FRENTE 2D0 PISO". Unilas a mano si corresponde.',
    });
  });
});

describe("construirPlan — activos de cada hoja", () => {
  it("convierte el PC con sus especificaciones, observaciones y fechas", () => {
    const plan = construirPlan(
      [
        ficha("1", {
          tipoComputador: "PORTATIL",
          valor: 3570000,
          fechaCompra: "2021-03-16",
          bateria: { serial: "BAT-1", estado: null },
          observaciones: ["ANTERIOR PC DE MICHAEL", "SE CAMBIO EL MONITOR"],
          equipo: {
            ...ficha("1").equipo,
            ram: "20 GB",
            tarjetaGrafica: true,
            graficaModelo: null,
            wifi: true,
            tarjetaWifi: null,
            puertoRed: false,
            tarjetaSonido: true,
            sonidoModelo: "REALTEK",
          },
        }),
      ],
      [],
      HOY,
    );
    expect(pc(plan, "1")).toMatchObject({
      codigo: "PC-001",
      tipo: "portatil",
      marca: "DELL",
      serial: "SER-1",
      valor: 3570000,
      fechaCompra: "2021-03-16",
      observaciones: "ANTERIOR PC DE MICHAEL\nSE CAMBIO EL MONITOR",
      specs: {
        ram: "20 GB",
        tarjetaGrafica: { modelo: "SI" },
        tarjetaWifi: "SI",
        puertoRed: false,
        tarjetaSonido: "REALTEK",
        bateria: { serial: "BAT-1" },
      },
    });
  });

  it("crea monitor, periféricos e impresora con códigos consecutivos y el mismo destino que el PC", () => {
    const conEquipos = (hoja: string, responsable: string) =>
      ficha(hoja, {
        responsable,
        monitor: { marca: "LG", modelo: "20MK400H", tamano: '20"', color: null, tipo: "LED", serial: null },
        perifericos: [{ tipo: "teclado", marca: "DELL", modelo: null, serial: null }],
        impresora: { marca: "EPSON", modelo: "L3210", serial: null, cableConexion: true, cableEnergia: false },
      });
    const plan = construirPlan([conEquipos("1", "ANA"), conEquipos("2", "LUIS")], [], HOY);

    expect(plan.activos.map((a) => `${a.codigo}:${a.destino && "clave" in a.destino ? a.destino.clave : ""}`)).toEqual([
      "PC-001:ANA", "MON-0001:ANA", "TEC-0001:ANA", "IMP-0001:ANA",
      "PC-002:LUIS", "MON-0002:LUIS", "TEC-0002:LUIS", "IMP-0002:LUIS",
    ]);
    const monitor = plan.activos.find((a) => a.codigo === "MON-0001");
    expect(monitor?.specs).toEqual({ tamano: '20"', tipo: "LED" });
    expect(plan.activos.find((a) => a.codigo === "IMP-0001")?.specs).toEqual({
      cableConexion: true,
      cableEnergia: false,
    });
  });

  it("la asignación empieza en la fecha de actualización, o en la de compra, o hoy", () => {
    const plan = construirPlan(
      [
        ficha("1", { fechaActualizacion: "2025-07-08", fechaCompra: "2021-03-16" }),
        ficha("2", { fechaActualizacion: null, fechaCompra: "2021-03-16" }),
        ficha("3", { fechaActualizacion: null, fechaCompra: null }),
      ],
      [],
      HOY,
    );
    expect(plan.activos.map((a) => a.fechaDesde)).toEqual(["2025-07-08", "2021-03-16", HOY]);
  });

  it("asocia los mantenimientos al PC de la hoja", () => {
    const plan = construirPlan(
      [ficha("4", { novedades: [{ fecha: "2026-04-09", proximaFecha: "2026-10-09", tipo: "preventivo", observacion: "LIMPIEZA" }] })],
      [],
      HOY,
    );
    expect(plan.mantenimientos).toEqual([
      { codigoActivo: "PC-004", fecha: "2026-04-09", proximaFecha: "2026-10-09", tipo: "preventivo", observacion: "LIMPIEZA" },
    ]);
  });

  it("conserva los avisos de lectura y avisa los seriales repetidos y los tipos desconocidos", () => {
    const plan = construirPlan(
      [
        ficha("04 DISP", { avisos: ["Mantenimiento sin fecha: no se importa."], equipo: { ...ficha("x").equipo, serial: "38P0D42" } }),
        ficha("05 DISP", { tipoComputador: "SERVIDOR", equipo: { ...ficha("x").equipo, serial: "38P0D42" } }),
      ],
      [],
      HOY,
    );
    expect(plan.avisos).toEqual(
      expect.arrayContaining([
        { hoja: "04 DISP", mensaje: "Mantenimiento sin fecha: no se importa." },
        { hoja: "05 DISP", mensaje: 'Tipo de computador "SERVIDOR" desconocido: se importa como PC de mesa.' },
        { hoja: null, mensaje: 'El serial "38P0D42" se repite en PC-104, PC-105. Revisá cuál es el correcto.' },
      ]),
    );
  });
});
