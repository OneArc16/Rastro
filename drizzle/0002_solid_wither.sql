CREATE TABLE `actas_fotos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`acta_id` integer NOT NULL,
	`version_id` integer,
	`orden` integer NOT NULL,
	`contenido` blob NOT NULL,
	`tipo` text NOT NULL,
	FOREIGN KEY (`acta_id`) REFERENCES `actas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`version_id`) REFERENCES `actas_versiones`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `actas_fotos_acta_idx` ON `actas_fotos` (`acta_id`,`version_id`);--> statement-breakpoint
-- Move existing photos (current act and previous versions) before dropping the old columns.
INSERT INTO `actas_fotos` (`acta_id`, `version_id`, `orden`, `contenido`, `tipo`)
SELECT `id`, NULL, 1, `foto`, `foto_tipo` FROM `actas` WHERE `foto` IS NOT NULL AND `foto_tipo` IS NOT NULL ORDER BY `id`;--> statement-breakpoint
INSERT INTO `actas_fotos` (`acta_id`, `version_id`, `orden`, `contenido`, `tipo`)
SELECT `acta_id`, `id`, 1, `foto`, `foto_tipo` FROM `actas_versiones` WHERE `foto` IS NOT NULL AND `foto_tipo` IS NOT NULL ORDER BY `id`;--> statement-breakpoint
ALTER TABLE `actas` DROP COLUMN `foto`;--> statement-breakpoint
ALTER TABLE `actas` DROP COLUMN `foto_tipo`;--> statement-breakpoint
ALTER TABLE `actas_versiones` DROP COLUMN `foto`;--> statement-breakpoint
ALTER TABLE `actas_versiones` DROP COLUMN `foto_tipo`;