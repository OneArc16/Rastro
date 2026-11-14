# Rastro — inventario de tecnología y hojas de vida de equipos

Este documento es el plan completo del proyecto. Léelo entero antes de escribir código.

## Cómo trabajar en este proyecto

- Avanza **una fase a la vez** (ver "Fases"). Al terminar cada fase, detente, resume lo que hiciste y espera confirmación antes de seguir.
- Antes de usar una librería, revisa su documentación actual; no asumas APIs de memoria.
- Toda la interfaz va en **español**. Los nombres del dominio en el código también (activos, funcionarios, asignaciones), igual que en el esquema.
- Si algo de este plan es ambiguo o contradice lo que encuentras, pregunta antes de decidir.

## Qué es

Aplicación web personal para llevar el inventario de equipos de tecnología de una empresa y generar la "Hoja de vida de equipos de cómputo" de cada funcionario en el formato que ya existe.

Hoy esto se lleva en Excel, con una hoja por PC. El problema: cuando a un funcionario se le cambia el PC, o un monitor pasa de una persona a otra, hay que editar varias hojas a mano y el historial termina como una nota suelta en "Observaciones".

## Contexto de uso

- **Un solo usuario** (el auxiliar de sistemas). No hay login, roles ni multiusuario.
- Corre **en el PC del usuario** y se accede también **desde el celular por la red Wi-Fi local**.
- Los datos **no salen de la máquina**: nada de servicios en la nube, analítica ni APIs externas.
- En el celular se usa recorriendo las oficinas, así que las pantallas deben funcionar bien en móvil.

## Stack

- **Next.js** (App Router) + **TypeScript**, última versión estable
- **Drizzle ORM** + **SQLite** (archivo local). Esquema validado con drizzle-orm 0.45 y drizzle-kit 0.31
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Table** para las listas con filtros
- **React Hook Form** + **Zod** para formularios (genera los esquemas Zod desde las tablas de Drizzle cuando sea posible)
- **qrcode** para las etiquetas
- Librería de Excel para la importación (se decide en la fase 6)

Fuera de alcance: autenticación, despliegue en internet, base de datos remota.

## Idea central del modelo

La hoja de vida **no se guarda, se genera**. Se guardan cuatro cosas independientes:

1. **Activos**: cada PC, monitor, teclado, mouse, impresora, etc. es un registro propio.
2. **Funcionarios**: las personas responsables.
3. **Asignaciones**: qué activo tiene quién (o qué ubicación), desde cuándo y hasta cuándo.
4. **Mantenimientos**: el historial de mantenimiento de cada activo.

El inventario es la lista de activos. La hoja de vida de un funcionario se arma en el momento con sus asignaciones vigentes.

## Reglas de negocio

- **Asignación vigente** = `fecha_hasta` es null. Un activo tiene como máximo una (lo garantiza un índice único parcial).
- Una asignación va a **un funcionario o a una ubicación**, nunca ambos ni ninguno (lo garantiza un CHECK). La ubicación se usa para equipos compartidos, como impresoras.
- **Disponible / asignado no se guarda**: se deduce de si el activo tiene asignación vigente. La columna `estado` es solo el estado físico (operativo, en reparación, dado de baja).
- **Trasladar** un activo = cerrar la asignación vigente y abrir una nueva, **en una sola transacción**. Nunca se edita la asignación anterior para cambiarle el responsable.
- **Nada se borra**: los funcionarios se marcan como `retirado` y los activos pasan a `dado_de_baja`, para conservar el historial. Al retirar un funcionario o dar de baja un activo, se cierran sus asignaciones vigentes.
- **Código interno** obligatorio y único por activo, con prefijo según el tipo y consecutivo: `PC-014`, `MON-0023`, `TEC-0005`, `MOU-0005`, `IMP-0002`. La app propone el siguiente consecutivo y el usuario puede cambiarlo. Es necesario porque muchos periféricos no tienen serial.
- **Fechas** como texto `AAAA-MM-DD`. Se muestran al usuario como `DD/MM/AAAA`.
- Las especificaciones propias de cada tipo de activo van en la columna JSON `specs`. El formulario de activo muestra campos distintos según el tipo.

## Esquema de base de datos

Este archivo ya está probado contra SQLite. Úsalo tal cual en `src/db/schema.ts`.

```ts
import { sql } from "drizzle-orm";
import {
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

// ---------------------------------------------------------------------------
// Tipos para usar en el resto de la app
// ---------------------------------------------------------------------------

export type Ubicacion = typeof ubicaciones.$inferSelect;
export type Funcionario = typeof funcionarios.$inferSelect;
export type Activo = typeof activos.$inferSelect;
export type NuevoActivo = typeof activos.$inferInsert;
export type Asignacion = typeof asignaciones.$inferSelect;
export type Mantenimiento = typeof mantenimientos.$inferSelect;
```

Notas de conexión:

- El archivo de la base va en `data/rastro.db` y debe estar en `.gitignore`.
- Activa `PRAGMA foreign_keys = ON` en cada conexión y usa modo WAL.
- Usa migraciones de drizzle-kit (`generate` + `migrate`), no `push`.
- Incluye un script de respaldo que copie el archivo de la base a `data/respaldos/` con la fecha en el nombre.

## Formato de la hoja de vida

