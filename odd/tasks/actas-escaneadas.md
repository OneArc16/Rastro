# Actas firmadas escaneadas

Objective: attach the scanned, signed copy of an acta so it is not lost.
Branch: `feat/actas-escaneadas` · Delivery: ask-on-risk · Test runner: `pnpm test` (vitest).

## Specs

- **S1** — "NECESITO UNA PARTE PARA ADJUNTAR LAS ACTAS CUANDO LAS ESCANEO FIRMADAS, PARA QUE ASI NO SE ME PIERDAN".
- **S2** (assumption) — Accepted files: PDF, JPG or PNG, up to 10 MB each, checked by their first bytes; several files per acta (pages scanned separately). Stored in the database (new table `actas_escaneos`) so backups include them.
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
