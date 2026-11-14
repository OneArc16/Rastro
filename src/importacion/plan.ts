/**
 * Plan de importación del Excel (fase 6): convierte las fichas leídas de cada
 * hoja en lo que hay que crear en la base. Función pura; aplicarla es otro paso.
 *
 * Reglas aprobadas por el usuario (odd/tasks/fase-6-importacion.md, P1-P8):
 * - Código desde el nombre de la hoja: "N" → PC-0NN (sede IPS), "NN DISP" → PC-1NN
 *   (dispensarios); otra hoja → siguiente número libre de IPS, sin asignar.
 * - Cada ubicación lleva su sede: "IPS - {área}", "DISPENSARIO {municipio} - {área}".
 * - Responsables que no son personas (turnos, consultorios, municipios) asignan
 *   el equipo a la ubicación.
 */
import type { Specs, SpecsImpresora, SpecsMonitor, SpecsPC, TIPOS_ACTIVO } from "@/db/schema";
import { siguienteCodigo } from "@/lib/codigos";
import { normalizar, type FichaExcel } from "./lectura";

type TipoActivo = (typeof TIPOS_ACTIVO)[number];

export type FilaResumenDispensario = {
  numero: number;
  municipio: string | null;
  area: string | null;
};

export type DestinoPlaneado =
  | { tipo: "funcionario"; clave: string }
  | { tipo: "ubicacion"; nombre: string };

export type ActivoPlaneado = {
  hoja: string;
  codigo: string;
  tipo: TipoActivo;
  marca: string | null;
  modelo: string | null;
  serial: string | null;
  color: string | null;
  valor: number | null;
  fechaCompra: string | null;
  garantiaHasta: string | null;
  specs: Specs | null;
  observaciones: string | null;
  /** null = queda disponible, sin asignar. */
  destino: DestinoPlaneado | null;
  fechaDesde: string;
};

export type Aviso = { hoja: string | null; mensaje: string };

export type PlanImportacion = {
  ubicaciones: string[];
  funcionarios: Array<{ clave: string; nombre: string; ubicacion: string | null }>;
  activos: ActivoPlaneado[];
  mantenimientos: Array<{
    codigoActivo: string;
    fecha: string;
    proximaFecha: string | null;
    tipo: "preventivo" | "correctivo";
    observacion: string | null;
  }>;
  avisos: Aviso[];
};

// ---------------------------------------------------------------------------
// Clasificación de hojas y códigos
// ---------------------------------------------------------------------------

type Sede = "ips" | "dispensario";
type HojaClasificada = { ficha: FichaExcel; sede: Sede | null; numero: number | null };

function clasificar(ficha: FichaExcel): HojaClasificada {
  const ips = /^(\d+)$/.exec(ficha.hoja.trim());
  if (ips) return { ficha, sede: "ips", numero: Number(ips[1]) };
  const dispensario = /^(\d+)\s*DISP$/i.exec(ficha.hoja.trim());
  if (dispensario) return { ficha, sede: "dispensario", numero: Number(dispensario[1]) };
  return { ficha, sede: null, numero: null };
}

/** Los dispensarios usan su propia serie a partir de PC-101 para no chocar con la IPS. */
const BASE_DISPENSARIOS = 100;

