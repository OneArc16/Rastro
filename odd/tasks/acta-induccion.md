# Actas de inducción

Objective: generate induction actas with the approved "ACTA DE REUNIÓN" format (docs/ACTA DE INDUCCION.pdf).
Branch: `feat/acta-induccion` · Delivery: ask-on-risk · Test runner: `pnpm test` (vitest).

## Specs

- **S1** — "vamos hacer un modulo para generar las actas de induccion, hay te adjunte el formato para que sepas como es" (docs/ACTA DE INDUCCION.pdf).
- **S2** — New acta type `induccion` (code IND-0001) that reuses numbering, editing with versions, search, format settings, printing and the signed scan.
- **S3** — Content, as in the PDF: fecha, hora, lugar, objetivo de la reunión, proceso responsable, responsables de la reunión, asistentes (nombres y apellidos, cargo, firma in blank), puntos a tratar (numbered), desarrollo de la reunión.
- **S4** — Printed format: header "ACTA DE REUNIÓN" with CÓDIGO / VERSIÓN / FECHA; footer Elaboró / Revisó / Aprobó. Defaults from the PDF: F-SGI-001, 001, 01/06/2022; Oscar Vargas (Coordinador de Auditoria y Calidad), Claudia Martínez (Gerente), Claudia Martínez (Gerente).
- **S5** (assumption) — Asistentes are added by searching a funcionario (fills name and cargo) or typed by hand for external people. Puntos a tratar are written one per line.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S2–S4 | inline | done | RED 5 tests → GREEN |
| T2 | S2, S3, S5 | inline | done | browser E2E: created IND-0001 |
| T3 | S4 | inline | done | print screenshot compared with the PDF |

T1 = type, schema, defaults, domain create + tests. T2 = new/edit form and entry points. T3 = printed format.

## Log

- **L1** (2026-11-19, user): "Excelente, ahora vamos hacer un modulo para generar las actas de induccion, hay te adjunte el formato para que sepas como es"
- **L2**: No migration needed: acta type has no CHECK constraint (drizzle-kit: "No schema changes").
- **L3**: Browser E2E in a test container (copy of the Docker DB): created IND-0001 with two attendees from the search picker and one typed by hand; list search "ind-1" finds it; Configuración shows the new format. Print compared with docs/ACTA DE INDUCCION.pdf; fixed header date wrapping and bold cells (verified by applying the same changes on the rendered page, since C: had 1.7 GB free and a rebuild was not safe).
