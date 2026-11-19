# Actas firmadas escaneadas

Objective: attach the scanned, signed copy of an acta so it is not lost.
Branch: `feat/actas-escaneadas` · Delivery: ask-on-risk · Test runner: `pnpm test` (vitest).

## Specs

- **S1** — "NECESITO UNA PARTE PARA ADJUNTAR LAS ACTAS CUANDO LAS ESCANEO FIRMADAS, PARA QUE ASI NO SE ME PIERDAN".
- **S2** — Accepted files: PDF, JPG or PNG, up to 10 MB, checked by their first bytes. "cada acta solo tiene un formato para subirlo a escanear": one scanned file per acta; to change it, delete the current one and upload the new one. Stored in the database (table `actas_escaneos`) so backups include them.
- **S3** (assumption) — On the acta page: upload (click or drag), list with name, size and upload date, view, download, and delete with confirmation.
- **S4** (assumption) — The actas list shows whether each acta already has its signed scan.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S2 | inline | done | RED: missing module → GREEN; shared magic-byte check in src/lib/archivos.ts |
| T2 | S2–S4 | inline | done | RED: search scan count → GREEN; browser E2E in test container |

T1 = table, migration (new table only) and domain rules with tests. T2 = server action, file route, acta page section, list badge.

## Log

- **L1** (2026-11-18, user): "AHORA NECESITO UNA PARTE PARA ADJUNTAR LAS ACTAS CUANDO LAS ESCANEO FIRMADAS, PARA QUE ASI NO SE ME PIERDAN"
- **L2**: Found a pre-existing intermittent build failure ("database is locked" while collecting page data): every build worker opened data/rastro.db and switched it to WAL at the same time. Fixed separately: during `next build` (NEXT_PHASE) the app uses an in-memory database. RED test src/db/index.test.ts.
- **L3**: Repeated no-cache image builds filled the Windows C: drive and Docker Desktop crashed; after restart, pruned 14 GB of build cache, Docker DB integrity_check = ok.
- **L4**: Browser E2E (playwright-core + headless Chromium, test container with a copy of the Docker DB): PDF and PNG uploaded, fake PDF rejected with its message, view inline / download as attachment, file from another acta → 404, list badge "Sin firmar" → "Firmada", delete with confirmation. Suite 195/195.
- **L5** (2026-11-19, user): "cada acta solo tiene un formato para subirlo a escanear" → S2 changed to one file per acta (was several). Domain rejects a second file; the upload zone hides once the acta has its scan. No existing acta had more than one file (local and Docker DBs checked).
