/**
 * Arma la "Hoja de vida de equipos de cómputo" de un funcionario.
 * Función pura: recibe los datos ya consultados y devuelve exactamente los
 * textos que se imprimen, con las reglas de NO/NA del formato original.
 * La hoja no se guarda; se genera cada vez.
 */
import type {
  Activo,
  configuracion,
  Mantenimiento,
  SpecsImpresora,
  SpecsMonitor,
  SpecsPC,
  TIPOS_ACTIVO,
} from "@/db/schema";
import { ETIQUETAS_MANTENIMIENTO, ETIQUETAS_TIPO } from "@/lib/etiquetas";
import { fechaIsoLocal, formatearFecha } from "@/lib/fechas";
import { formatearPesos } from "@/lib/moneda";
import { esTipoPc } from "@/lib/validacion/activos";

type TipoActivo = (typeof TIPOS_ACTIVO)[number];
export type Configuracion = typeof configuracion.$inferSelect;

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

export type ActivoDeHoja = {
  activo: Activo;
  /** Inicio de la asignación vigente al funcionario. */
  fechaDesde: string;
  /** Fecha más reciente entre todas las asignaciones del activo (apertura o cierre). */
  ultimoMovimiento: string;
  mantenimientos: Mantenimiento[];
};

export type MovimientoHistorial = {
  codigo: string;
  tipo: TipoActivo;
  fechaDesde: string;
  fechaHasta: string | null;
  motivo: string | null;
};

export type DatosHojaDeVida = {
  funcionario: { nombre: string; telefono: string | null; ubicacion: string | null };
  configuracion: Configuracion | null;
  /** Activos con asignación vigente al funcionario. */
  vigentes: ActivoDeHoja[];
  /** Impresoras con asignación vigente a la ubicación del funcionario. */
  impresorasDeUbicacion: Activo[];
  /** Todas las asignaciones del funcionario, vigentes y cerradas. */
  historial: MovimientoHistorial[];
};

// ---------------------------------------------------------------------------
// Salida: solo textos, en el orden y con las etiquetas del formato
// ---------------------------------------------------------------------------

export type Firma = { nombre: string; cargo: string };

export type HojaDeVida = {
  encabezado: { codigo: string; version: string; fechaEmision: string };
  general: {
    pc: string;
    responsable: string;
    telefono: string;
    valor: string;
    fechaCompra: string;
    garantia: string;
    ubicacion: string;
    tipoComputador: string;
    fechaActualizacion: string;
  };
  bateria: { aplica: string; serial: string; estado: string };
  equipo: {
    marca: string;
    serial: string;
    color: string;
    modelo: string;
    unidadDisco: string;
    puertosUsb: string;
    disco: string;
    capacidad: string;
    ram: string;
    tipoRam: string;
    procesador: string;
    velocidad: string;
    tarjetaGrafica: string;
    graficaModelo: string;
    graficaCapacidad: string;
    wifi: string;
    tarjetaWifi: string;
    puertoRed: string;
    tarjetaSonido: string;
    sonidoModelo: string;
    board: string;
    sistemaOperativo: string;
    ofimatica: string;
    antivirus: string;
  };
  perifericos: Array<{ etiqueta: string; marca: string; modelo: string; serial: string }>;
  monitores: Array<{
    marca: string;
    modelo: string;
    tamano: string;
    color: string;
    tipo: string;
    serial: string;
  }>;
  impresora: {
    aplica: string;
    marca: string;
    modelo: string;
    serial: string;
    cableConexion: string;
    cableEnergia: string;
  };
  observaciones: string[];
  novedades: Array<{
    ultimaFecha: string;
    proximaFecha: string;
    tipo: string;
    observacion: string;
  }>;
  firmas: { elaborado: Firma; revisado: Firma; aprobado: Firma };
};

// ---------------------------------------------------------------------------
// Reglas de vacíos del formato original
// ---------------------------------------------------------------------------

