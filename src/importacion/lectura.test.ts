import { describe, expect, it } from "vitest";
import { leerHoja, type HojaCruda, type ValorCelda } from "./lectura";

const fecha = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

/** Celdas de una hoja como la "1" del Excel original; cada test cambia lo que necesita. */
const BASE: Record<string, ValorCelda> = {
  A6: "PC", B6: 1, C6: "RESPONSABLE", D6: "JOHN PERTUZ PERTUZ", E6: "TELEFONO",
  A7: "VALOR", B7: 3570000, C7: "FECHA DE COMPRA", D7: fecha("2021-03-16"), E7: "EXP. DE GARANTIA",
  A8: "UBICACIÓN", B8: "DATA CENTER", C8: "TIPO DE COMPUTADOR", D8: "PORTATIL",
  E8: "FECHA DE ACTUALIZACION", F8: fecha("2025-07-08"),
  A11: "APLICA", B11: "NA", D11: "NA", F11: "NA",
  B14: "ASUS", D14: "LCN0CV12D631519", F14: "PLATEADO",
  B15: "X513EA", D15: "SSD", F15: 3,
  B16: "SSD", D16: "256 GB", F16: "20 GB",
  B17: "DDR4", D17: "INTEL CORE I7 1165G7", F17: "2.80 GHz",
  B18: "NO", D18: "NO", F18: "NO",
  B19: "SI", D19: "SI", F19: "NO",
  B20: "NO", D20: "NO", F20: "BOARD ASUS",
  B21: "WINDOWS 10 PRO", D21: "OFFICE - ADOBE", F21: "DEFENDER",
  A24: "PARLANTES", B24: "NO", D24: "NO", F24: "NO",
  A25: "TECLADO", B25: "DELL", D25: "DELL", F25: "NO",
  A26: "MOUSE", B26: "GENIUS", D26: "GENIUS", F26: "NO",
  A27: "AUDIFONOS", B27: "NO", D27: "NO", F27: "NO",
  A29: "ELABORADO POR:", A30: "DANIEL CASTAÑO NAVARRO",
  B35: "LG", D35: "24MR400-B", F35: '24"', B36: "NEGRO", D36: "FHD", F36: "412TOQN1Q772",
  B39: "NO", D39: "NO", F39: "NO", B40: "NO", D40: "NO", F40: "NO",
  A50: "ULTIMA FECHA", C50: "PROXIMA FECHA", E50: "TIPO DE MANTENIMIENTO", A51: "OBSERVACION:",
  A52: "ULTIMA FECHA", C52: "PROXIMA FECHA", E52: "TIPO DE MANTENIMIENTO", A53: "OBSERVACION:",
};

function hoja(cambios: Record<string, ValorCelda | undefined> = {}, nombre = "1"): HojaCruda {
  const celdas = { ...BASE, ...cambios };
  for (const clave of Object.keys(celdas)) if (celdas[clave] === undefined) delete celdas[clave];
  return { nombre, celdas: celdas as Record<string, ValorCelda> };
}

describe("leerHoja — cabecera y equipo", () => {
  it("lee la cabecera con sus tipos", () => {
    const ficha = leerHoja(hoja());
    expect(ficha).toMatchObject({
      hoja: "1",
      responsable: "JOHN PERTUZ PERTUZ",
      telefono: null,
      valor: 3570000,
      fechaCompra: "2021-03-16",
      garantia: null,
      ubicacion: "DATA CENTER",
      tipoComputador: "PORTATIL",
      fechaActualizacion: "2025-07-08",
    });
  });

  it("convierte el valor escrito como texto con signo y puntos", () => {
    expect(leerHoja(hoja({ B7: "$1.661.344" })).valor).toBe(1661344);
  });

  it("lee el equipo; NO, NA y vacío quedan sin dato y los SI/NO como booleanos", () => {
    const { equipo } = leerHoja(hoja());
    expect(equipo).toEqual({
      marca: "ASUS",
      serial: "LCN0CV12D631519",
      color: "PLATEADO",
      modelo: "X513EA",
      unidadDisco: "SSD",
      puertosUsb: 3,
      capacidad: "256 GB",
      ram: "20 GB",
      tipoRam: "DDR4",
      procesador: "INTEL CORE I7 1165G7",
      velocidad: "2.80 GHz",
      tarjetaGrafica: false,
      graficaModelo: null,
      graficaCapacidad: null,
      wifi: true,
      tarjetaWifi: null,
      puertoRed: false,
      tarjetaSonido: false,
      sonidoModelo: null,
      board: "BOARD ASUS",
      sistemaOperativo: "WINDOWS 10 PRO",
      ofimatica: "OFFICE - ADOBE",
      antivirus: "DEFENDER",
    });
  });

  it("trata seriales como NO TIENE o NA como vacíos", () => {
    expect(leerHoja(hoja({ D14: "NO TIENE" })).equipo.serial).toBeNull();
    expect(leerHoja(hoja({ D14: "NA" })).equipo.serial).toBeNull();
  });

  it("lee la batería solo cuando aplica", () => {
    expect(leerHoja(hoja()).bateria).toBeNull();
    expect(leerHoja(hoja({ B11: "SI", D11: "L21M3PG2", F11: "BUENO" })).bateria).toEqual({
      serial: "L21M3PG2",
      estado: "BUENO",
    });
  });
});

