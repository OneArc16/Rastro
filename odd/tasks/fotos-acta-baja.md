# Fotos del acta de baja (hasta 4)

Objective: the decommission act (acta de baja) accepts up to 4 photos instead of one.
Branch: `feat/fotos-acta-baja` · Delivery: ask-on-risk · Test runner: `pnpm test` (vitest).

## Specs

- **S1** — "que me deje adjuntar minimo 3 imagenes". Agreed limit: up to 4 photos per acta de baja, all optional (0..4). Assumption: each photo keeps the current rules (JPG/PNG/WEBP, ≤ 800 KB after in-browser reduction).
- **S2** — Storage: a new table `actas_fotos` (acta, optional version, order, content, type) replaces the `foto`/`foto_tipo` columns of `actas` and `actas_versiones`. The migration moves every existing photo (current and historical versions) into the new table before dropping the old columns.
- **S3** — Create: the form sends 0..4 photos; more than 4 is rejected with an error, and photos on a non-baja acta are still rejected ("Solo el acta de baja lleva foto").
- **S4** — Edit: each saved photo can be removed individually and new ones added, up to 4 in total; the previous set is kept in the acta's version history.
- **S5** — Display: the acta page, its previous versions and the printed format show every photo, in order.
- **S6** — Server Actions body limit raised so 4 photos fit in one submission.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S2 | inline | done (uncommitted) | RED: migraciones.test.ts lost photos → GREEN after data copy |
| T2 | S1, S3, S4, S6 | inline | done (uncommitted) | RED: 5 domain tests + append test → GREEN 25/25 |
| T3 | S4, S5 | inline | done (uncommitted) | E2E on Docker DB copy (test container) |

T1 = schema + data migration (Risk: item 1). T2 = domain, validation, server actions. T3 = queries, photo route, pages, form, print.
Forecast ≈ 450 authored lines; no writer trigger (units depend on each other), so all inline.

## Log

- **L1** (2026-11-17, user): "que me deje adjuntar minimo 3 imagenes"
- **L2** (2026-11-17, user): chose "Hasta 4 (Recomendado)" as the maximum.
- **L3**: Found Server Actions 1 MB default body limit (node_modules/next/dist/docs/.../serverActions.md); 4 × 800 KB needs `bodySizeLimit` ≈ 4 MB.
- **L4**: T1–T3 done. Suite 178/178, tsc clean, lint 0 errors. Migration probe on a copy of the real Docker DB: 2 photos (current + version) moved byte-identical (sha256), 1 backup requested. Test container: auto-migrated, /actas/2, ?version=1 and /editar render their photos; photo of another acta → 404.
- **L5**: Local dev DB migrated with `pnpm db:migrate` after backup `data/respaldos/rastro-antes-fotos-2026-11-17.db`. Docker volume NOT migrated yet (happens on next `docker compose up -d --build`, with automatic backup).
- **L6**: Commits pending: this feature depends on uncommitted earlier work (src/db/migrar.ts from the Docker setup), so commits wait for the user's decision on committing that work first. Engram mirror pending (auto mode could not review mem_save).
- **L7**: Not verified in a browser: picking/dropping files, the create/edit submission through the server action, and the printed 2x2 layout.
