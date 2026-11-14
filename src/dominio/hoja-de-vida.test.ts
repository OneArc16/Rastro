import { describe, expect, it } from "vitest";
import type { Activo } from "@/db/schema";
import { MOTIVO_CARGA_INICIAL } from "./comunes";
import {
  construirHojaDeVida,
  type ActivoDeHoja,
  type DatosHojaDeVida,
} from "./hoja-de-vida";

function activo(parcial: Partial<Activo> & Pick<Activo, "id" | "codigo" | "tipo">): Activo {
  return {
    marca: null,
    modelo: null,
    serial: null,
    color: null,
    estado: "operativo",
    valor: null,
    fechaCompra: null,
    garantiaHasta: null,
    specs: null,
    observaciones: null,
    creadoEn: new Date(2024, 0, 1),
    actualizadoEn: new Date(2024, 0, 1),
    ...parcial,
  };
}

function deHoja(
  parcial: Partial<Activo> & Pick<Activo, "id" | "codigo" | "tipo">,
  extra: Partial<Omit<ActivoDeHoja, "activo">> = {},
): ActivoDeHoja {
  return {
    activo: activo(parcial),
    fechaDesde: "2024-01-20",
    ultimoMovimiento: "2024-01-20",
    mantenimientos: [],
    ...extra,
  };
}

function datosBase(cambios: Partial<DatosHojaDeVida> = {}): DatosHojaDeVida {
  return {
    funcionario: { nombre: "MARIA LOPEZ", telefono: "3104567890", ubicacion: "CONTABILIDAD" },
    configuracion: {
      id: 1,
      codigoFormato: "FT-GT-01",
      versionFormato: "01",
      fechaEmision: "2024-01-15",
      elaboradoNombre: "DANIEL",
      elaboradoCargo: "Auxiliar de Sistemas",
      revisadoNombre: "JOHN",
      revisadoCargo: "Analista",
      aprobadoNombre: "OSCAR",
      aprobadoCargo: "Coordinador",
    },
    vigentes: [],
    impresorasDeUbicacion: [],
    historial: [],
    ...cambios,
  };
}

const PC_COMPLETO = deHoja(
  {
    id: 1,
    codigo: "PC-014",
    tipo: "pc_mesa",
    marca: "POWERGROUP",
    modelo: "G9340F2",
    serial: "G125162",
    color: "NEGRO",
    valor: 2850000,
    fechaCompra: "2023-03-10",
    garantiaHasta: "2026-03-10",
    observaciones: "Equipo principal",
    actualizadoEn: new Date(2025, 6, 9),
    specs: {
      unidadDisco: "SSD",
      capacidadDisco: "512 GB",
      ram: "16 GB",
      tipoRam: "DDR4",
      procesador: "INTEL CORE I5 12400",
      velocidad: "2.50 GHz",
      puertosUsb: 6,
      puertoRed: true,
      board: "ASUS PRIME H610M-K",
      sistemaOperativo: "WINDOWS 11 PRO",
      ofimatica: "OFFICE - ADOBE",
      antivirus: "DEFENDER",
    },
  },
  { ultimoMovimiento: "2024-01-20" },
);

describe("construirHojaDeVida — encabezado, información general y firmas", () => {
  it("toma el encabezado y las firmas de la configuración", () => {
    const hoja = construirHojaDeVida(datosBase());
    expect(hoja.encabezado).toEqual({
      codigo: "FT-GT-01",
      version: "01",
      fechaEmision: "15/01/2024",
    });
    expect(hoja.firmas.revisado).toEqual({ nombre: "JOHN", cargo: "Analista" });
  });

  it("arma la información general con el número del PC y la fecha de actualización más reciente", () => {
    const hoja = construirHojaDeVida(datosBase({ vigentes: [PC_COMPLETO] }));
    expect(hoja.general).toEqual({
      pc: "14",
      responsable: "MARIA LOPEZ",
      telefono: "3104567890",
      valor: "$ 2.850.000",
      fechaCompra: "10/03/2023",
      garantia: "10/03/2026",
      ubicacion: "CONTABILIDAD",
      tipoComputador: "PC DE MESA",
      fechaActualizacion: "09/07/2025",
    });
  });

  it("la fecha de actualización usa el último movimiento si es posterior a la edición del PC", () => {
    const pc = { ...PC_COMPLETO, ultimoMovimiento: "2025-10-16" };
    const hoja = construirHojaDeVida(datosBase({ vigentes: [pc] }));
    expect(hoja.general.fechaActualizacion).toBe("16/10/2025");
  });

  it("sin PC vigente, los datos del equipo salen como NA", () => {
    const hoja = construirHojaDeVida(datosBase());
    expect(hoja.general.pc).toBe("NA");
    expect(hoja.general.tipoComputador).toBe("NA");
    expect(hoja.equipo.marca).toBe("NA");
    expect(hoja.bateria).toEqual({ aplica: "NA", serial: "NA", estado: "NA" });
  });
});