describe("leerHoja — periféricos, monitor e impresora", () => {
  it("incluye solo los periféricos con marca", () => {
    expect(leerHoja(hoja()).perifericos).toEqual([
      { tipo: "teclado", marca: "DELL", modelo: "DELL", serial: null },
      { tipo: "mouse", marca: "GENIUS", modelo: "GENIUS", serial: null },
    ]);
  });

  it("lee el monitor y lo omite si la marca dice NO o está vacía", () => {
    expect(leerHoja(hoja()).monitor).toEqual({
      marca: "LG", modelo: "24MR400-B", tamano: '24"', color: "NEGRO", tipo: "FHD", serial: "412TOQN1Q772",
    });
    expect(leerHoja(hoja({ B35: "NO", D35: "NO", F36: "NO" })).monitor).toBeNull();
    expect(leerHoja(hoja({ B35: undefined, D35: undefined, F36: undefined })).monitor).toBeNull();
  });

  it("lee la impresora solo si APLICA es SI", () => {
    expect(leerHoja(hoja()).impresora).toBeNull();
    expect(
      leerHoja(hoja({ B39: "SI", D39: "EPSON", F39: "L3210", D40: "SI", F40: "NO" })).impresora,
    ).toEqual({ marca: "EPSON", modelo: "L3210", serial: null, cableConexion: true, cableEnergia: false });
  });
});

describe("leerHoja — observaciones y novedades", () => {
  it("ordena las observaciones por su número y les quita la numeración", () => {
    const ficha = leerHoja(
      hoja({
        A44: "4. ACTUALMENTE ESTA EN LA OFICINA MODULO 3 06/08/2025",
        A45: "3) ACTUALMENTE ESTA EN EL CONSULTORIO 2",
        A46: "2- SE HIZO CAMBIO DE MONITOR",
        A47: "1. ANTERIOR PC DE MICHAEL PABON",
      }),
    );
    expect(ficha.observaciones).toEqual([
      "ANTERIOR PC DE MICHAEL PABON",
      "SE HIZO CAMBIO DE MONITOR",
      "ACTUALMENTE ESTA EN EL CONSULTORIO 2",
      "ACTUALMENTE ESTA EN LA OFICINA MODULO 3 06/08/2025",
    ]);
  });

  it("conserva el orden si alguna observación no tiene número", () => {
    const ficha = leerHoja(
      hoja({ A43: "TIENE CONECTADO UNA IMPRESORA EPSON L3110", A44: "ANTERIOR EQUIPO DE KELLY TAMARA" }),
    );
    expect(ficha.observaciones).toEqual([
      "TIENE CONECTADO UNA IMPRESORA EPSON L3110",
      "ANTERIOR EQUIPO DE KELLY TAMARA",
    ]);
  });

  it("lee las novedades con fechas reales o escritas como texto, y su observación", () => {
    const ficha = leerHoja(
      hoja({
        B50: fecha("2026-04-09"), D50: fecha("2026-10-09"), F50: "PREVENTIVO",
        A51: "OBSERVACION: SE HIZO MANTENIMIENTO PREVENTIVO",
        B52: "16/03/2026", D52: "18-09-2026", F52: "CORRECTIVO",
      }),
    );
    expect(ficha.novedades).toEqual([
      { fecha: "2026-04-09", proximaFecha: "2026-10-09", tipo: "preventivo", observacion: "SE HIZO MANTENIMIENTO PREVENTIVO" },
      { fecha: "2026-03-16", proximaFecha: "2026-09-18", tipo: "correctivo", observacion: null },
    ]);
    expect(ficha.avisos).toEqual([]);
  });

  it("encuentra las novedades aunque la hoja esté corrida una fila", () => {
    const ficha = leerHoja(
      hoja({
        A50: undefined, C50: undefined, E50: undefined, A51: "ULTIMA FECHA",
        B51: fecha("2026-06-26"), D51: fecha("2026-12-26"), F51: "PREVENTIVO", A52: "OBSERVACION:",
        A49: "1) EL DIA 23-09-2025 FUERON ENVIADOS PARA VALLEDUPAR", D50: "&",
      }),
    );
    expect(ficha.novedades).toHaveLength(1);
    expect(ficha.novedades[0].fecha).toBe("2026-06-26");
    expect(ficha.observaciones).toEqual(["EL DIA 23-09-2025 FUERON ENVIADOS PARA VALLEDUPAR"]);
  });

  it("descarta próximas fechas inexistentes o no posteriores, con aviso", () => {
    const ficha = leerHoja(
      hoja({
        B50: fecha("2025-08-29"), D50: "29/02/2026", F50: "CORRECTIVO",
        B52: fecha("2026-08-12"), D52: fecha("2026-02-12"), F52: "PREVENTIVO",
      }),
    );
    expect(ficha.novedades.map((n) => n.proximaFecha)).toEqual([null, null]);
    expect(ficha.avisos).toEqual([
      'Mantenimiento del 29/08/2025: la próxima fecha "29/02/2026" no es una fecha válida; se importa sin próxima fecha.',
      "Mantenimiento del 12/08/2026: la próxima fecha 12/02/2026 no es posterior; se importa sin próxima fecha.",
    ]);
  });

  it("omite con aviso un mantenimiento cuya fecha no se puede leer", () => {
    const ficha = leerHoja(hoja({ B50: "ayer", F50: "PREVENTIVO" }));
    expect(ficha.novedades).toEqual([]);
    expect(ficha.avisos).toEqual(['Mantenimiento con fecha "ayer" ilegible: no se importa.']);
  });

  it("avisa si el número de PC de la celda no coincide con el nombre de la hoja", () => {
    expect(leerHoja(hoja({ B6: 17 }, "18")).avisos).toContain(
      'La celda PC dice "17" pero la hoja se llama "18"; se usa el nombre de la hoja.',
    );
  });
});
