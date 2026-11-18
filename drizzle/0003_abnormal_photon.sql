CREATE TABLE `actas_escaneos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`acta_id` integer NOT NULL,
	`nombre` text NOT NULL,
	`tipo` text NOT NULL,
	`tamano` integer NOT NULL,
	`contenido` blob NOT NULL,
	`subido_en` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`acta_id`) REFERENCES `actas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `actas_escaneos_acta_idx` ON `actas_escaneos` (`acta_id`);