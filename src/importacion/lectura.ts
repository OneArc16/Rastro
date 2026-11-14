/**
 * Lectura de una hoja de PC del Excel original ("HOJAS DE VIDA DE PC.xlsx").
 * Función pura: recibe las celdas crudas de una hoja y devuelve sus datos
 * limpios, más los avisos de lo que no se pudo leer tal cual.
 *
 * Las 68 hojas del archivo tienen sus etiquetas en las mismas celdas, así que
 * los datos se leen por posición. Las observaciones y los mantenimientos se
 * ubican por la etiqueta "ULTIMA FECHA", porque una hoja está corrida una fila.
 */
import { formatearFecha } from "@/lib/fechas";

export type ValorCelda = string | number | Date;

export type HojaCruda = { nombre: string; celdas: Record<string, ValorCelda> };

export type TipoPeriferico = "parlantes" | "teclado" | "mouse" | "audifonos";

export type FichaExcel = {
  hoja: string;
  responsable: string | null;
  telefono: string | null;
  valor: number | null;
  fechaCompra: string | null;
  garantia: string | null;
  ubicacion: string | null;
  tipoComputador: string | null;
  fechaActualizacion: string | null;
  bateria: { serial: string | null; estado: string | null } | null;
  equipo: {
    marca: string | null;
    serial: string | null;
    color: string | null;
    modelo: string | null;
    unidadDisco: string | null;
    puertosUsb: number | null;
    capacidad: string | null;
    ram: string | null;
    tipoRam: string | null;
    procesador: string | null;
    velocidad: string | null;
    tarjetaGrafica: boolean;
    graficaModelo: string | null;
    graficaCapacidad: string | null;
    wifi: boolean;
    tarjetaWifi: string | null;
    puertoRed: boolean | null;
    tarjetaSonido: boolean;
    sonidoModelo: string | null;
    board: string | null;
    sistemaOperativo: string | null;
    ofimatica: string | null;
    antivirus: string | null;
  };
  perifericos: Array<{
    tipo: TipoPeriferico;
    marca: string;
    modelo: string | null;
    serial: string | null;
  }>;
  monitor: {
    marca: string | null;
    modelo: string | null;
    tamano: string | null;
    color: string | null;
    tipo: string | null;
    serial: string | null;
  } | null;
  impresora: {
    marca: string | null;
    modelo: string | null;
    serial: string | null;
    cableConexion: boolean;
    cableEnergia: boolean;
  } | null;
  observaciones: string[];
  novedades: Array<{
    fecha: string;
    proximaFecha: string | null;
    tipo: "preventivo" | "correctivo";
    observacion: string | null;
  }>;
  avisos: string[];
};

// ---------------------------------------------------------------------------
// Limpieza de valores
// ---------------------------------------------------------------------------

/** Textos que en el Excel significan "no hay dato". */
const SIN_DATO = new Set(["", "NO", "NA", "N/A", "NO TIENE", "NINGUNO", "-", "&"]);

/** Mayúsculas, sin tildes y con espacios simples: para comparar textos. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function comoTexto(valor: ValorCelda | undefined): string {
  if (valor === undefined) return "";
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return String(valor).replace(/\s+/g, " ").trim();
}

/** Texto útil de la celda, o null si está vacía o dice NO/NA/NO TIENE. */
function dato(valor: ValorCelda | undefined): string | null {
  const texto = comoTexto(valor);
  return SIN_DATO.has(normalizar(texto)) ? null : texto;
}

/** Igual que `dato`, pero un "SI" tampoco cuenta como dato (p. ej. el modelo de la tarjeta wifi). */
function detalle(valor: ValorCelda | undefined): string | null {
  const texto = dato(valor);
  return texto !== null && normalizar(texto) === "SI" ? null : texto;
}

function siNo(valor: ValorCelda | undefined): boolean | null {
  const texto = normalizar(comoTexto(valor));
  if (texto === "SI") return true;
  if (texto === "NO") return false;
  return null;
}

function entero(valor: ValorCelda | undefined): number | null {
  if (typeof valor === "number") return Math.round(valor);
  const digitos = (dato(valor) ?? "").replace(/\D/g, "");
  return digitos ? Number.parseInt(digitos, 10) : null;
}

function esFechaReal(anio: number, mes: number, dia: number): boolean {
  const f = new Date(Date.UTC(anio, mes - 1, dia));
  return f.getUTCFullYear() === anio && f.getUTCMonth() === mes - 1 && f.getUTCDate() === dia;
}