const NO = "NO";
const NA = "NA";

/** Dato faltante de algo que existe: "NO" (p. ej. un teclado sin serial). */
function oNo(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return NO;
  const texto = String(valor).trim();
  return texto === "" ? NO : texto;
}

function siNo(valor: boolean | undefined | null): string {
  return valor ? "SI" : NO;
}

function fechaONo(fecha: string | null | undefined): string {
  return fecha ? formatearFecha(fecha) : NO;
}

function tipoEnMayusculas(tipo: TipoActivo): string {
  return ETIQUETAS_TIPO[tipo].toUpperCase();
}

/** "PC-014" → "14". */
function numeroDeCodigo(codigo: string): string {
  const coincidencia = /-(\d+)$/.exec(codigo);
  return coincidencia ? String(Number.parseInt(coincidencia[1], 10)) : codigo;
}

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------

function elegirPc(vigentes: ActivoDeHoja[]) {
  const pcs = vigentes
    .filter((v) => esTipoPc(v.activo.tipo))
    .sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde) || b.activo.id - a.activo.id);
  return { principal: pcs[0] ?? null, otros: pcs.slice(1) };
}

function encabezado(config: Configuracion | null): HojaDeVida["encabezado"] {
  return {
    codigo: config?.codigoFormato ?? "",
    version: config?.versionFormato ?? "",
    fechaEmision: config?.fechaEmision ? formatearFecha(config.fechaEmision) : "",
  };
}

function firmas(config: Configuracion | null): HojaDeVida["firmas"] {
  return {
    elaborado: { nombre: config?.elaboradoNombre ?? "", cargo: config?.elaboradoCargo ?? "" },
    revisado: { nombre: config?.revisadoNombre ?? "", cargo: config?.revisadoCargo ?? "" },
    aprobado: { nombre: config?.aprobadoNombre ?? "", cargo: config?.aprobadoCargo ?? "" },
  };
}

function general(
  funcionario: DatosHojaDeVida["funcionario"],
  pc: ActivoDeHoja | null,
): HojaDeVida["general"] {
  const comunes = {
    responsable: funcionario.nombre,
    telefono: oNo(funcionario.telefono),
    ubicacion: oNo(funcionario.ubicacion),
  };

  if (!pc) {
    return {
      ...comunes,
      pc: NA,
      valor: NA,
      fechaCompra: NA,
      garantia: NA,
      tipoComputador: NA,
      fechaActualizacion: NA,
    };
  }

  const edicion = fechaIsoLocal(pc.activo.actualizadoEn);
  const ultimaFecha = edicion > pc.ultimoMovimiento ? edicion : pc.ultimoMovimiento;

  return {
    ...comunes,
    pc: numeroDeCodigo(pc.activo.codigo),
    valor: pc.activo.valor != null ? formatearPesos(pc.activo.valor) : NO,
    fechaCompra: fechaONo(pc.activo.fechaCompra),
    garantia: fechaONo(pc.activo.garantiaHasta),
    tipoComputador: tipoEnMayusculas(pc.activo.tipo),
    fechaActualizacion: formatearFecha(ultimaFecha),
  };
}

function bateria(pc: ActivoDeHoja | null): HojaDeVida["bateria"] {
  if (!pc || pc.activo.tipo !== "portatil") {
    return { aplica: NA, serial: NA, estado: NA };
  }
  const datos = (pc.activo.specs as SpecsPC | null)?.bateria;
  return { aplica: "SI", serial: oNo(datos?.serial), estado: oNo(datos?.estado) };
}

