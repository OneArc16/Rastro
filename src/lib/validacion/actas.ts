/**
 * Contenido de cada acta: la copia fija de todo lo que se imprime en su
 * formato aprobado. Lo usan el formulario (cliente) y las acciones (servidor).
 */
import { z } from "zod";
import { TIPOS_ACTA } from "@/db/schema";
import { fechaObligatoria, idPositivo } from "./comunes";

const texto = z.string().trim().max(300).default("");
const textoLargo = z.string().trim().max(3000).default("");

const persona = z.object({ nombre: texto, cargo: texto });

/** Encabezado y pie del formato, copiados al crear el acta. */
export const esquemaFormatoImpreso = z.object({
  codigo: texto,
  version: texto,
  fechaEmision: texto,
  elaborado: persona,
  revisado: persona,
  aprobado: persona,
});

const responsable = z.object({
  nombre: texto,
  cargo: texto,
  celular: texto,
  correo: texto,
  area: texto,
  municipio: texto,
});

// ---------------------------------------------------------------------------
// Entrega (F-SIS-002)
// ---------------------------------------------------------------------------

export const PERIFERICOS_ENTREGA = [
  "Monitor",
  "Mouse",
  "Teclado",
  "Impresora",
  "Parlantes",
  "Celular",
] as const;

export const PRUEBAS_ENTREGA = [
  "Pruebas On/Off",
  "Función S.O.",
  "Función aplicaciones",
  "Unidad óptica",
  "Prueba de sonido",
  "Función monitor",
  "Función teclado",
  "Función mouse",
] as const;

export const RESULTADOS_PRUEBA = ["", "ok", "falla"] as const;

export const esquemaDatosEntrega = z.object({
  formato: esquemaFormatoImpreso,
  responsable,
  perifericos: z
    .array(z.object({ dispositivo: texto, marca: texto, serial: texto }))
    .max(20),
  torre: z.object({
    marcaCpu: texto,
    velocidad: texto,
    cantidadRam: texto,
    tipoRam: texto,
    hdmi: texto,
    vga: texto,
    discoDuro: texto,
    tarjetaVideo: texto,
    unidadOptica: texto,
    serialTorre: texto,
    sistemaOperativo: texto,
    marca: texto,
  }),
  software: textoLargo,
  pruebas: z
    .array(z.object({ prueba: texto, resultado: z.enum(RESULTADOS_PRUEBA).default("") }))
    .max(20),
  tiempoEstimadoUso: texto,
  observacion: textoLargo,
  entrega: persona,
  fechaEntrega: texto,
  fechaRecibido: texto,
});

// ---------------------------------------------------------------------------
// Egreso (F-SIS-001)
// ---------------------------------------------------------------------------

export const DISPOSITIVOS_EGRESO = [
  "Torre",
  "Monitor",
  "Mouse",
  "Teclado",
  "Impresora",
  "Parlantes",
  "Estabilizador",
  "Cables",
] as const;

export const RESPUESTAS_SI_NO = ["", "si", "no"] as const;

export const esquemaDatosEgreso = z.object({
  formato: esquemaFormatoImpreso,
  funcionarioTi: z.object({ nombre: texto, cargo: texto, correo: texto, celular: texto }),
  dispositivos: z
    .array(
      z.object({
        dispositivo: texto,
        enviado: z.enum(RESPUESTAS_SI_NO).default(""),
        cantidad: texto,
        detalle: texto,
      }),
    )
    .max(20),
  detalleEnvio: textoLargo,
  recibe: persona,
  fechaSalida: texto,
});

// ---------------------------------------------------------------------------
// Baja (FCOM-01)
// ---------------------------------------------------------------------------

/** Textos literales del formato FCOM-01. */
export const CALIFICACIONES_BAJA = [
  "Baja para depósito y aprovechamiento futuro de piezas o componentes",
  "Baja por daño en circuitos eléctricos",
  "Baja por uso inapropiado",
  "Baja definitiva",
  "Baja por deterioro equipo no enciende",
  "Otros",
] as const;

