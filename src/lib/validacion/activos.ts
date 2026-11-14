import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
  activos,
  type Specs,
  type SpecsImpresora,
  type SpecsMonitor,
  type SpecsPC,
  type TIPOS_ACTIVO,
} from "@/db/schema";
import { enteroOpcional, fechaOpcional, textoOpcional } from "./comunes";

type TipoActivo = (typeof TIPOS_ACTIVO)[number];

// ---------------------------------------------------------------------------
// Specs en el formulario: estructura plana (los objetos anidados de la BD,
// como tarjetaGrafica y bateria, se aplanan para simplificar los campos).
// Todos los campos son opcionales; el formulario muestra solo los del tipo.
// ---------------------------------------------------------------------------

export const esquemaSpecsFormulario = z.object({
  // PC (pc_mesa, portatil, todo_en_uno)
  unidadDisco: textoOpcional,
  capacidadDisco: textoOpcional,
  ram: textoOpcional,
  tipoRam: textoOpcional,
  procesador: textoOpcional,
  velocidad: textoOpcional,
  puertosUsb: enteroOpcional,
  tarjetaGraficaModelo: textoOpcional,
  tarjetaGraficaCapacidad: textoOpcional,
  tarjetaWifi: textoOpcional,
  puertoRed: z.boolean().optional(),
  tarjetaSonido: textoOpcional,
  board: textoOpcional,
  sistemaOperativo: textoOpcional,
  ofimatica: textoOpcional,
  antivirus: textoOpcional,
  // Solo portátiles
  bateriaSerial: textoOpcional,
  bateriaEstado: textoOpcional,
  // Monitor
  tamano: textoOpcional,
  tipo: textoOpcional,
  // Impresora
  cableConexion: z.boolean().optional(),
  cableEnergia: z.boolean().optional(),
});

export type SpecsFormulario = z.infer<typeof esquemaSpecsFormulario>;

// ---------------------------------------------------------------------------
// Esquema del formulario de activo, generado desde la tabla de Drizzle.
// En la fase 2 el estado solo permite operativo / en_reparacion: dar de baja
// exige cerrar asignaciones vigentes en transacción (acción de la fase 3).
// ---------------------------------------------------------------------------

export const esquemaActivoFormulario = createInsertSchema(activos, {
  codigo: z
    .string()
    .trim()
    .min(1, "El código es obligatorio")
    .regex(/^[A-Z]{2,5}-\d{1,6}$/, "Formato esperado: PREFIJO-número, p. ej. PC-014"),
  marca: textoOpcional,
  modelo: textoOpcional,
  serial: textoOpcional,
  color: textoOpcional,
  estado: z.enum(["operativo", "en_reparacion"]),
  valor: enteroOpcional,
  fechaCompra: fechaOpcional,
  garantiaHasta: fechaOpcional,
  observaciones: textoOpcional,
  specs: esquemaSpecsFormulario.optional(),
}).omit({ id: true, creadoEn: true, actualizadoEn: true });

export type ActivoFormulario = z.input<typeof esquemaActivoFormulario>;
export type ActivoValidado = z.output<typeof esquemaActivoFormulario>;

// ---------------------------------------------------------------------------
// Conversión entre los specs planos del formulario y el JSON de la BD
// ---------------------------------------------------------------------------

const ES_TIPO_PC: Record<TipoActivo, boolean> = {
  pc_mesa: true,
  portatil: true,
  todo_en_uno: true,
  monitor: false,
  teclado: false,
  mouse: false,
  impresora: false,
  parlantes: false,
  audifonos: false,
  otro: false,
};

export function esTipoPc(tipo: TipoActivo): boolean {
  return ES_TIPO_PC[tipo];
}

/** Elimina las claves undefined; devuelve null si no queda ninguna. */
function compactar<T extends object>(objeto: T): T | null {
  const entradas = Object.entries(objeto).filter(([, v]) => v !== undefined);
  return entradas.length > 0 ? (Object.fromEntries(entradas) as T) : null;
}

/** Convierte los campos planos del formulario al JSON `specs` que guarda la BD. */
export function specsDesdeFormulario(
  tipo: TipoActivo,
  specs: SpecsFormulario,
): Specs | null {
  if (esTipoPc(tipo)) {
    const pc: SpecsPC = {
      unidadDisco: specs.unidadDisco,
      capacidadDisco: specs.capacidadDisco,
      ram: specs.ram,
      tipoRam: specs.tipoRam,
      procesador: specs.procesador,
      velocidad: specs.velocidad,
      puertosUsb: specs.puertosUsb,
      tarjetaWifi: specs.tarjetaWifi,
      puertoRed: specs.puertoRed,
      tarjetaSonido: specs.tarjetaSonido,
      board: specs.board,
      sistemaOperativo: specs.sistemaOperativo,
      ofimatica: specs.ofimatica,
      antivirus: specs.antivirus,
    };
    if (specs.tarjetaGraficaModelo) {
      pc.tarjetaGrafica = {
        modelo: specs.tarjetaGraficaModelo,
        ...(specs.tarjetaGraficaCapacidad
          ? { capacidad: specs.tarjetaGraficaCapacidad }
          : {}),
      };
    }
    if (tipo === "portatil" && (specs.bateriaSerial || specs.bateriaEstado)) {
      pc.bateria = compactar({
        serial: specs.bateriaSerial,
        estado: specs.bateriaEstado,
      });
    }
    return compactar(pc);
  }

  if (tipo === "monitor") {
    const monitor: SpecsMonitor = { tamano: specs.tamano, tipo: specs.tipo };
    return compactar(monitor);
  }

  if (tipo === "impresora") {
    const impresora: SpecsImpresora = {
      cableConexion: specs.cableConexion,
      cableEnergia: specs.cableEnergia,
    };
    return compactar(impresora);
  }

  return null;
}

/** Aplana el JSON `specs` de la BD para precargar el formulario de edición. */
export function specsAFormulario(
  tipo: TipoActivo,
  specs: Specs | null | undefined,
): SpecsFormulario {
  if (!specs) return {};

  if (esTipoPc(tipo)) {
    const pc = specs as SpecsPC;
    return compactar({
      unidadDisco: pc.unidadDisco,
      capacidadDisco: pc.capacidadDisco,
      ram: pc.ram,
      tipoRam: pc.tipoRam,
      procesador: pc.procesador,
      velocidad: pc.velocidad,
      puertosUsb: pc.puertosUsb,
      tarjetaGraficaModelo: pc.tarjetaGrafica?.modelo,
      tarjetaGraficaCapacidad: pc.tarjetaGrafica?.capacidad,
      tarjetaWifi: pc.tarjetaWifi ?? undefined,
      puertoRed: pc.puertoRed,
      tarjetaSonido: pc.tarjetaSonido ?? undefined,
      board: pc.board,
      sistemaOperativo: pc.sistemaOperativo,
      ofimatica: pc.ofimatica,
      antivirus: pc.antivirus,
      bateriaSerial: pc.bateria?.serial,
      bateriaEstado: pc.bateria?.estado,
    }) ?? {};
  }

  if (tipo === "monitor") {
    const monitor = specs as SpecsMonitor;
    return compactar({ tamano: monitor.tamano, tipo: monitor.tipo }) ?? {};
  }

  if (tipo === "impresora") {
    const impresora = specs as SpecsImpresora;
    return (
      compactar({
        cableConexion: impresora.cableConexion,
        cableEnergia: impresora.cableEnergia,
      }) ?? {}
    );
  }

  return {};
}
