# Fase 1 — Base del proyecto (Rastro)

Objetivo: proyecto Next.js + Drizzle + SQLite funcionando con layout, navegación y datos de ejemplo, accesible desde PC y celular en red local.
Branch: master. Delivery: ask-on-risk. Test runner: ninguno aún (verificación funcional: build + arranque + lectura de datos).

## Specs

- S1: "crear el proyecto, conectar Drizzle + SQLite, aplicar la migración, layout con navegación y datos de ejemplo. *Listo cuando:* la app abre en el PC y en el celular por la red local y muestra los datos de ejemplo."
- S2: Stack: "Next.js (App Router) + TypeScript, última versión estable", "Drizzle ORM + SQLite (archivo local). Esquema validado con drizzle-orm 0.45 y drizzle-kit 0.31", "Tailwind CSS + shadcn/ui".
- S3: Esquema: usar el archivo del plan "tal cual en `src/db/schema.ts`".
- S4: Conexión: "El archivo de la base va en `data/rastro.db` y debe estar en `.gitignore`.", "Activa `PRAGMA foreign_keys = ON` en cada conexión y usa modo WAL.", "Usa migraciones de drizzle-kit (`generate` + `migrate`), no `push`.", "Incluye un script de respaldo que copie el archivo de la base a `data/respaldos/` con la fecha en el nombre."
- S5: "Toda la interfaz va en español. Los nombres del dominio en el código también (activos, funcionarios, asignaciones), igual que en el esquema."
- S6: Acceso celular: "El servidor debe escuchar en todas las interfaces (`-H 0.0.0.0`)", "Para el uso diario: `next build` + `next start`."

## Tasks

- [x] T1 (S1,S2) ruta: inline — scaffold Next.js 16.4.6 (App Router, TS, Tailwind 4) con pnpm. Hecho vía directorio temporal (npm rechaza "Rastro" por la mayúscula).
- [x] T2 (S2,S3,S4) ruta: inline — schema.ts verbatim (drizzle-orm 0.45.4, drizzle-kit 0.31.11, better-sqlite3 13.2.0), cliente con FK ON + WAL + singleton, drizzle.config, migración 0000 generada y aplicada.
- [x] T3 (S1,S5) ruta: inline — scripts/seed.ts idempotente: 3 ubicaciones, 3 funcionarios, 7 activos, 8 asignaciones (1 histórica cerrada, 1 a ubicación), 4 mantenimientos, configuración id=1.
- [x] T4 (S4) ruta: inline — scripts/respaldo.ts con API backup de SQLite → data/respaldos/rastro-FECHA_HORA.db. Probado.
- [x] T5 (S1,S5,S2) ruta: inline — shadcn/ui (Base UI), navegación responsive (sidebar escritorio + Sheet móvil), 6 pantallas en español leyendo desde src/db/consultas.ts.
- [x] T6 (S1,S6) ruta: inline — dev/start con -H 0.0.0.0; build OK; servidor probado: todas las rutas 200 con datos de ejemplo.

## Log

- L1 (2026-11-14, usuario): "Lee el archivo de contexto @PLAN.md para poder desarrollar el proyecto, usa las buenas practicas y no hagas codigo spaguetti"
- Evidencia entorno: Node v24.14.0, pnpm disponible. Workspace tiene PLAN.md, docs/HOJAS DE VIDA DE PC.pdf, public/logo.png, .git.
- 2026-11-14 verificación: constraints probados contra la base real (índice único parcial → SQLITE_CONSTRAINT_UNIQUE; CHECK destino → SQLITE_CONSTRAINT_CHECK). `pnpm lint` limpio. `pnpm build` OK (todas las rutas dinámicas). `next start -H 0.0.0.0`: /, /inventario, /funcionarios, /mantenimientos, /configuracion → 200 con datos de ejemplo (PC-001, MARIA FERNANDA LOPEZ, EPSON).
- Decisión: `cacheComponents: false` en next.config.ts — app local monousuario, las páginas leen SQLite fresco en cada petición; `force-dynamic` es incompatible con cacheComponents en Next 16.
- Pendiente fase 1: probar acceso real desde el celular (depende de la red del usuario / WSL2; instrucciones entregadas).
- Commit de la unidad de trabajo: 104094b en rama fase-1-base-proyecto (commit raíz). RDD on; assess sobre base árbol-vacío 4b825dc6: risk=medium, review_due=false (under_budget) → slice queda pendiente hasta alcanzar presupuesto. Risk: none (proyecto nuevo: sin datos existentes, sin contratos consumidos, sin concurrencia).