describe("construirHojaDeVida — información del equipo y batería", () => {
  it("copia las especificaciones del PC y aplica NO/NA como el original", () => {
    const hoja = construirHojaDeVida(datosBase({ vigentes: [PC_COMPLETO] }));
    expect(hoja.equipo).toEqual({
      marca: "POWERGROUP",
      serial: "G125162",
      color: "NEGRO",
      modelo: "G9340F2",
      unidadDisco: "SSD",
      puertosUsb: "6",
      disco: "SSD",
      capacidad: "512 GB",
      ram: "16 GB",
      tipoRam: "DDR4",
      procesador: "INTEL CORE I5 12400",
      velocidad: "2.50 GHz",
      tarjetaGrafica: "NO",
      graficaModelo: "NA",
      graficaCapacidad: "NA",
      wifi: "NO",
      tarjetaWifi: "NO",
      puertoRed: "SI",
      tarjetaSonido: "NO",
      sonidoModelo: "NO",
      board: "ASUS PRIME H610M-K",
      sistemaOperativo: "WINDOWS 11 PRO",
      ofimatica: "OFFICE - ADOBE",
      antivirus: "DEFENDER",
    });
    expect(hoja.bateria).toEqual({ aplica: "NA", serial: "NA", estado: "NA" });
  });

  it("muestra tarjeta gráfica, wifi, sonido y batería cuando existen", () => {
    const portatil = deHoja({
      id: 2,
      codigo: "PC-002",
      tipo: "portatil",
      specs: {
        tarjetaGrafica: { modelo: "RTX 3050", capacidad: "4 GB" },
        tarjetaWifi: "INTEL AX201",
        tarjetaSonido: "REALTEK",
        bateria: { serial: "L21M3PG2" },
      },
    });
    const hoja = construirHojaDeVida(datosBase({ vigentes: [portatil] }));
    expect(hoja.equipo).toMatchObject({
      tarjetaGrafica: "SI",
      graficaModelo: "RTX 3050",
      graficaCapacidad: "4 GB",
      wifi: "SI",
      tarjetaWifi: "INTEL AX201",
      tarjetaSonido: "SI",
      sonidoModelo: "REALTEK",
      marca: "NO",
      puertoRed: "NO",
    });
    expect(hoja.bateria).toEqual({ aplica: "SI", serial: "L21M3PG2", estado: "NO" });
    expect(hoja.general.tipoComputador).toBe("PORTÁTIL");
  });

  it("con varios PC usa el de asignación más reciente y menciona los demás (asunción A2)", () => {
    const viejo = deHoja({ id: 5, codigo: "PC-005", tipo: "pc_mesa" }, { fechaDesde: "2023-01-01" });
    const nuevo = deHoja({ id: 9, codigo: "PC-009", tipo: "portatil" }, { fechaDesde: "2025-01-01" });
    const hoja = construirHojaDeVida(datosBase({ vigentes: [viejo, nuevo] }));
    expect(hoja.general.pc).toBe("9");
    expect(hoja.observaciones).toContain("TAMBIÉN TIENE ASIGNADO PC-005 (PC DE MESA)");
  });
});

describe("construirHojaDeVida — periféricos, monitores e impresora", () => {
  it("lista los cuatro periféricos en orden y pone NO en los ausentes", () => {
    const teclado = deHoja({ id: 3, codigo: "TEC-0001", tipo: "teclado", marca: "DELL", modelo: "KB216" });
    const hoja = construirHojaDeVida(datosBase({ vigentes: [teclado] }));
    expect(hoja.perifericos).toEqual([
      { etiqueta: "PARLANTES", marca: "NO", modelo: "NO", serial: "NO" },
      { etiqueta: "TECLADO", marca: "DELL", modelo: "KB216", serial: "NO" },
      { etiqueta: "MOUSE", marca: "NO", modelo: "NO", serial: "NO" },
      { etiqueta: "AUDIFONOS", marca: "NO", modelo: "NO", serial: "NO" },
    ]);
  });

  it("repite el bloque de monitor por cada monitor y deja uno con NO si no tiene", () => {
    const m1 = deHoja({ id: 4, codigo: "MON-0001", tipo: "monitor", marca: "ACER", specs: { tamano: '22"', tipo: "LED" } });
    const m2 = deHoja({ id: 6, codigo: "MON-0002", tipo: "monitor", marca: "LG" });
    expect(construirHojaDeVida(datosBase({ vigentes: [m1, m2] })).monitores).toEqual([
      { marca: "ACER", modelo: "NO", tamano: '22"', color: "NO", tipo: "LED", serial: "NO" },
      { marca: "LG", modelo: "NO", tamano: "NO", color: "NO", tipo: "NO", serial: "NO" },
    ]);
    expect(construirHojaDeVida(datosBase()).monitores).toEqual([
      { marca: "NO", modelo: "NO", tamano: "NO", color: "NO", tipo: "NO", serial: "NO" },
    ]);
  });

  it("usa la impresora propia o, si no hay, la de su ubicación", () => {
    const deUbicacion = activo({
      id: 7,
      codigo: "IMP-0001",
      tipo: "impresora",
      marca: "EPSON",
      modelo: "L3250",
      specs: { cableConexion: true, cableEnergia: false },
    });
    expect(
      construirHojaDeVida(datosBase({ impresorasDeUbicacion: [deUbicacion] })).impresora,
    ).toEqual({
      aplica: "SI",
      marca: "EPSON",
      modelo: "L3250",
      serial: "NO",
      cableConexion: "SI",
      cableEnergia: "NO",
    });

    const propia = deHoja({ id: 8, codigo: "IMP-0002", tipo: "impresora", marca: "HP" });
    expect(
      construirHojaDeVida(
        datosBase({ vigentes: [propia], impresorasDeUbicacion: [deUbicacion] }),
      ).impresora.marca,
    ).toBe("HP");

    expect(construirHojaDeVida(datosBase()).impresora).toEqual({
      aplica: "NO",
      marca: "NA",
      modelo: "NA",
      serial: "NA",
      cableConexion: "NA",
      cableEnergia: "NA",
    });
  });
});

