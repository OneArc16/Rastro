import { sql } from "drizzle-orm";
import {
  blob,
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Listas de valores permitidos
// ---------------------------------------------------------------------------

export const TIPOS_ACTIVO = [
  "pc_mesa",
  "portatil",
  "todo_en_uno",
  "monitor",
  "teclado",
  "mouse",
  "impresora",
  "parlantes",
  "audifonos",
  "otro",
] as const;

// Estado físico del activo. Si está asignado o disponible NO se guarda aquí:
// se deduce de la tabla asignaciones (tiene o no una asignación vigente).
export const ESTADOS_ACTIVO = [
  "operativo",
  "en_reparacion",
  "dado_de_baja",
] as const;

export const TIPOS_MANTENIMIENTO = ["preventivo", "correctivo"] as const;

export const TIPOS_ACTA = ["entrega", "egreso", "baja"] as const;

// ---------------------------------------------------------------------------
// Especificaciones propias de cada tipo de activo (columna JSON "specs")
// ---------------------------------------------------------------------------

export type SpecsPC = {
  unidadDisco?: string; // SSD, HDD
  capacidadDisco?: string; // "512 GB"
  ram?: string; // "16 GB"
  tipoRam?: string; // "DDR4"
  procesador?: string; // "INTEL CORE I5 12400"
  velocidad?: string; // "2.50 GHz"
  puertosUsb?: number;
  tarjetaGrafica?: { modelo: string; capacidad?: string } | null;
  tarjetaWifi?: string | null;
  puertoRed?: boolean;
  tarjetaSonido?: string | null;
  board?: string; // "ASUS PRIME H610M-K"
  sistemaOperativo?: string; // "WINDOWS 11 PRO"
  ofimatica?: string; // "OFFICE - ADOBE"
  antivirus?: string; // "DEFENDER"
  bateria?: { serial?: string; estado?: string } | null; // solo portátiles
};

export type SpecsMonitor = {
  tamano?: string; // '22"'
  tipo?: string; // "LED"
};

export type SpecsImpresora = {
  cableConexion?: boolean;
  cableEnergia?: boolean;
};

export type Specs = SpecsPC | SpecsMonitor | SpecsImpresora | Record<string, unknown>;

// ---------------------------------------------------------------------------
// Tablas
// ---------------------------------------------------------------------------

export const ubicaciones = sqliteTable("ubicaciones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull().unique(), // "LINEA DE FRENTE 2do PISO"
});

export const funcionarios = sqliteTable(
  "funcionarios",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nombre: text("nombre").notNull(),
    cargo: text("cargo"),
    telefono: text("telefono"),
    correo: text("correo"),
    ubicacionId: integer("ubicacion_id").references(() => ubicaciones.id),
    // true cuando ya no trabaja en la empresa; no se borra para conservar el historial
    retirado: integer("retirado", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("funcionarios_ubicacion_idx").on(t.ubicacionId)],
);

export const activos = sqliteTable(
  "activos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // Código interno que va en la etiqueta/QR: "PC-014", "MON-0023"
    codigo: text("codigo").notNull().unique(),
    tipo: text("tipo", { enum: TIPOS_ACTIVO }).notNull(),
    marca: text("marca"),
    modelo: text("modelo"),
    serial: text("serial"), // muchos periféricos no tienen
    color: text("color"),
    estado: text("estado", { enum: ESTADOS_ACTIVO }).notNull().default("operativo"),
    valor: integer("valor"), // en pesos, sin decimales
    fechaCompra: text("fecha_compra"), // "AAAA-MM-DD"
    garantiaHasta: text("garantia_hasta"), // "AAAA-MM-DD"
    specs: text("specs", { mode: "json" }).$type<Specs>(),
    observaciones: text("observaciones"),
    creadoEn: integer("creado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    actualizadoEn: integer("actualizado_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("activos_tipo_idx").on(t.tipo),
    index("activos_estado_idx").on(t.estado),
  ],
);

export const asignaciones = sqliteTable(
  "asignaciones",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    activoId: integer("activo_id")
      .notNull()
      .references(() => activos.id),
    // Se llena uno de los dos: un funcionario, o una ubicación (equipos compartidos)
    funcionarioId: integer("funcionario_id").references(() => funcionarios.id),
    ubicacionId: integer("ubicacion_id").references(() => ubicaciones.id),
    fechaDesde: text("fecha_desde").notNull(), // "AAAA-MM-DD"
    fechaHasta: text("fecha_hasta"), // null = asignación vigente
    motivo: text("motivo"), // "Cambio de PC", "Traslado de monitor"...
  },
  (t) => [
    index("asignaciones_funcionario_idx").on(t.funcionarioId),
    index("asignaciones_ubicacion_idx").on(t.ubicacionId),
    // Un activo solo puede tener UNA asignación vigente a la vez
    uniqueIndex("asignaciones_vigente_unica")
      .on(t.activoId)
      .where(sql`${t.fechaHasta} is null`),
    // Exactamente uno: funcionario o ubicación
    check(
      "asignaciones_destino_check",
      sql`(${t.funcionarioId} is not null) <> (${t.ubicacionId} is not null)`,
    ),
  ],
);

