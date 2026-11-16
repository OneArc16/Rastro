/**
 * Reglas de las actas de entrega, egreso y baja.
 * Un acta guarda la copia fija de lo que se imprime; se puede editar, y cada
 * edición conserva la versión anterior para que el historial sea confiable.
 */
import { eq, inArray, max } from "drizzle-orm";
import type { Db } from "@/db";
import {
  actas,
  actasActivos,
  actasVersiones,
  activos,
  formatosActa,
  funcionarios,
  ubicaciones,
  type TipoActa,
} from "@/db/schema";
import {
  ESQUEMA_DATOS_POR_TIPO,
  MAXIMO_BYTES_FOTO,
  TIPOS_FOTO,
  type FormatoImpreso,
} from "@/lib/validacion/actas";
import { darDeBajaEn, llevarADestinoEn, type Tx } from "./asignaciones";
import { ErrorDeNegocio, validarFecha } from "./comunes";


export type Foto = { contenido: Buffer; tipo: string };

export type DatosActa = {
  tipo: TipoActa;
  fecha: string;
  funcionarioId?: number;
  ubicacionId?: number;
  activoIds: number[];
  datos: Record<string, unknown>;
};

const PREFIJOS: Record<TipoActa, string> = {
  entrega: "ENT",
  egreso: "EGR",
  baja: "BAJ",
};

