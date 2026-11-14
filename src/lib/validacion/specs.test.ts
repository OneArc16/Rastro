import { describe, expect, it } from "vitest";
import { specsAFormulario, specsDesdeFormulario } from "./activos";

describe("specsDesdeFormulario", () => {
  it("arma SpecsPC anidando tarjeta gráfica y descartando campos vacíos", () => {
    const specs = specsDesdeFormulario("pc_mesa", {
      ram: "16 GB",
      procesador: "INTEL CORE I5 12400",
      puertosUsb: 6,
      puertoRed: true,
      tarjetaGraficaModelo: "INTEL UHD 730",
      tarjetaGraficaCapacidad: "COMPARTIDA",
    });
    expect(specs).toEqual({
      ram: "16 GB",
      procesador: "INTEL CORE I5 12400",
      puertosUsb: 6,
      puertoRed: true,
      tarjetaGrafica: { modelo: "INTEL UHD 730", capacidad: "COMPARTIDA" },
    });
  });

  it("solo guarda batería en portátiles", () => {
    const portatil = specsDesdeFormulario("portatil", {
      bateriaSerial: "L21M3PG2",
      bateriaEstado: "BUENO",
    });
    expect(portatil).toEqual({
      bateria: { serial: "L21M3PG2", estado: "BUENO" },
    });

    const pcMesa = specsDesdeFormulario("pc_mesa", {
      bateriaSerial: "L21M3PG2",
    });
    expect(pcMesa).toBeNull();
  });

  it("usa los campos de monitor e impresora según el tipo", () => {
    expect(
      specsDesdeFormulario("monitor", { tamano: '22"', tipo: "LED" }),
    ).toEqual({ tamano: '22"', tipo: "LED" });

    expect(
      specsDesdeFormulario("impresora", {
        cableConexion: true,
        cableEnergia: false,
      }),
    ).toEqual({ cableConexion: true, cableEnergia: false });
  });

  it("devuelve null cuando no hay ninguna especificación", () => {
    expect(specsDesdeFormulario("teclado", {})).toBeNull();
    expect(specsDesdeFormulario("pc_mesa", {})).toBeNull();
  });
});

describe("specsAFormulario", () => {
  it("aplana los objetos anidados para precargar el formulario de edición", () => {
    const formulario = specsAFormulario("portatil", {
      ram: "8 GB",
      tarjetaGrafica: { modelo: "RTX 3050", capacidad: "4 GB" },
      bateria: { serial: "ABC", estado: "BUENO" },
    });
    expect(formulario).toMatchObject({
      ram: "8 GB",
      tarjetaGraficaModelo: "RTX 3050",
      tarjetaGraficaCapacidad: "4 GB",
      bateriaSerial: "ABC",
      bateriaEstado: "BUENO",
    });
  });

  it("es inverso de specsDesdeFormulario para un PC completo", () => {
    const original = {
      unidadDisco: "SSD",
      ram: "16 GB",
      puertosUsb: 6,
      puertoRed: true,
      tarjetaGrafica: { modelo: "INTEL UHD 730" },
    };
    const ida = specsAFormulario("pc_mesa", original);
    const vuelta = specsDesdeFormulario("pc_mesa", ida);
    expect(vuelta).toEqual(original);
  });
});