function equipo(pc: ActivoDeHoja | null): HojaDeVida["equipo"] {
  if (!pc) {
    const campos: Array<keyof HojaDeVida["equipo"]> = [
      "marca", "serial", "color", "modelo", "unidadDisco", "puertosUsb", "disco",
      "capacidad", "ram", "tipoRam", "procesador", "velocidad", "tarjetaGrafica",
      "graficaModelo", "graficaCapacidad", "wifi", "tarjetaWifi", "puertoRed",
      "tarjetaSonido", "sonidoModelo", "board", "sistemaOperativo", "ofimatica", "antivirus",
    ];
    return Object.fromEntries(campos.map((c) => [c, NA])) as HojaDeVida["equipo"];
  }

  const { activo } = pc;
  const specs = (activo.specs ?? {}) as SpecsPC;
  const grafica = specs.tarjetaGrafica;

  return {
    marca: oNo(activo.marca),
    serial: oNo(activo.serial),
    color: oNo(activo.color),
    modelo: oNo(activo.modelo),
    unidadDisco: oNo(specs.unidadDisco),
    puertosUsb: oNo(specs.puertosUsb),
    disco: oNo(specs.unidadDisco),
    capacidad: oNo(specs.capacidadDisco),
    ram: oNo(specs.ram),
    tipoRam: oNo(specs.tipoRam),
    procesador: oNo(specs.procesador),
    velocidad: oNo(specs.velocidad),
    tarjetaGrafica: siNo(Boolean(grafica)),
    graficaModelo: grafica ? oNo(grafica.modelo) : NA,
    graficaCapacidad: grafica ? oNo(grafica.capacidad) : NA,
    wifi: siNo(Boolean(specs.tarjetaWifi)),
    tarjetaWifi: oNo(specs.tarjetaWifi),
    puertoRed: siNo(specs.puertoRed),
    tarjetaSonido: siNo(Boolean(specs.tarjetaSonido)),
    sonidoModelo: oNo(specs.tarjetaSonido),
    board: oNo(specs.board),
    sistemaOperativo: oNo(specs.sistemaOperativo),
    ofimatica: oNo(specs.ofimatica),
    antivirus: oNo(specs.antivirus),
  };
}

const PERIFERICOS: Array<{ tipo: TipoActivo; etiqueta: string }> = [
  { tipo: "parlantes", etiqueta: "PARLANTES" },
  { tipo: "teclado", etiqueta: "TECLADO" },
  { tipo: "mouse", etiqueta: "MOUSE" },
  { tipo: "audifonos", etiqueta: "AUDIFONOS" },
];

function perifericos(vigentes: ActivoDeHoja[]): HojaDeVida["perifericos"] {
  return PERIFERICOS.map(({ tipo, etiqueta }) => {
    const encontrado = vigentes.find((v) => v.activo.tipo === tipo)?.activo;
    return {
      etiqueta,
      marca: oNo(encontrado?.marca),
      modelo: oNo(encontrado?.modelo),
      serial: oNo(encontrado?.serial),
    };
  });
}

function monitores(vigentes: ActivoDeHoja[]): HojaDeVida["monitores"] {
  const lista = vigentes.filter((v) => v.activo.tipo === "monitor").map((v) => v.activo);
  const aBloque = (m: Activo | null) => {
    const specs = (m?.specs ?? {}) as SpecsMonitor;
    return {
      marca: oNo(m?.marca),
      modelo: oNo(m?.modelo),
      tamano: oNo(specs.tamano),
      color: oNo(m?.color),
      tipo: oNo(specs.tipo),
      serial: oNo(m?.serial),
    };
  };
  return lista.length > 0 ? lista.map(aBloque) : [aBloque(null)];
}

function impresora(
  vigentes: ActivoDeHoja[],
  deUbicacion: Activo[],
): HojaDeVida["impresora"] {
  const elegida =
    vigentes.find((v) => v.activo.tipo === "impresora")?.activo ?? deUbicacion[0] ?? null;

  if (!elegida) {
    return {
      aplica: NO,
      marca: NA,
      modelo: NA,
      serial: NA,
      cableConexion: NA,
      cableEnergia: NA,
    };
  }

  const specs = (elegida.specs ?? {}) as SpecsImpresora;
  return {
    aplica: "SI",
    marca: oNo(elegida.marca),
    modelo: oNo(elegida.modelo),
    serial: oNo(elegida.serial),
    cableConexion: siNo(specs.cableConexion),
    cableEnergia: siNo(specs.cableEnergia),
  };
}

