CREATE TABLE `actas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo` text NOT NULL,
	`numero` integer NOT NULL,
	`fecha` text NOT NULL,
	`funcionario_id` integer,
	`ubicacion_id` integer,
	`datos` text NOT NULL,
	`foto` blob,
	`foto_tipo` text,
	`creada_en` integer DEFAULT (unixepoch()) NOT NULL,
	`editada_en` integer,
	FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicaciones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `actas_tipo_numero_unico` ON `actas` (`tipo`,`numero`);--> statement-breakpoint
CREATE INDEX `actas_fecha_idx` ON `actas` (`fecha`);--> statement-breakpoint
CREATE INDEX `actas_funcionario_idx` ON `actas` (`funcionario_id`);--> statement-breakpoint
CREATE TABLE `actas_activos` (
	`acta_id` integer NOT NULL,
	`activo_id` integer NOT NULL,
	FOREIGN KEY (`acta_id`) REFERENCES `actas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`activo_id`) REFERENCES `activos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `actas_activos_unico` ON `actas_activos` (`acta_id`,`activo_id`);--> statement-breakpoint
CREATE INDEX `actas_activos_activo_idx` ON `actas_activos` (`activo_id`);--> statement-breakpoint
CREATE TABLE `actas_versiones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`acta_id` integer NOT NULL,
	`fecha` text NOT NULL,
	`funcionario_id` integer,
	`ubicacion_id` integer,
	`activo_ids` text NOT NULL,
	`datos` text NOT NULL,
	`foto` blob,
	`foto_tipo` text,
	`reemplazada_en` integer NOT NULL,
	FOREIGN KEY (`acta_id`) REFERENCES `actas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `actas_versiones_acta_idx` ON `actas_versiones` (`acta_id`);--> statement-breakpoint
CREATE TABLE `formatos_acta` (
	`tipo` text PRIMARY KEY NOT NULL,
	`codigo` text,
	`version` text,
	`fecha_emision` text,
	`elaborado_nombre` text,
	`elaborado_cargo` text,
	`revisado_nombre` text,
	`revisado_cargo` text,
	`aprobado_nombre` text,
	`aprobado_cargo` text
);
--> statement-breakpoint
ALTER TABLE `funcionarios` ADD `correo` text;