export const mantenimientos = sqliteTable(
  "mantenimientos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    activoId: integer("activo_id")
      .notNull()
      .references(() => activos.id),
    fecha: text("fecha").notNull(), // "AAAA-MM-DD"
    proximaFecha: text("proxima_fecha"), // "AAAA-MM-DD"
    tipo: text("tipo", { enum: TIPOS_MANTENIMIENTO }).notNull(),
    observacion: text("observacion"),
  },
  (t) => [
    index("mantenimientos_activo_idx").on(t.activoId),
    index("mantenimientos_proxima_idx").on(t.proximaFecha),
  ],
);

// Una sola fila (id = 1) con los datos fijos que se imprimen en el PDF
export const configuracion = sqliteTable("configuracion", {
  id: integer("id").primaryKey(),
  codigoFormato: text("codigo_formato"),
  versionFormato: text("version_formato"),
  fechaEmision: text("fecha_emision"),
  elaboradoNombre: text("elaborado_nombre"),
  elaboradoCargo: text("elaborado_cargo"),
  revisadoNombre: text("revisado_nombre"),
  revisadoCargo: text("revisado_cargo"),
  aprobadoNombre: text("aprobado_nombre"),
  aprobadoCargo: text("aprobado_cargo"),
});

// Encabezado y pie de cada formato de acta (una fila por tipo). Si no hay fila,
// se usan los valores de los formatos aprobados (src/dominio/actas.ts).
export const formatosActa = sqliteTable("formatos_acta", {
  tipo: text("tipo", { enum: TIPOS_ACTA }).primaryKey(),
  codigo: text("codigo"),
  version: text("version"),
  fechaEmision: text("fecha_emision"),
  elaboradoNombre: text("elaborado_nombre"),
  elaboradoCargo: text("elaborado_cargo"),
  revisadoNombre: text("revisado_nombre"),
  revisadoCargo: text("revisado_cargo"),
  aprobadoNombre: text("aprobado_nombre"),
  aprobadoCargo: text("aprobado_cargo"),
});

// Actas de entrega, egreso y baja. "datos" es la copia fija de todo lo que se
// imprime: reimprimir muestra lo firmado aunque luego cambien los equipos.
export const actas = sqliteTable(
  "actas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tipo: text("tipo", { enum: TIPOS_ACTA }).notNull(),
    numero: integer("numero").notNull(), // consecutivo por tipo: ENT-0001
    fecha: text("fecha").notNull(), // "AAAA-MM-DD"
    // Para buscar: responsable de la entrega/baja o destino del egreso
    funcionarioId: integer("funcionario_id").references(() => funcionarios.id),
    ubicacionId: integer("ubicacion_id").references(() => ubicaciones.id),
    datos: text("datos", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
    creadaEn: integer("creada_en", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    editadaEn: integer("editada_en", { mode: "timestamp" }),
  },
  (t) => [
    uniqueIndex("actas_tipo_numero_unico").on(t.tipo, t.numero),
    index("actas_fecha_idx").on(t.fecha),
    index("actas_funcionario_idx").on(t.funcionarioId),
  ],
);

// Equipos que incluye cada acta (para buscarlas por código de equipo)
export const actasActivos = sqliteTable(
  "actas_activos",
  {
    actaId: integer("acta_id")
      .notNull()
      .references(() => actas.id),
    activoId: integer("activo_id")
      .notNull()
      .references(() => activos.id),
  },
  (t) => [
    uniqueIndex("actas_activos_unico").on(t.actaId, t.activoId),
    index("actas_activos_activo_idx").on(t.activoId),
  ],
);

// Versión anterior de un acta, guardada cada vez que se edita
export const actasVersiones = sqliteTable(
  "actas_versiones",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actaId: integer("acta_id")
      .notNull()
      .references(() => actas.id),
    fecha: text("fecha").notNull(),
    funcionarioId: integer("funcionario_id"),
    ubicacionId: integer("ubicacion_id"),
    activoIds: text("activo_ids", { mode: "json" }).notNull().$type<number[]>(),
    datos: text("datos", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
    // Cuándo dejó de ser la versión vigente
    reemplazadaEn: integer("reemplazada_en", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("actas_versiones_acta_idx").on(t.actaId)],
);

// Fotos del acta de baja (hasta MAXIMO_FOTOS). Sin versión: las del acta
// vigente; con versión: las que tenía esa versión anterior.
export const actasFotos = sqliteTable(
  "actas_fotos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actaId: integer("acta_id")
      .notNull()
      .references(() => actas.id),
    versionId: integer("version_id").references(() => actasVersiones.id),
    orden: integer("orden").notNull(),
    contenido: blob("contenido", { mode: "buffer" }).notNull(),
    tipo: text("tipo").notNull(), // "image/jpeg"
  },
  (t) => [index("actas_fotos_acta_idx").on(t.actaId, t.versionId)],
);

// ---------------------------------------------------------------------------
// Tipos para usar en el resto de la app
// ---------------------------------------------------------------------------

export type Ubicacion = typeof ubicaciones.$inferSelect;
export type Funcionario = typeof funcionarios.$inferSelect;
export type Activo = typeof activos.$inferSelect;
export type NuevoActivo = typeof activos.$inferInsert;
export type Asignacion = typeof asignaciones.$inferSelect;
export type Mantenimiento = typeof mantenimientos.$inferSelect;
export type TipoActa = (typeof TIPOS_ACTA)[number];
export type Acta = typeof actas.$inferSelect;
export type FormatoActa = typeof formatosActa.$inferSelect;