/** Agrupa movimientos del mismo día, evento y motivo en una línea (asunción A3). */
function lineasDeHistorial(historial: MovimientoHistorial[]): string[] {
  type Evento = { fecha: string; accion: "RECIBE" | "ENTREGA"; equipo: string; motivo: string | null };

  const eventos: Evento[] = historial.flatMap((m) => {
    const equipo = `${m.codigo} (${tipoEnMayusculas(m.tipo)})`;
    const recibe: Evento = { fecha: m.fechaDesde, accion: "RECIBE", equipo, motivo: m.motivo };
    const entrega: Evento[] = m.fechaHasta
      ? [{ fecha: m.fechaHasta, accion: "ENTREGA", equipo, motivo: null }]
      : [];
    return [recibe, ...entrega];
  });

  // En un mismo día, primero lo que se entrega y luego lo que se recibe
  const ordenAccion = { ENTREGA: 0, RECIBE: 1 };
  eventos.sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || ordenAccion[a.accion] - ordenAccion[b.accion],
  );

  const grupos = new Map<string, Evento[]>();
  for (const evento of eventos) {
    const clave = `${evento.fecha}|${evento.accion}|${evento.motivo ?? ""}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), evento]);
  }

  return [...grupos.values()].map((grupo) => {
    const { fecha, accion, motivo } = grupo[0];
    const equipos = grupo.map((e) => e.equipo).join(", ");
    const sufijo = motivo ? `. MOTIVO: ${motivo.toUpperCase()}` : "";
    return `${formatearFecha(fecha)}: ${accion} ${equipos}${sufijo}`;
  });
}

function observaciones(
  historial: MovimientoHistorial[],
  pc: ActivoDeHoja | null,
  otrosPcs: ActivoDeHoja[],
): string[] {
  const delPc = (pc?.activo.observaciones ?? "")
    .split("\n")
    .map((linea) => linea.trim().toUpperCase())
    .filter(Boolean);
  const otros = otrosPcs.map(
    (o) => `TAMBIÉN TIENE ASIGNADO ${o.activo.codigo} (${tipoEnMayusculas(o.activo.tipo)})`,
  );
  return [...lineasDeHistorial(historial), ...delPc, ...otros];
}

function novedades(pc: ActivoDeHoja | null): HojaDeVida["novedades"] {
  const lista = [...(pc?.mantenimientos ?? [])].sort(
    (a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id,
  );
  if (lista.length === 0) {
    return [{ ultimaFecha: "", proximaFecha: "", tipo: "", observacion: "" }];
  }
  return lista.map((m) => ({
    ultimaFecha: formatearFecha(m.fecha),
    proximaFecha: m.proximaFecha ? formatearFecha(m.proximaFecha) : NA,
    tipo: ETIQUETAS_MANTENIMIENTO[m.tipo].toUpperCase(),
    observacion: m.observacion ?? "",
  }));
}

// ---------------------------------------------------------------------------

export function construirHojaDeVida(datos: DatosHojaDeVida): HojaDeVida {
  const { principal, otros } = elegirPc(datos.vigentes);

  return {
    encabezado: encabezado(datos.configuracion),
    general: general(datos.funcionario, principal),
    bateria: bateria(principal),
    equipo: equipo(principal),
    perifericos: perifericos(datos.vigentes),
    monitores: monitores(datos.vigentes),
    impresora: impresora(datos.vigentes, datos.impresorasDeUbicacion),
    observaciones: observaciones(datos.historial, principal, otros),
    novedades: novedades(principal),
    firmas: firmas(datos.configuracion),
  };
}
