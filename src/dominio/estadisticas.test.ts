import { describe, expect, it } from "vitest";
import {
  anioPorDefecto,
  aniosConDatos,
  estadoActual,
  porSede,
  sedeDe,
  resumenDelAnio,
  type FilaEstadistica,
} from "./estadisticas";
import type { MantenimientoConActivo } from "./mantenimientos";

const fila = (
  fecha: string,
  tipo: FilaEstadistica["tipo"],
  activoId = 1,
  ubicacion: string | null = "SEDE A",
): FilaEstadistica => ({ fecha, tipo, activoId, ubicacion });

describe("años", () => {
  const filas = [fila("2025-03-01", "preventivo"), fila("2026-01-10", "correctivo"), fila("2026-05-02", "preventivo")];

  it("lista los años con datos, del más reciente al más antiguo", () => {
    expect(aniosConDatos(filas)).toEqual([2026, 2025]);
  });

  it("usa el año actual si tiene datos y si no el más reciente con datos", () => {
    expect(anioPorDefecto([2026, 2025], "2026-11-17")).toBe(2026);
    expect(anioPorDefecto([2025, 2024], "2026-11-17")).toBe(2025);
    expect(anioPorDefecto([], "2026-11-17")).toBe(2026);
  });
});

describe("resumenDelAnio", () => {
  it("cuenta totales, tipos, equipos distintos y los 12 meses del año pedido", () => {
    const resumen = resumenDelAnio(
      [
        fila("2026-01-05", "preventivo", 1),
        fila("2026-01-20", "correctivo", 2),
        fila("2026-03-09", "preventivo", 1),
        fila("2026-12-31", "correctivo", 3),
        fila("2025-01-05", "preventivo", 9), // otro año: no cuenta
      ],
      2026,
    );

    expect(resumen).toMatchObject({ total: 4, preventivos: 2, correctivos: 2, equipos: 3 });
    expect(resumen.porMes).toHaveLength(12);
    expect(resumen.porMes[0]).toEqual({ mes: 1, preventivos: 1, correctivos: 1 });
    expect(resumen.porMes[1]).toEqual({ mes: 2, preventivos: 0, correctivos: 0 });
    expect(resumen.porMes[2]).toEqual({ mes: 3, preventivos: 1, correctivos: 0 });
    expect(resumen.porMes[11]).toEqual({ mes: 12, preventivos: 0, correctivos: 1 });
  });

  it("devuelve ceros en un año sin mantenimientos", () => {
    const resumen = resumenDelAnio([fila("2025-01-05", "preventivo")], 2026);
    expect(resumen).toMatchObject({ total: 0, preventivos: 0, correctivos: 0, equipos: 0 });
    expect(resumen.porMes.every((m) => m.preventivos === 0 && m.correctivos === 0)).toBe(true);
  });
});

describe("sedeDe", () => {
  it("toma la parte del nombre antes del primer « - »", () => {
    expect(sedeDe("DISPENSARIO SANTA MARTA - BODEGA")).toBe("DISPENSARIO SANTA MARTA");
    expect(sedeDe("IPS - LINEA DE FRENTE 2DO PISO")).toBe("IPS");
    expect(sedeDe("BODEGA CENTRAL")).toBe("BODEGA CENTRAL");
    expect(sedeDe(null)).toBe("Sin ubicación");
  });
});

describe("porSede", () => {
  it("ordena de mayor a menor, agrupa el resto en «Otras» y nombra los que no tienen ubicación", () => {
    const filas = [
      fila("2026-01-01", "preventivo", 1, "A"),
      fila("2026-02-01", "preventivo", 2, "A"),
      fila("2026-02-01", "correctivo", 3, "B"),
      fila("2026-03-01", "preventivo", 4, "C"),
      fila("2026-03-01", "preventivo", 5, null),
      fila("2025-03-01", "preventivo", 6, "Z"), // otro año
    ];

    expect(porSede(filas, 2026, 2)).toEqual([
      { sede: "A", total: 2 },
      { sede: "B", total: 1 },
      { sede: "Otras", total: 2 },
    ]);
    expect(porSede(filas, 2026)).toContainEqual({ sede: "Sin ubicación", total: 1 });
  });

  it("suma las áreas de una misma sede", () => {
    const filas = [
      fila("2026-01-01", "preventivo", 1, "DISPENSARIO SANTA MARTA - BODEGA"),
      fila("2026-02-01", "preventivo", 2, "DISPENSARIO SANTA MARTA - AUDITORIA"),
      fila("2026-02-01", "correctivo", 3, "IPS - CALL CENTER"),
    ];
    expect(porSede(filas, 2026)).toEqual([
      { sede: "DISPENSARIO SANTA MARTA", total: 2 },
      { sede: "IPS", total: 1 },
    ]);
  });
});

describe("estadoActual", () => {
  const m = (
    id: number,
    activoId: number,
    fecha: string,
    proximaFecha: string | null,
    estadoActivo: MantenimientoConActivo["estadoActivo"] = "operativo",
  ): MantenimientoConActivo => ({
    id,
    activoId,
    codigo: `PC-${activoId}`,
    estadoActivo,
    fecha,
    proximaFecha,
    tipo: "preventivo",
  });

  it("clasifica cada equipo por la próxima fecha de su mantenimiento más reciente", () => {
    const estado = estadoActual(
      [
        m(1, 1, "2026-01-01", "2026-06-01"), // vencido
        m(2, 2, "2026-05-01", "2026-12-01"), // próximo (dentro de 30 días)
        m(3, 3, "2026-06-01", "2027-06-01"), // al día
        m(4, 4, "2025-01-01", "2025-06-01"), // vencido antes, pero
        m(5, 4, "2026-10-01", "2027-04-01"), // su mantenimiento más reciente lo deja al día
        m(6, 5, "2026-01-01", "2026-02-01", "dado_de_baja"), // dado de baja: no cuenta
        m(7, 6, "2026-01-01", null), // sin próxima fecha: no cuenta
      ],
      "2026-11-17",
    );
    expect(estado).toEqual({ vencidos: 1, proximos: 1, alDia: 2 });
  });
});
