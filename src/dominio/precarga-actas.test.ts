import { describe, expect, it } from "vitest";
import { FORMATOS_PREDETERMINADOS } from "./actas";
import {
  precargarBaja,
  precargarEgreso,
  precargarEntrega,
  type EquipoPrecarga,
} from "./precarga-actas";

const formato = {
  ...FORMATOS_PREDETERMINADOS.entrega,
  elaborado: { nombre: "Quien Elabora", cargo: "Auxiliar TI" },
};

const persona = {
  nombre: "Persona Prueba",
  cargo: "AUXILIAR",
  telefono: "3000000000",
  correo: "p@x.co",
  ubicacion: "SEDE NORTE",
};

function equipo(datos: Partial<EquipoPrecarga> & Pick<EquipoPrecarga, "id" | "codigo" | "tipo">) {
  return {
    marca: null,
    modelo: null,
    serial: null,
    specs: null,
    fechaCompra: null,
    ...datos,
  } satisfies EquipoPrecarga;
}

const pc = equipo({
  id: 1,
  codigo: "PC-001",
  tipo: "pc_mesa",
  marca: "OHG",
  serial: "T-1",
  specs: {
    procesador: "INTEL CORE I5",
    velocidad: "2.50 GHz",
    ram: "16 GB",
    tipoRam: "DDR4",
    unidadDisco: "SSD",
    capacidadDisco: "512 GB",
    tarjetaGrafica: { modelo: "GT 710", capacidad: "2 GB" },
    sistemaOperativo: "WINDOWS 11 PRO",
    ofimatica: "OFFICE",
    antivirus: "DEFENDER",
  },
  fechaCompra: "2024-03-10",
});
const monitor = equipo({ id: 2, codigo: "MON-001", tipo: "monitor", marca: "LG", modelo: "22MK", serial: "M-1" });
const mouse = equipo({ id: 3, codigo: "MOU-001", tipo: "mouse", marca: "GENIUS" });

describe("precargarEntrega", () => {
  it("llena responsable, periféricos, torre y software con los equipos del funcionario", () => {
    const { activoIds, datos } = precargarEntrega({
      formato,
      funcionario: persona,
      equipos: [pc, monitor, mouse],
      hoy: "2026-11-16",
    });

    expect(activoIds).toEqual([1, 2, 3]);
    expect(datos.formato).toEqual(formato);
    expect(datos.responsable).toEqual({
      nombre: "Persona Prueba",
      cargo: "AUXILIAR",
      celular: "3000000000",
      correo: "p@x.co",
      area: "SEDE NORTE",
      municipio: "",
    });
    expect(datos.perifericos).toEqual([
      { dispositivo: "Monitor", marca: "LG 22MK", serial: "M-1" },
      { dispositivo: "Mouse", marca: "GENIUS", serial: "" },
      { dispositivo: "Teclado", marca: "", serial: "" },
      { dispositivo: "Impresora", marca: "", serial: "" },
      { dispositivo: "Parlantes", marca: "", serial: "" },
      { dispositivo: "Celular", marca: "", serial: "" },
    ]);
    expect(datos.torre).toMatchObject({
      marcaCpu: "INTEL CORE I5",
      velocidad: "2.50 GHz",
      cantidadRam: "16 GB",
      tipoRam: "DDR4",
      discoDuro: "SSD 512 GB",
      tarjetaVideo: "GT 710 2 GB",
      serialTorre: "T-1",
      sistemaOperativo: "WINDOWS 11 PRO",
      marca: "OHG",
      hdmi: "",
    });
    expect(datos.software).toBe("OFFICE\nDEFENDER");
    expect(datos.pruebas).toHaveLength(8);
    expect(datos.pruebas.every((p) => p.resultado === "")).toBe(true);
    expect(datos.entrega).toEqual({ nombre: "Quien Elabora", cargo: "Auxiliar TI" });
    expect(datos.fechaEntrega).toBe("2026-11-16");
    expect(datos.fechaRecibido).toBe("2026-11-16");
  });

  it("sin equipos deja las tablas en blanco", () => {
    const { activoIds, datos } = precargarEntrega({
      formato,
      funcionario: { ...persona, telefono: null, correo: null, ubicacion: null },
      equipos: [],
      hoy: "2026-11-16",
    });
    expect(activoIds).toEqual([]);
    expect(datos.torre.marcaCpu).toBe("");
    expect(datos.responsable.celular).toBe("");
    expect(datos.software).toBe("");
  });
});

describe("precargarEgreso", () => {
  it("marca los dispositivos enviados con su cantidad y detalle", () => {
    const { activoIds, datos } = precargarEgreso({
      formato,
      equipos: [pc, monitor],
      destino: "DISPENSARIO SUR",
      hoy: "2026-11-16",
    });
    expect(activoIds).toEqual([1, 2]);
    expect(datos.funcionarioTi).toEqual({
      nombre: "Quien Elabora",
      cargo: "Auxiliar TI",
      correo: "",
      celular: "",
    });
    expect(datos.dispositivos[0]).toEqual({
      dispositivo: "Torre",
      enviado: "si",
      cantidad: "1",
      detalle: "PC-001 OHG",
    });
    expect(datos.dispositivos[1]).toEqual({
      dispositivo: "Monitor",
      enviado: "si",
      cantidad: "1",
      detalle: "MON-001 LG 22MK",
    });
    expect(datos.dispositivos[2]).toEqual({
      dispositivo: "Mouse",
      enviado: "",
      cantidad: "",
      detalle: "",
    });
    expect(datos.detalleEnvio).toBe("SE HACE SALIDA A DISPENSARIO SUR");
    expect(datos.fechaSalida).toBe("2026-11-16");
  });
});

describe("precargarBaja", () => {
  it("llena los datos del equipo y del responsable", () => {
    const datos = precargarBaja({
      formato,
      equipo: pc,
      responsable: persona,
      hoy: "2026-11-16",
    });
    expect(datos.equipo).toEqual({
      elemento: "PC DE MESA",
      marca: "OHG",
      modelo: "",
      serial: "T-1",
      capacidadDisco: "512 GB",
      procesador: "INTEL CORE I5",
      ram: "16 GB",
      fechaCompra: "2024-03-10",
      fechaBaja: "2026-11-16",
    });
    expect(datos.responsable.nombre).toBe("Persona Prueba");
    expect(datos.diagnostico).toEqual({ nombre: "Quien Elabora", cargo: "Auxiliar TI" });
    expect(datos.calificaciones).toEqual([]);
  });

  it("sin responsable deja sus datos en blanco", () => {
    const datos = precargarBaja({ formato, equipo: monitor, responsable: null, hoy: "2026-11-16" });
    expect(datos.responsable.nombre).toBe("");
    expect(datos.equipo.procesador).toBe("");
  });
});
