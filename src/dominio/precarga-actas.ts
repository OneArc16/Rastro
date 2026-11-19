/**
 * Precarga de las actas: arma el contenido inicial del formulario con lo que
 * la app ya sabe del funcionario y de sus equipos. Todo queda editable.
 * Funciones puras: reciben los datos ya consultados y la fecha de hoy.
 */
import type { Specs, SpecsPC, TIPOS_ACTIVO } from "@/db/schema";
import { ETIQUETAS_TIPO } from "@/lib/etiquetas";
import {
  DISPOSITIVOS_EGRESO,
  PERIFERICOS_ENTREGA,
  PRUEBAS_ENTREGA,
  type DatosBaja,
  type DatosInduccion,
  type DatosEgreso,
  type DatosEntrega,
  type FormatoImpreso,
} from "@/lib/validacion/actas";

type TipoActivo = (typeof TIPOS_ACTIVO)[number];

export type EquipoPrecarga = {
  id: number;
  codigo: string;
  tipo: TipoActivo;
  marca: string | null;
  modelo: string | null;
  serial: string | null;
  specs: Specs | null;
  fechaCompra: string | null;
};

export type PersonaPrecarga = {
  nombre: string;
  cargo: string | null;
  telefono: string | null;
  correo: string | null;
  ubicacion: string | null;
};

const TIPOS_TORRE: TipoActivo[] = ["pc_mesa", "portatil", "todo_en_uno"];

/** Tipos de activo que corresponden a cada fila de los formatos. */
const TIPOS_POR_DISPOSITIVO: Record<string, TipoActivo[]> = {
  Torre: TIPOS_TORRE,
  Monitor: ["monitor"],
  Mouse: ["mouse"],
  Teclado: ["teclado"],
  Impresora: ["impresora"],
  Parlantes: ["parlantes"],
};

const unir = (...partes: (string | null | undefined)[]) =>
  partes.filter((parte) => parte && parte.trim()).join(" ");

const equiposDe = (equipos: EquipoPrecarga[], dispositivo: string) =>
  equipos.filter((e) => TIPOS_POR_DISPOSITIVO[dispositivo]?.includes(e.tipo));

function responsableDe(persona: PersonaPrecarga | null) {
  return {
    nombre: persona?.nombre ?? "",
    cargo: persona?.cargo ?? "",
    celular: persona?.telefono ?? "",
    correo: persona?.correo ?? "",
    // La ubicación es lo más parecido al área que guarda la app
    area: persona?.ubicacion ?? "",
    municipio: "",
  };
}

const specsPC = (equipo: EquipoPrecarga | undefined): SpecsPC => (equipo?.specs ?? {}) as SpecsPC;

export function precargarEntrega(entrada: {
  formato: FormatoImpreso;
  funcionario: PersonaPrecarga;
  equipos: EquipoPrecarga[];
  hoy: string;
}): { activoIds: number[]; datos: DatosEntrega } {
  const { formato, funcionario, equipos, hoy } = entrada;
  const torre = equipos.find((e) => TIPOS_TORRE.includes(e.tipo));
  const s = specsPC(torre);
  const grafica = s.tarjetaGrafica;

  return {
    activoIds: equipos.map((e) => e.id),
    datos: {
      formato,
      responsable: responsableDe(funcionario),
      perifericos: PERIFERICOS_ENTREGA.map((dispositivo) => {
        const encontrado = equiposDe(equipos, dispositivo)[0];
        return {
          dispositivo,
          marca: unir(encontrado?.marca, encontrado?.modelo),
          serial: encontrado?.serial ?? "",
        };
      }),
      torre: {
        marcaCpu: s.procesador ?? "",
        velocidad: s.velocidad ?? "",
        cantidadRam: s.ram ?? "",
        tipoRam: s.tipoRam ?? "",
        hdmi: "",
        vga: "",
        discoDuro: unir(s.unidadDisco, s.capacidadDisco),
        tarjetaVideo: grafica ? unir(grafica.modelo, grafica.capacidad) : "",
        unidadOptica: "",
        serialTorre: torre?.serial ?? "",
        sistemaOperativo: s.sistemaOperativo ?? "",
        marca: torre?.marca ?? "",
      },
      software: [s.ofimatica, s.antivirus].filter(Boolean).join("\n"),
      pruebas: PRUEBAS_ENTREGA.map((prueba) => ({ prueba, resultado: "" as const })),
      tiempoEstimadoUso: "",
      observacion: "",
      entrega: { ...formato.elaborado },
      fechaEntrega: hoy,
      fechaRecibido: hoy,
    },
  };
}

export function precargarEgreso(entrada: {
  formato: FormatoImpreso;
  equipos: EquipoPrecarga[];
  destino?: string;
  hoy: string;
}): { activoIds: number[]; datos: DatosEgreso } {
  const { formato, equipos, destino, hoy } = entrada;
  return {
    activoIds: equipos.map((e) => e.id),
    datos: {
      formato,
      funcionarioTi: { ...formato.elaborado, correo: "", celular: "" },
      dispositivos: DISPOSITIVOS_EGRESO.map((dispositivo) => {
        const enviados = equiposDe(equipos, dispositivo);
        if (enviados.length === 0) {
          return { dispositivo, enviado: "" as const, cantidad: "", detalle: "" };
        }
        return {
          dispositivo,
          enviado: "si" as const,
          cantidad: String(enviados.length),
          detalle: enviados.map((e) => unir(e.codigo, e.marca, e.modelo)).join(", "),
        };
      }),
      detalleEnvio: destino ? `SE HACE SALIDA A ${destino}` : "",
      recibe: { nombre: "", cargo: "" },
      fechaSalida: hoy,
    },
  };
}

export function precargarBaja(entrada: {
  formato: FormatoImpreso;
  equipo: EquipoPrecarga;
  responsable: PersonaPrecarga | null;
  hoy: string;
}): DatosBaja {
  const { formato, equipo, responsable, hoy } = entrada;
  const s = specsPC(equipo);
  return {
    formato,
    responsable: responsableDe(responsable),
    equipo: {
      elemento: ETIQUETAS_TIPO[equipo.tipo].toUpperCase(),
      marca: equipo.marca ?? "",
      modelo: equipo.modelo ?? "",
      serial: equipo.serial ?? "",
      capacidadDisco: s.capacidadDisco ?? "",
      procesador: s.procesador ?? "",
      ram: s.ram ?? "",
      fechaCompra: equipo.fechaCompra ?? "",
      fechaBaja: hoy,
    },
    calificaciones: [],
    especificacion: "",
    diagnostico: { ...formato.elaborado },
    jefeArea: { nombre: "", cargo: "" },
  };
}

/** Acta de inducción nueva: la fecha de hoy y el formato vigente; lo demás lo escribe el usuario. */
export function precargarInduccion(entrada: { formato: FormatoImpreso; hoy: string }): DatosInduccion {
  return {
    formato: entrada.formato,
    fecha: entrada.hoy,
    hora: "",
    lugar: "",
    objetivo: "",
    proceso: "",
    responsables: "",
    asistentes: [],
    puntos: "",
    desarrollo: "",
  };
}