function codigoPc(numero: number): string {
  return `PC-${String(numero).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Textos
// ---------------------------------------------------------------------------

/** Nombre para mostrar: mayúsculas con espacios simples, conservando tildes. */
function enMayusculas(texto: string): string {
  return texto.toUpperCase().replace(/\s+/g, " ").trim();
}

/** Clave para detectar nombres escritos distinto (2D0/2DO, signos, espacios). */
function claveParecida(texto: string): string {
  return normalizar(texto).replace(/0/g, "O").replace(/[^A-Z0-9]/g, "");
}

function sinPrefijoDispensario(texto: string): string {
  return texto.replace(/^DISPENSARIO\s+/i, "");
}

const ROL_DE_TURNO = /^(MEDICO|AUXILIAR) DE TURNO$/;

// ---------------------------------------------------------------------------
// Destino de cada hoja
// ---------------------------------------------------------------------------

type Destino = {
  ubicacion: string | null;
  responsablePersona: string | null;
  avisos: string[];
};

function resolverDestino(
  { ficha, sede }: HojaClasificada & { sede: Sede },
  filaResumen: FilaResumenDispensario | undefined,
): Destino {
  const avisos: string[] = [];
  const responsable = ficha.responsable;
  const claveResponsable = responsable ? normalizar(responsable) : null;
  const ubicacionHoja = ficha.ubicacion;

  const nombresDelLugar = [ubicacionHoja, ubicacionHoja && sinPrefijoDispensario(ubicacionHoja)]
    .filter((n): n is string => Boolean(n))
    .map(normalizar);
  const municipio = filaResumen?.municipio ? normalizar(filaResumen.municipio) : null;

  const responsableEsLugar =
    claveResponsable !== null &&
    (claveResponsable.startsWith("CONSULTORIO") ||
      nombresDelLugar.includes(claveResponsable) ||
      (municipio !== null && claveResponsable.startsWith(municipio)));
  const responsableGenerico =
    claveResponsable === null || ROL_DE_TURNO.test(claveResponsable) || responsableEsLugar;

  const lugar = ubicacionHoja ?? (responsableEsLugar ? responsable : null);

  let ubicacion: string | null = null;
  if (sede === "ips") {
    ubicacion = lugar ? `IPS - ${enMayusculas(lugar)}` : null;
  } else if (filaResumen?.municipio) {
    const partes = [filaResumen.municipio, filaResumen.area].filter(Boolean).map((p) => enMayusculas(p as string));
    ubicacion = `DISPENSARIO ${partes.join(" - ")}`;
    const claveHoja = ubicacionHoja ? normalizar(ubicacionHoja) : null;
    const coincide =
      claveHoja === null ||
      claveHoja.includes(normalizar(filaResumen.municipio)) ||
      (filaResumen.area !== null && claveHoja.includes(normalizar(filaResumen.area)));
    if (!coincide) {
      avisos.push(
        `La hoja dice ubicación "${ubicacionHoja}" y el resumen dice ${partes.join(" - ")}; se usa el resumen.`,
      );
    }
  } else if (lugar) {
    ubicacion = `DISPENSARIO ${enMayusculas(sinPrefijoDispensario(lugar))}`;
  }

  if (responsableGenerico && ubicacion === null) {
    avisos.push(
      `El responsable "${responsable ?? ""}" no es una persona y la hoja no tiene ubicación: el equipo queda sin asignar.`,
    );
  }

  return {
    ubicacion,
    responsablePersona: responsableGenerico ? null : responsable,
    avisos,
  };
}

// ---------------------------------------------------------------------------
// Activos de cada hoja
// ---------------------------------------------------------------------------

function compactar<T extends object>(objeto: T): T | null {
  const entradas = Object.entries(objeto).filter(([, v]) => v !== null && v !== undefined);
  return entradas.length > 0 ? (Object.fromEntries(entradas) as T) : null;
}

function tipoDeComputador(ficha: FichaExcel, avisos: Aviso[]): TipoActivo {
  if (ficha.tipoComputador === null) return "pc_mesa";
  const texto = normalizar(ficha.tipoComputador);
  if (texto === "PORTATIL") return "portatil";
  if (texto === "TODO EN UNO") return "todo_en_uno";
  if (texto !== "PC DE MESA") {
    avisos.push({
      hoja: ficha.hoja,
      mensaje: `Tipo de computador "${ficha.tipoComputador}" desconocido: se importa como PC de mesa.`,
    });
  }
  return "pc_mesa";
}

function specsDePc(ficha: FichaExcel, tipo: TipoActivo): SpecsPC | null {
  const e = ficha.equipo;
  return compactar<SpecsPC>({
    unidadDisco: e.unidadDisco ?? undefined,
    capacidadDisco: e.capacidad ?? undefined,
    ram: e.ram ?? undefined,
    tipoRam: e.tipoRam ?? undefined,
    procesador: e.procesador ?? undefined,
    velocidad: e.velocidad ?? undefined,
    puertosUsb: e.puertosUsb ?? undefined,
    // El Excel a veces marca "SI" sin anotar el modelo: se conserva ese "SI"
    tarjetaGrafica: e.tarjetaGrafica
      ? { modelo: e.graficaModelo ?? "SI", ...(e.graficaCapacidad ? { capacidad: e.graficaCapacidad } : {}) }
      : undefined,
    tarjetaWifi: e.tarjetaWifi ?? (e.wifi ? "SI" : undefined),
    puertoRed: e.puertoRed ?? undefined,
    tarjetaSonido: e.sonidoModelo ?? (e.tarjetaSonido ? "SI" : undefined),
    board: e.board ?? undefined,
    sistemaOperativo: e.sistemaOperativo ?? undefined,
    ofimatica: e.ofimatica ?? undefined,
    antivirus: e.antivirus ?? undefined,
    bateria:
      tipo === "portatil" && ficha.bateria
        ? compactar({ serial: ficha.bateria.serial ?? undefined, estado: ficha.bateria.estado ?? undefined })
        : undefined,
  });
}

// ---------------------------------------------------------------------------

export function construirPlan(
  fichas: FichaExcel[],
  resumenDispensario: FilaResumenDispensario[],
  hoy: string,
): PlanImportacion {
  const clasificadas = fichas.map(clasificar);
  const porNumero = (a: HojaClasificada, b: HojaClasificada) => (a.numero as number) - (b.numero as number);
  const ips = clasificadas.filter((h) => h.sede === "ips").sort(porNumero);
  const dispensarios = clasificadas.filter((h) => h.sede === "dispensario").sort(porNumero);
  const otras = clasificadas.filter((h) => h.sede === null);

  const avisos: Aviso[] = fichas.flatMap((f) => f.avisos.map((mensaje) => ({ hoja: f.hoja, mensaje })));
  const ubicaciones: string[] = [];
  const funcionarios = new Map<string, { clave: string; nombre: string; ubicacion: string | null }>();
  const activos: ActivoPlaneado[] = [];
  const mantenimientos: PlanImportacion["mantenimientos"] = [];
  const codigos: string[] = [];

  const registrarUbicacion = (nombre: string | null) => {
    if (nombre && !ubicaciones.includes(nombre)) ubicaciones.push(nombre);
  };

  let siguienteLibre = Math.max(0, ...ips.map((h) => h.numero as number)) + 1;

  const procesar = (hoja: HojaClasificada) => {
    const { ficha } = hoja;
    let codigo: string;
    let destino: DestinoPlaneado | null = null;

    if (hoja.sede === null) {
      codigo = codigoPc(siguienteLibre++);
      avisos.push({
        hoja: ficha.hoja,
        mensaje: `La hoja "${ficha.hoja}" no sigue la numeración: se importa como ${codigo} sin asignar. Revisá a quién pertenece.`,
      });
    } else {
      const numero = hoja.numero as number;
      codigo = codigoPc(hoja.sede === "ips" ? numero : BASE_DISPENSARIOS + numero);
      const resolucion = resolverDestino(
        { ...hoja, sede: hoja.sede },
        hoja.sede === "dispensario" ? resumenDispensario.find((r) => r.numero === numero) : undefined,
      );
      avisos.push(...resolucion.avisos.map((mensaje) => ({ hoja: ficha.hoja, mensaje })));
      registrarUbicacion(resolucion.ubicacion);

      if (resolucion.responsablePersona) {
        const clave = normalizar(resolucion.responsablePersona);
        if (!funcionarios.has(clave)) {
          funcionarios.set(clave, {
            clave,
            nombre: enMayusculas(resolucion.responsablePersona),
            ubicacion: resolucion.ubicacion,
          });
        }
        destino = { tipo: "funcionario", clave };
      } else if (resolucion.ubicacion) {
        destino = { tipo: "ubicacion", nombre: resolucion.ubicacion };
      }
    }

    const fechaDesde = ficha.fechaActualizacion ?? ficha.fechaCompra ?? hoy;
    const comunes = { hoja: ficha.hoja, destino, fechaDesde, valor: null, fechaCompra: null, garantiaHasta: null, observaciones: null };
    const agregar = (activo: ActivoPlaneado) => {
      activos.push(activo);
      codigos.push(activo.codigo);
    };
    const siguiente = (tipo: TipoActivo) => siguienteCodigo(tipo, codigos);

    const tipoPc = tipoDeComputador(ficha, avisos);
    agregar({
      ...comunes,
      codigo,
      tipo: tipoPc,
      marca: ficha.equipo.marca,
      modelo: ficha.equipo.modelo,
      serial: ficha.equipo.serial,
      color: ficha.equipo.color,
      valor: ficha.valor,
      fechaCompra: ficha.fechaCompra,
      garantiaHasta: ficha.garantia,
      specs: specsDePc(ficha, tipoPc),
      observaciones: ficha.observaciones.length > 0 ? ficha.observaciones.join("\n") : null,
    });

    if (ficha.monitor) {
      const m = ficha.monitor;
      agregar({
        ...comunes,
        codigo: siguiente("monitor"),
        tipo: "monitor",
        marca: m.marca,
        modelo: m.modelo,
        serial: m.serial,
        color: m.color,
        specs: compactar<SpecsMonitor>({ tamano: m.tamano ?? undefined, tipo: m.tipo ?? undefined }),
      });
    }

    for (const p of ficha.perifericos) {
      agregar({
        ...comunes,
        codigo: siguiente(p.tipo),
        tipo: p.tipo,
        marca: p.marca,
        modelo: p.modelo,
        serial: p.serial,
        color: null,
        specs: null,
      });
    }

    if (ficha.impresora) {
      const i = ficha.impresora;
      agregar({
        ...comunes,
        codigo: siguiente("impresora"),
        tipo: "impresora",
        marca: i.marca,
        modelo: i.modelo,
        serial: i.serial,
        color: null,
        specs: { cableConexion: i.cableConexion, cableEnergia: i.cableEnergia } satisfies SpecsImpresora,
      });
    }

    for (const n of ficha.novedades) {
      mantenimientos.push({ codigoActivo: codigo, ...n });
    }
  };

  [...ips, ...dispensarios, ...otras].forEach(procesar);

  // Seriales repetidos entre activos distintos (copiar y pegar en el Excel)
  const porSerial = new Map<string, string[]>();
  for (const a of activos) {
    if (!a.serial) continue;
    const clave = normalizar(a.serial);
    porSerial.set(clave, [...(porSerial.get(clave) ?? []), a.codigo]);
  }
  for (const [, codigosRepetidos] of porSerial) {
    if (codigosRepetidos.length < 2) continue;
    const serial = activos.find((a) => a.codigo === codigosRepetidos[0])?.serial;
    avisos.push({
      hoja: null,
      mensaje: `El serial "${serial}" se repite en ${codigosRepetidos.join(", ")}. Revisá cuál es el correcto.`,
    });
  }

  // Ubicaciones que parecen la misma escrita distinto
  const parecidas = new Map<string, string[]>();
  for (const u of ubicaciones) {
    const clave = claveParecida(u);
    parecidas.set(clave, [...(parecidas.get(clave) ?? []), u]);
  }
  for (const [, grupo] of parecidas) {
    if (grupo.length < 2) continue;
    avisos.push({
      hoja: null,
      mensaje: `Ubicaciones que parecen la misma: ${grupo.map((u) => `"${u}"`).join(", ")}. Unilas a mano si corresponde.`,
    });
  }

  return {
    ubicaciones,
    funcionarios: [...funcionarios.values()],
    activos,
    mantenimientos,
    avisos,
  };
}
