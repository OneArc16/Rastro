CREATE TABLE `activos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`codigo` text NOT NULL,
	`tipo` text NOT NULL,
	`marca` text,
	`modelo` text,
	`serial` text,
	`color` text,
	`estado` text DEFAULT 'operativo' NOT NULL,
	`valor` integer,
	`fecha_compra` text,
	`garantia_hasta` text,
	`specs` text,
	`observaciones` text,
	`creado_en` integer DEFAULT (unixepoch()) NOT NULL,
	`actualizado_en` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activos_codigo_unique` ON `activos` (`codigo`);--> statement-breakpoint
CREATE INDEX `activos_tipo_idx` ON `activos` (`tipo`);--> statement-breakpoint
CREATE INDEX `activos_estado_idx` ON `activos` (`estado`);--> statement-breakpoint
CREATE TABLE `asignaciones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activo_id` integer NOT NULL,
	`funcionario_id` integer,
	`ubicacion_id` integer,
	`fecha_desde` text NOT NULL,
	`fecha_hasta` text,
	`motivo` text,
	FOREIGN KEY (`activo_id`) REFERENCES `activos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "asignaciones_destino_check" CHECK(("asignaciones"."funcionario_id" is not null) <> ("asignaciones"."ubicacion_id" is not null))
);
--> statement-breakpoint
CREATE INDEX `asignaciones_funcionario_idx` ON `asignaciones` (`funcionario_id`);--> statement-breakpoint
CREATE INDEX `asignaciones_ubicacion_idx` ON `asignaciones` (`ubicacion_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `asignaciones_vigente_unica` ON `asignaciones` (`activo_id`) WHERE "asignaciones"."fecha_hasta" is null;--> statement-breakpoint
CREATE TABLE `configuracion` (
	`id` integer PRIMARY KEY NOT NULL,
	`codigo_formato` text,
	`version_formato` text,
	`fecha_emision` text,
	`elaborado_nombre` text,
	`elaborado_cargo` text,
	`revisado_nombre` text,
	`revisado_cargo` text,
	`aprobado_nombre` text,
	`aprobado_cargo` text
);
--> statement-breakpoint
CREATE TABLE `funcionarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`cargo` text,
	`telefono` text,
	`ubicacion_id` integer,
	`retirado` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `funcionarios_ubicacion_idx` ON `funcionarios` (`ubicacion_id`);--> statement-breakpoint
CREATE TABLE `mantenimientos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activo_id` integer NOT NULL,
	`fecha` text NOT NULL,
	`proxima_fecha` text,
	`tipo` text NOT NULL,
	`observacion` text,
	FOREIGN KEY (`activo_id`) REFERENCES `activos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `mantenimientos_activo_idx` ON `mantenimientos` (`activo_id`);--> statement-breakpoint
CREATE INDEX `mantenimientos_proxima_idx` ON `mantenimientos` (`proxima_fecha`);--> statement-breakpoint
CREATE TABLE `ubicaciones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ubicaciones_nombre_unique` ON `ubicaciones` (`nombre`);