function iso(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

type Fecha = { iso: string } | { ilegible: string } | null;

/** Fecha real de Excel, número de serie, "DD/MM/AAAA", "DD-MM-AAAA" o "AAAA-MM-DD". */
function leerFecha(valor: ValorCelda | undefined): Fecha {
  if (valor instanceof Date) return { iso: valor.toISOString().slice(0, 10) };
  if (typeof valor === "number" && valor > 20000) {
    // Número de serie de Excel: días desde el 30/12/1899
    const f = new Date(Date.UTC(1899, 11, 30) + Math.round(valor) * 86_400_000);
    return { iso: f.toISOString().slice(0, 10) };
  }

  const texto = dato(valor);
  if (texto === null) return null;

  const dma = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(texto);
  if (dma) {
    const [dia, mes, anio] = [Number(dma[1]), Number(dma[2]), Number(dma[3])];
    return esFechaReal(anio, mes, dia) ? { iso: iso(anio, mes, dia) } : { ilegible: texto };
  }
  const amd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (amd) {
    const [anio, mes, dia] = [Number(amd[1]), Number(amd[2]), Number(amd[3])];
    return esFechaReal(anio, mes, dia) ? { iso: iso(anio, mes, dia) } : { ilegible: texto };
  }
  return { ilegible: texto };
}

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------

const FILAS_PERIFERICOS: Array<[number, TipoPeriferico]> = [
  [24, "parlantes"],
  [25, "teclado"],
  [26, "mouse"],
  [27, "audifonos"],
];

/** Las observaciones empiezan después del bloque de impresora. */
const PRIMERA_FILA_OBSERVACIONES = 42;
const ULTIMA_FILA_A_REVISAR = 90;

/** Quita la numeración ("1.", "2)", "3-") y devuelve el número si lo había. */
function separarNumeracion(linea: string): { numero: number | null; texto: string } {
  const coincidencia = /^(\d+)\s*[.)-]\s*([\s\S]*)$/.exec(linea);
  return coincidencia
    ? { numero: Number(coincidencia[1]), texto: coincidencia[2].trim() }
    : { numero: null, texto: linea };
}

function ordenarObservaciones(lineas: string[]): string[] {
  const separadas = lineas.map(separarNumeracion);
  const todasNumeradas = separadas.every((l) => l.numero !== null);
  if (todasNumeradas) {
    separadas.sort((a, b) => (a.numero as number) - (b.numero as number));
  }
  return separadas.map((l) => l.texto).filter(Boolean);
}