export const esquemaDatosBaja = z.object({
  formato: esquemaFormatoImpreso,
  responsable,
  equipo: z.object({
    elemento: texto,
    marca: texto,
    modelo: texto,
    serial: texto,
    capacidadDisco: texto,
    procesador: texto,
    ram: texto,
    fechaCompra: texto,
    fechaBaja: texto,
  }),
  calificaciones: z.array(z.enum(CALIFICACIONES_BAJA)).max(CALIFICACIONES_BAJA.length),
  especificacion: textoLargo,
  diagnostico: persona,
  jefeArea: persona,
});

// ---------------------------------------------------------------------------
// Inducción: acta de reunión F-SGI-001
// ---------------------------------------------------------------------------

export const esquemaDatosInduccion = z.object({
  formato: esquemaFormatoImpreso,
  fecha: texto,
  hora: texto,
  lugar: texto,
  objetivo: textoLargo,
  proceso: texto,
  responsables: texto,
  asistentes: z.array(persona).max(60),
  /** Un punto por línea; se imprimen numerados. */
  puntos: textoLargo,
  desarrollo: textoLargo,
});

export type DatosEntrega = z.output<typeof esquemaDatosEntrega>;
export type DatosEgreso = z.output<typeof esquemaDatosEgreso>;
export type DatosBaja = z.output<typeof esquemaDatosBaja>;
export type DatosInduccion = z.output<typeof esquemaDatosInduccion>;
export type FormatoImpreso = z.output<typeof esquemaFormatoImpreso>;

export const ESQUEMA_DATOS_POR_TIPO = {
  entrega: esquemaDatosEntrega,
  egreso: esquemaDatosEgreso,
  baja: esquemaDatosBaja,
  induccion: esquemaDatosInduccion,
} as const;

// ---------------------------------------------------------------------------
// Foto de la baja (ya reducida en el navegador)
// ---------------------------------------------------------------------------

export const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"] as const;
/**
 * Tope de la foto ya reducida en el navegador (≈1600 px en JPEG suele pesar
 * 200–500 KB). Queda por debajo del límite de 1 MB de las server actions.
 */
export const MAXIMO_BYTES_FOTO = 800 * 1024;

/** Fotos que admite un acta de baja. */
export const MAXIMO_FOTOS = 4;

// ---------------------------------------------------------------------------
// Acta firmada escaneada
// ---------------------------------------------------------------------------

export const TIPOS_ESCANEO = ["application/pdf", "image/jpeg", "image/png"] as const;
/** Tope por archivo escaneado (sin reducir: debe leerse la firma). */
export const MAXIMO_BYTES_ESCANEO = 10 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Datos comunes de crear y editar
// ---------------------------------------------------------------------------

const idOpcional = (mensaje: string) =>
  z.preprocess((v) => (v === "" || v === null ? undefined : v), idPositivo(mensaje).optional());

const camposActa = {
  fecha: fechaObligatoria,
  funcionarioId: idOpcional("Funcionario inválido"),
  ubicacionId: idOpcional("Ubicación inválida"),
  activoIds: z.array(idPositivo("Activo inválido")).max(50).default([]),
};

export const esquemaActa = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("entrega"), ...camposActa, datos: esquemaDatosEntrega }),
  z.object({ tipo: z.literal("egreso"), ...camposActa, datos: esquemaDatosEgreso }),
  z.object({ tipo: z.literal("baja"), ...camposActa, datos: esquemaDatosBaja }),
  z.object({ tipo: z.literal("induccion"), ...camposActa, datos: esquemaDatosInduccion }),
]);

export type EntradaActa = z.output<typeof esquemaActa>;

/** Lo que envía el formulario de un acta (las fotos viajan aparte en el FormData). */
export const esquemaEnvioActa = z.object({
  acta: esquemaActa,
  /** Solo egreso al crear: dejar los equipos en la ubicación de destino. */
  trasladar: z.boolean().default(false),
  /**
   * Solo al editar: ids de las fotos guardadas que se conservan, en orden.
   * Sin este campo se conservan todas.
   */
  fotosConservadas: z.array(idPositivo("Foto inválida")).max(MAXIMO_FOTOS).optional(),
});

export { TIPOS_ACTA };

/** Formulario de Configuración: encabezado y pie de un formato de acta. */
export const esquemaFormatoActaFormulario = z.object({
  tipo: z.enum(TIPOS_ACTA),
  formato: esquemaFormatoImpreso.extend({
    fechaEmision: z.union([z.literal(""), fechaObligatoria]).default(""),
  }),
});