export function codigoActa(tipo: TipoActa, numero: number) {
  return `${PREFIJOS[tipo]}-${String(numero).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Formatos (encabezado y pie)
// ---------------------------------------------------------------------------

const SIN_FIRMANTES = {
  elaborado: { nombre: "", cargo: "" },
  revisado: { nombre: "", cargo: "" },
  aprobado: { nombre: "", cargo: "" },
};

/** Código, versión y fecha de emisión de los formatos aprobados (docs/). */
export const FORMATOS_PREDETERMINADOS: Record<TipoActa, FormatoImpreso> = {
  entrega: { codigo: "F-SIS-002", version: "003", fechaEmision: "2025-05-15", ...SIN_FIRMANTES },
  egreso: { codigo: "F-SIS-001", version: "002", fechaEmision: "2022-02-23", ...SIN_FIRMANTES },
  baja: { codigo: "FCOM-01", version: "002", fechaEmision: "2019-06-05", ...SIN_FIRMANTES },
};

export function obtenerFormatoActa(db: Db | Tx, tipo: TipoActa): FormatoImpreso {
  const fila = db.select().from(formatosActa).where(eq(formatosActa.tipo, tipo)).get();
  if (!fila) return FORMATOS_PREDETERMINADOS[tipo];
  return {
    codigo: fila.codigo ?? "",
    version: fila.version ?? "",
    fechaEmision: fila.fechaEmision ?? "",
    elaborado: { nombre: fila.elaboradoNombre ?? "", cargo: fila.elaboradoCargo ?? "" },
    revisado: { nombre: fila.revisadoNombre ?? "", cargo: fila.revisadoCargo ?? "" },
    aprobado: { nombre: fila.aprobadoNombre ?? "", cargo: fila.aprobadoCargo ?? "" },
  };
}

export function guardarFormatoActa(db: Db, tipo: TipoActa, formato: FormatoImpreso) {
  const valores = {
    codigo: formato.codigo,
    version: formato.version,
    fechaEmision: formato.fechaEmision,
    elaboradoNombre: formato.elaborado.nombre,
    elaboradoCargo: formato.elaborado.cargo,
    revisadoNombre: formato.revisado.nombre,
    revisadoCargo: formato.revisado.cargo,
    aprobadoNombre: formato.aprobado.nombre,
    aprobadoCargo: formato.aprobado.cargo,
  };
  db.insert(formatosActa)
    .values({ tipo, ...valores })
    .onConflictDoUpdate({ target: formatosActa.tipo, set: valores })
    .run();
}

// ---------------------------------------------------------------------------
// Validaciones internas
// ---------------------------------------------------------------------------

function validarReferencias(tx: Tx, datos: DatosActa) {
  validarFecha(datos.fecha);

  if (datos.funcionarioId !== undefined) {
    const existe = tx
      .select({ id: funcionarios.id })
      .from(funcionarios)
      .where(eq(funcionarios.id, datos.funcionarioId))
      .get();
    if (!existe) throw new ErrorDeNegocio("El funcionario no existe");
  }

  if (datos.ubicacionId !== undefined) {
    const existe = tx
      .select({ id: ubicaciones.id })
      .from(ubicaciones)
      .where(eq(ubicaciones.id, datos.ubicacionId))
      .get();
    if (!existe) throw new ErrorDeNegocio("La ubicación no existe");
  }

  const unicos = [...new Set(datos.activoIds)];
  if (unicos.length > 0) {
    const encontrados = tx
      .select({ id: activos.id })
      .from(activos)
      .where(inArray(activos.id, unicos))
      .all();
    if (encontrados.length !== unicos.length) {
      throw new ErrorDeNegocio("Uno de los equipos no existe");
    }
  }
  return unicos;
}

/** Devuelve el contenido validado con el esquema de su tipo de acta. */
function validarContenido(tipo: TipoActa, datos: Record<string, unknown>) {
  const resultado = ESQUEMA_DATOS_POR_TIPO[tipo].safeParse(datos);
  if (!resultado.success) throw new ErrorDeNegocio("El contenido del acta no es válido");
  return resultado.data as Record<string, unknown>;
}

/** Primeros bytes de cada tipo de imagen permitido. */
function esImagenDelTipo(contenido: Buffer, tipo: string) {
  switch (tipo) {
    case "image/jpeg":
      return contenido.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    case "image/png":
      return contenido.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/webp":
      return (
        contenido.subarray(0, 4).toString("latin1") === "RIFF" &&
        contenido.subarray(8, 12).toString("latin1") === "WEBP"
      );
    default:
      return false;
  }
}

function validarFoto(foto: Foto) {
  if (!(TIPOS_FOTO as readonly string[]).includes(foto.tipo)) {
    throw new ErrorDeNegocio("La foto debe ser JPG, PNG o WEBP");
  }
  if (foto.contenido.length > MAXIMO_BYTES_FOTO) {
    throw new ErrorDeNegocio("La foto es demasiado grande");
  }
  if (!esImagenDelTipo(foto.contenido, foto.tipo)) {
    throw new ErrorDeNegocio("El archivo no es una imagen válida");
  }
}

function guardarEquipos(tx: Tx, actaId: number, activoIds: number[]) {
  tx.delete(actasActivos).where(eq(actasActivos.actaId, actaId)).run();
  if (activoIds.length === 0) return;
  tx.insert(actasActivos)
    .values(activoIds.map((activoId) => ({ actaId, activoId })))
    .run();
}

// ---------------------------------------------------------------------------
// Operaciones
// ---------------------------------------------------------------------------

/**
 * Crea el acta dentro de una transacción ya abierta, para que otras
 * operaciones (dar de baja, trasladar) queden en el mismo todo o nada.
 */
function crearActaEn(tx: Tx, datos: DatosActa & { foto?: Foto }) {
  const contenido = validarContenido(datos.tipo, datos.datos);
  const activoIds = validarReferencias(tx, datos);
  if (datos.foto) validarFoto(datos.foto);

  const ultimo = tx
    .select({ numero: max(actas.numero) })
    .from(actas)
    .where(eq(actas.tipo, datos.tipo))
    .get();
  const numero = (ultimo?.numero ?? 0) + 1;

  const { id } = tx
    .insert(actas)
    .values({
      tipo: datos.tipo,
      numero,
      fecha: datos.fecha,
      funcionarioId: datos.funcionarioId ?? null,
      ubicacionId: datos.ubicacionId ?? null,
      datos: contenido,
      foto: datos.foto?.contenido ?? null,
      fotoTipo: datos.foto?.tipo ?? null,
    })
    .returning({ id: actas.id })
    .get();
  guardarEquipos(tx, id, activoIds);

  return { id, codigo: codigoActa(datos.tipo, numero) };
}

/**
 * Acta de entrega: no cambia asignaciones. La baja y el egreso se crean con
 * crearActaDeBaja y crearActaDeEgreso, que también cambian los equipos.
 */
export function crearActa(db: Db, datos: DatosActa & { tipo: "entrega"; foto?: Foto }) {
  return db.transaction((tx) => crearActaEn(tx, datos));
}

/**
 * Reemplaza el contenido del acta y guarda el anterior como versión.
 * Es una corrección del documento: no vuelve a trasladar equipos.
 * foto: undefined la conserva, null la quita, un valor la reemplaza.
 */
export function editarActa(
  db: Db,
  datos: Omit<DatosActa, "tipo"> & { id: number; tipo?: TipoActa; foto?: Foto | null },
) {
  db.transaction((tx) => {
    const actual = tx.select().from(actas).where(eq(actas.id, datos.id)).get();
    if (!actual) throw new ErrorDeNegocio("El acta no existe");
    if (datos.tipo !== undefined && datos.tipo !== actual.tipo) {
      throw new ErrorDeNegocio("No se puede cambiar el tipo de un acta");
    }
    const contenido = validarContenido(actual.tipo, datos.datos);
    const activoIds = validarReferencias(tx, { ...datos, tipo: actual.tipo });
    if (datos.foto) validarFoto(datos.foto);

    const equiposAnteriores = tx
      .select({ activoId: actasActivos.activoId })
      .from(actasActivos)
      .where(eq(actasActivos.actaId, actual.id))
      .all()
      .map((fila) => fila.activoId);
    // El equipo de una baja ya quedó dado de baja al crearla: cambiarlo dejaría
    // un acta que no corresponde al estado real de los equipos.
    const mismosEquipos =
      activoIds.length === equiposAnteriores.length &&
      activoIds.every((activoId) => equiposAnteriores.includes(activoId));
    if (actual.tipo === "baja" && !mismosEquipos) {
      throw new ErrorDeNegocio("No se puede cambiar el equipo de un acta de baja");
    }

    const ahora = new Date();
    tx.insert(actasVersiones)
      .values({
        actaId: actual.id,
        fecha: actual.fecha,
        funcionarioId: actual.funcionarioId,
        ubicacionId: actual.ubicacionId,
        activoIds: equiposAnteriores,
        datos: actual.datos,
        foto: actual.foto,
        fotoTipo: actual.fotoTipo,
        reemplazadaEn: ahora,
      })
      .run();

    const foto =
      datos.foto === undefined
        ? {}
        : { foto: datos.foto?.contenido ?? null, fotoTipo: datos.foto?.tipo ?? null };
    tx.update(actas)
      .set({
        fecha: datos.fecha,
        funcionarioId: datos.funcionarioId ?? null,
        ubicacionId: datos.ubicacionId ?? null,
        datos: contenido,
        editadaEn: ahora,
        ...foto,
      })
      .where(eq(actas.id, actual.id))
      .run();
    guardarEquipos(tx, actual.id, activoIds);
  });
}

// ---------------------------------------------------------------------------
// Actas que además cambian el estado de los equipos (todo o nada)
// ---------------------------------------------------------------------------

/** Guarda el acta de baja y da de baja el equipo, si aún no lo está. */
export function crearActaDeBaja(
  db: Db,
  datos: Omit<DatosActa, "tipo" | "activoIds"> & { activoId: number; foto?: Foto },
) {
  return db.transaction((tx) => {
    const acta = crearActaEn(tx, { ...datos, tipo: "baja", activoIds: [datos.activoId] });
    const equipo = tx
      .select({ estado: activos.estado })
      .from(activos)
      .where(eq(activos.id, datos.activoId))
      .get();
    if (equipo?.estado !== "dado_de_baja") {
      darDeBajaEn(tx, {
        activoId: datos.activoId,
        fecha: datos.fecha,
        motivo: `acta ${acta.codigo}`,
      });
    }
    return acta;
  });
}

/** Guarda el acta de egreso y, si se pide, deja los equipos en la ubicación de destino. */
export function crearActaDeEgreso(
  db: Db,
  datos: Omit<DatosActa, "tipo"> & { trasladar: boolean },
) {
  if (datos.trasladar && datos.ubicacionId === undefined) {
    throw new ErrorDeNegocio("Elija la ubicación de destino para trasladar los equipos");
  }
  return db.transaction((tx) => {
    const acta = crearActaEn(tx, { ...datos, tipo: "egreso" });
    if (datos.trasladar) {
      for (const activoId of new Set(datos.activoIds)) {
        llevarADestinoEn(tx, {
          activoId,
          destino: { ubicacionId: datos.ubicacionId as number },
          fecha: datos.fecha,
          motivo: `Egreso acta ${acta.codigo}`,
        });
      }
    }
    return acta;
  });
}