export function leerHoja({ nombre, celdas }: HojaCruda): FichaExcel {
  const c = (direccion: string) => celdas[direccion];
  const avisos: string[] = [];

  const fechaDeCabecera = (direccion: string, etiqueta: string): string | null => {
    const fecha = leerFecha(c(direccion));
    if (fecha && "ilegible" in fecha) {
      avisos.push(`${etiqueta} "${fecha.ilegible}" ilegible: se importa sin ese dato.`);
      return null;
    }
    return fecha?.iso ?? null;
  };

  const numeroEnCelda = comoTexto(c("B6"));
  if (numeroEnCelda && normalizar(numeroEnCelda) !== normalizar(nombre)) {
    avisos.push(
      `La celda PC dice "${numeroEnCelda}" pero la hoja se llama "${nombre}"; se usa el nombre de la hoja.`,
    );
  }

  const perifericos = FILAS_PERIFERICOS.flatMap(([fila, tipo]) => {
    const marca = dato(c(`B${fila}`));
    return marca
      ? [{ tipo, marca, modelo: dato(c(`D${fila}`)), serial: dato(c(`F${fila}`)) }]
      : [];
  });

  const monitor = {
    marca: dato(c("B35")),
    modelo: dato(c("D35")),
    tamano: dato(c("F35")),
    color: dato(c("B36")),
    tipo: dato(c("D36")),
    serial: dato(c("F36")),
  };
  const hayMonitor = monitor.marca !== null || monitor.modelo !== null || monitor.serial !== null;

  // Observaciones: texto de la columna A hasta la primera "ULTIMA FECHA"
  const filasNovedad: number[] = [];
  for (let fila = PRIMERA_FILA_OBSERVACIONES; fila <= ULTIMA_FILA_A_REVISAR; fila++) {
    if (normalizar(comoTexto(c(`A${fila}`))) === "ULTIMA FECHA") filasNovedad.push(fila);
  }
  const finObservaciones = filasNovedad[0] ?? ULTIMA_FILA_A_REVISAR + 1;
  const lineas: string[] = [];
  for (let fila = PRIMERA_FILA_OBSERVACIONES; fila < finObservaciones; fila++) {
    const texto = dato(c(`A${fila}`));
    if (texto) lineas.push(texto);
  }

  const novedades: FichaExcel["novedades"] = [];
  for (const fila of filasNovedad) {
    const valorFecha = c(`B${fila}`);
    const valorTipo = dato(c(`F${fila}`));
    const fecha = leerFecha(valorFecha);
    const proxima = leerFecha(c(`D${fila}`));

    if (fecha === null && proxima === null && valorTipo === null) continue; // bloque vacío
    if (fecha === null || "ilegible" in fecha) {
      avisos.push(
        fecha === null
          ? "Mantenimiento sin fecha: no se importa."
          : `Mantenimiento con fecha "${fecha.ilegible}" ilegible: no se importa.`,
      );
      continue;
    }

    const delDia = `Mantenimiento del ${formatearFecha(fecha.iso)}`;
    let proximaFecha: string | null = null;
    if (proxima && "ilegible" in proxima) {
      avisos.push(`${delDia}: la próxima fecha "${proxima.ilegible}" no es una fecha válida; se importa sin próxima fecha.`);
    } else if (proxima && proxima.iso <= fecha.iso) {
      avisos.push(`${delDia}: la próxima fecha ${formatearFecha(proxima.iso)} no es posterior; se importa sin próxima fecha.`);
    } else if (proxima) {
      proximaFecha = proxima.iso;
    }

    let tipo: "preventivo" | "correctivo" = "preventivo";
    const tipoNormalizado = normalizar(valorTipo ?? "");
    if (tipoNormalizado === "CORRECTIVO") tipo = "correctivo";
    else if (tipoNormalizado !== "PREVENTIVO") {
      avisos.push(`${delDia}: tipo "${valorTipo ?? ""}" desconocido; se importa como preventivo.`);
    }

    const textoObservacion = comoTexto(c(`A${fila + 1}`)).replace(/^OBSERVACI[OÓ]N:\s*/i, "");
    novedades.push({
      fecha: fecha.iso,
      proximaFecha,
      tipo,
      observacion: dato(textoObservacion),
    });
  }

  return {
    hoja: nombre,
    responsable: dato(c("D6")),
    telefono: dato(c("F6")),
    valor: entero(c("B7")),
    fechaCompra: fechaDeCabecera("D7", "Fecha de compra"),
    garantia: fechaDeCabecera("F7", "Fecha de garantía"),
    ubicacion: dato(c("B8")),
    tipoComputador: dato(c("D8")),
    fechaActualizacion: fechaDeCabecera("F8", "Fecha de actualización"),
    bateria:
      siNo(c("B11")) === true ? { serial: dato(c("D11")), estado: dato(c("F11")) } : null,
    equipo: {
      marca: dato(c("B14")),
      serial: dato(c("D14")),
      color: dato(c("F14")),
      modelo: dato(c("B15")),
      unidadDisco: dato(c("D15")),
      puertosUsb: entero(c("F15")),
      capacidad: dato(c("D16")),
      ram: dato(c("F16")),
      tipoRam: dato(c("B17")),
      procesador: dato(c("D17")),
      velocidad: dato(c("F17")),
      tarjetaGrafica: siNo(c("B18")) === true,
      graficaModelo: detalle(c("D18")),
      graficaCapacidad: detalle(c("F18")),
      wifi: siNo(c("B19")) === true,
      tarjetaWifi: detalle(c("D19")),
      puertoRed: siNo(c("F19")),
      tarjetaSonido: siNo(c("B20")) === true,
      sonidoModelo: detalle(c("D20")),
      board: dato(c("F20")),
      sistemaOperativo: dato(c("B21")),
      ofimatica: dato(c("D21")),
      antivirus: dato(c("F21")),
    },
    perifericos,
    monitor: hayMonitor ? monitor : null,
    impresora:
      siNo(c("B39")) === true
        ? {
            marca: dato(c("D39")),
            modelo: dato(c("F39")),
            serial: dato(c("B40")),
            cableConexion: siNo(c("D40")) === true,
            cableEnergia: siNo(c("F40")) === true,
          }
        : null,
    observaciones: ordenarObservaciones(lineas),
    novedades,
    avisos,
  };
}