El formato original estará en `docs/HOJAS_DE_VIDA_DE_PC.pdf`. **Ábrelo y respeta su diseño**: mismas secciones, mismo orden, mismas etiquetas, barras de título azules, tamaño carta. Es un formato aprobado y no se rediseña.

La hoja se genera **por funcionario**: su PC vigente más los demás activos que tiene asignados.

| Sección del formato | Campos | Origen |
|---|---|---|
| Encabezado | Logo, título "HOJA DE VIDA EQUIPOS DE COMPUTO", código, versión, fecha de emisión | `configuracion`; logo en `public/logo.png` |
| Información general | PC (número), responsable, teléfono, valor, fecha de compra, exp. de garantía, ubicación, tipo de computador, fecha de actualización | funcionario, su ubicación y su PC vigente. "Fecha de actualización" = fecha del último cambio en el PC o en sus asignaciones |
| Batería (en caso de portátiles) | Aplica, serial, estado | `specs.bateria` del PC |
| Información del equipo | Marca, serial, color, modelo, unidad de disco, puertos USB, disco, capacidad, cantidad RAM, tipo de RAM, procesador, velocidad, tarjeta gráfica (modelo, capacidad), wifi, tarjeta wifi, puerto de red, tarjeta de sonido (modelo), board, sistema operativo, herramientas ofimáticas, antivirus | activo PC y su `specs` |
| Periféricos | Parlantes, teclado, mouse, audífonos: marca, modelo, serial de cada uno | activos de esos tipos asignados al funcionario |
| Monitor | Marca, modelo, tamaño, color, tipo, serial | activo tipo monitor |
| Impresora | Aplica, marca, modelo, serial, cable de conexión, cable de energía | impresora asignada al funcionario o a su ubicación |
| Observaciones | Lista numerada | historial de asignaciones del funcionario (cambios de equipo, con fecha y motivo) más las observaciones del PC |
| Novedades | Bloques con última fecha, próxima fecha, tipo de mantenimiento y observación | `mantenimientos` del PC, los más recientes primero |
| Firmas | Elaborado por, revisado por, aprobado por (nombre y cargo) | `configuracion` |

Detalles:

- Los campos vacíos se imprimen como `NO` o `NA`, igual que en el original.
- Si el funcionario tiene más de un monitor, se repite el bloque de monitor.
- Primera versión: una página con estilos de impresión (`@media print`, tamaño carta) y un botón "Imprimir / Guardar PDF". La vista en pantalla debe ser idéntica a lo que se imprime.

## Pantallas

- **Inicio**: totales por tipo y estado, activos disponibles, mantenimientos próximos o vencidos, garantías por vencer.
- **Inventario**: tabla de activos con búsqueda y filtros por tipo, estado, ubicación, responsable y disponible/asignado.
- **Ficha de activo** (`/activos/[codigo]`): datos y especificaciones, responsable actual, historial de asignaciones, mantenimientos, QR. Acciones: asignar, trasladar, devolver, registrar mantenimiento, dar de baja.
- **Funcionarios**: lista y ficha con sus equipos vigentes, historial y el botón para generar la hoja de vida.
- **Ubicaciones**: lista con sus funcionarios y equipos compartidos.
- **Mantenimientos**: próximos y vencidos, con registro rápido.
- **Configuración**: datos del encabezado del formato y de las tres firmas.

## Fases

Cada fase termina con algo que se puede usar y probar.

1. **Base del proyecto**: crear el proyecto, conectar Drizzle + SQLite, aplicar la migración, layout con navegación y datos de ejemplo. *Listo cuando:* la app abre en el PC y en el celular por la red local y muestra los datos de ejemplo.
2. **Activos, funcionarios y ubicaciones**: listas, formularios de crear y editar (con campos de `specs` según el tipo), ficha de activo. *Listo cuando:* se puede registrar un PC completo con todos los campos del formato.
3. **Asignaciones**: asignar, trasladar y devolver, con historial en las fichas. *Listo cuando:* un cambio de PC entre dos funcionarios se hace en una operación y ambos quedan con sus equipos correctos.
4. **Hoja de vida**: vista e impresión en el formato original, más la pantalla de configuración. *Listo cuando:* la hoja impresa de un funcionario coincide con el PDF original.
5. **Mantenimientos e inicio**: registro, próximas fechas y el panel de inicio.
6. **Importación del Excel actual**: no empezar hasta que el usuario entregue un archivo de muestra; la estructura del Excel define cómo se importa.
7. **Etiquetas QR**: cada QR abre `/activos/[codigo]`. Hoja imprimible con varias etiquetas.

## Acceso desde el celular

- El servidor debe escuchar en todas las interfaces (`-H 0.0.0.0`), no solo en localhost.
- Para el uso diario: `next build` + `next start`. Si en modo desarrollo Next bloquea peticiones desde la IP de la red, configura los orígenes permitidos de desarrollo.
- La URL base para los QR va en una variable de entorno (`APP_BASE_URL`, por ejemplo `http://192.168.1.50:3000`). Conviene que el PC tenga IP fija.
- En Windows hay que permitir el puerto en el Firewall. Si el proyecto corre dentro de WSL2, el celular no lo alcanza por defecto: se necesita el modo de red "mirrored" de WSL o correr el proyecto con Node directamente en Windows. Explica al usuario las dos opciones cuando llegues a este punto.