describe("construirHojaDeVida — observaciones y novedades", () => {
  it("no cuenta como cambio de equipo la recepción de la carga inicial, pero sí su entrega posterior", () => {
    const hoja = construirHojaDeVida(
      datosBase({
        vigentes: [PC_COMPLETO],
        historial: [
          { codigo: "PC-014", tipo: "pc_mesa", fechaDesde: "2025-07-09", fechaHasta: null, motivo: MOTIVO_CARGA_INICIAL },
          { codigo: "MON-0012", tipo: "monitor", fechaDesde: "2025-07-09", fechaHasta: "2026-01-10", motivo: MOTIVO_CARGA_INICIAL },
        ],
      }),
    );
    expect(hoja.observaciones).toEqual([
      "10/01/2026: ENTREGA MON-0012 (MONITOR)",
      "EQUIPO PRINCIPAL",
    ]);
  });

  it("agrupa los movimientos por día, evento y motivo, en orden cronológico, y suma las observaciones del PC", () => {
    const hoja = construirHojaDeVida(
      datosBase({
        vigentes: [PC_COMPLETO],
        historial: [
          { codigo: "PC-014", tipo: "pc_mesa", fechaDesde: "2024-01-20", fechaHasta: null, motivo: "Cambio de PC" },
          { codigo: "MON-0001", tipo: "monitor", fechaDesde: "2024-01-20", fechaHasta: null, motivo: "Cambio de PC" },
          { codigo: "PC-001", tipo: "pc_mesa", fechaDesde: "2023-03-15", fechaHasta: "2024-01-20", motivo: null },
        ],
      }),
    );
    expect(hoja.observaciones).toEqual([
      "15/03/2023: RECIBE PC-001 (PC DE MESA)",
      "20/01/2024: ENTREGA PC-001 (PC DE MESA)",
      "20/01/2024: RECIBE PC-014 (PC DE MESA), MON-0001 (MONITOR). MOTIVO: CAMBIO DE PC",
      "EQUIPO PRINCIPAL",
    ]);
  });

  it("lista los mantenimientos del PC del más reciente al más antiguo", () => {
    const pc = {
      ...PC_COMPLETO,
      mantenimientos: [
        { id: 1, activoId: 1, fecha: "2024-11-05", proximaFecha: "2025-05-05", tipo: "preventivo" as const, observacion: "Limpieza general." },
        { id: 2, activoId: 1, fecha: "2025-05-10", proximaFecha: null, tipo: "correctivo" as const, observacion: null },
      ],
    };
    const hoja = construirHojaDeVida(datosBase({ vigentes: [pc] }));
    expect(hoja.novedades).toEqual([
      { ultimaFecha: "10/05/2025", proximaFecha: "NA", tipo: "CORRECTIVO", observacion: "" },
      { ultimaFecha: "05/11/2024", proximaFecha: "05/05/2025", tipo: "PREVENTIVO", observacion: "Limpieza general." },
    ]);
  });

  it("sin mantenimientos deja un bloque de novedades vacío, como el formato", () => {
    const hoja = construirHojaDeVida(datosBase({ vigentes: [PC_COMPLETO] }));
    expect(hoja.novedades).toEqual([
      { ultimaFecha: "", proximaFecha: "", tipo: "", observacion: "" },
    ]);
  });
});
