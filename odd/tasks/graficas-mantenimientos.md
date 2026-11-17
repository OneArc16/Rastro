# Módulo de gráficas de mantenimientos

Objective: a charts page for maintenance, like the Excel "Dashboard" sheet.
Branch: `feat/graficas` · Delivery: ask-on-risk · Test runner: `pnpm test` (vitest).

## Specs

- **S1** — "hay que hacer un modulo de graficas para nosotros tambien tenerla, usa le mejor libreria para las graficas". Library: Recharts (base of shadcn/ui charts), pinned to 3.10.1 (3.11.0 was published the same day).
- **S2** — Year filter (like Excel `B2` "Año de análisis"); default the current year when it has data, otherwise the latest year with data.
- **S3** — KPIs for the year: total, preventivos (n, %), correctivos (n, %), distinct assets serviced.
- **S4** — Monthly chart: preventivos vs correctivos per month (Excel "Mes / Preventivos / Correctivos / Total"), with tooltip and a table view.
- **S5** — Current state: vencidos / próximos (30 días) / al día, reusing `pendientesDeMantenimiento`.
- **S6** — Maintenance per sede for the year (top 12, rest folded into "Otras"); sede = location name before the first " - ", like the Excel "Sede / Área" column.
- Assumption: Excel "Estado" (Programado, Pendiente…) and "Costo" are not stored by the system, so they are out of scope.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S2–S6 | inline | done | RED: missing module, then sede grouping → GREEN 8/8 |
| T2 | S1–S6 | inline | done | tsc clean, 188/188, screenshots light/dark/mobile |

T1 = pure statistics functions + tests. T2 = dependency, query, page, charts, nav. Risk: item 5 (new dependency).

## Log

- **L1** (2026-11-17, user): "COMO VISTE EN EL EXCEL EL TIENE UNAS GRAFICAS, HAY QUE HACER UN MODULO DE GRAFICAS PARA NOSOTROS TAMBIEN TENERLA, USA LE MEJOR LIBRERIA PARA LAS GRAFICAS"
- **L2**: Palette validated with the dataviz validator: preventivo/correctivo = slots 1–2 (#2a78d6/#eb6834 light on #ffffff, #3987e5/#d95926 dark on #111826), all checks PASS. Status colors only with icon + label.
- **L3**: First render review: location bars were ambiguous (three truncated "DISPENSARIO SANTA MARTA -…") and month labels overlapped on mobile. Fixed by grouping per sede with names above each bar, and skipping overlapping month ticks. Top segment of each month is now the rounded one.
- **L4**: Verified in a production test container with a copy of the Docker DB (31 maintenances in 2026). The dev server kept a stale consultas.ts module during HMR; not restarted because it is the user's process.
