# Fase 2 — Activos, funcionarios y ubicaciones (Rastro)

Objetivo: CRUD de los tres dominios con formularios validados y ficha de activo.
Branch: fase-2-crud (sobre fase-1-base-proyecto). Delivery: ask-on-risk. Test runner: vitest (unitario, lógica pura).

## Specs

- S1: "Activos, funcionarios y ubicaciones: listas, formularios de crear y editar (con campos de `specs` según el tipo), ficha de activo. *Listo cuando:* se puede registrar un PC completo con todos los campos del formato."
- S2: "Código interno obligatorio y único por activo, con prefijo según el tipo y consecutivo: `PC-014`, `MON-0023`, `TEC-0005`, `MOU-0005`, `IMP-0002`. La app propone el siguiente consecutivo y el usuario puede cambiarlo."
- S3: "React Hook Form + Zod para formularios (genera los esquemas Zod desde las tablas de Drizzle cuando sea posible)"; "TanStack Table para las listas con filtros".
- S4: "Las especificaciones propias de cada tipo de activo van en la columna JSON `specs`. El formulario de activo muestra campos distintos según el tipo."
- S5: Ficha de activo `/activos/[codigo]`: "datos y especificaciones, responsable actual, historial de asignaciones, mantenimientos". Las acciones (asignar, trasladar, devolver, mantenimiento, dar de baja) y el QR son de fases 3, 5 y 7.
- S6: Inventario: "tabla de activos con búsqueda y filtros por tipo, estado, ubicación, responsable y disponible/asignado".
- S7: "Nada se borra": sin acciones de borrado en ningún CRUD.
- A1 (asunción): prefijos no definidos en el plan: parlantes → `PAR`, audifonos → `AUD`, otro → `OTR`. Relleno: PC a 3 dígitos, el resto a 4 (según los ejemplos del plan). El usuario puede editar el código propuesto.
- A2 (asunción): cambiar estado a `dado_de_baja` y marcar `retirado` quedan FUERA de los formularios de fase 2, porque exigen cerrar asignaciones vigentes en transacción (regla del plan) — eso es la fase 3. Los formularios de edición solo tocan datos; el select de estado ofrece operativo / en_reparacion.

## Tasks

- [x] T1 (S2,S3) ruta: inline — deps instaladas; src/lib/codigos.ts con RED→GREEN (7 tests); esquemas en src/lib/validacion/ (comunes, activos con mapeo specs plano↔JSON y RED→GREEN de 6 tests, funcionarios, ubicaciones) generados con drizzle-zod.
- [x] T2 (S1,S7) ruta: inline — src/acciones/ubicaciones.ts + DialogoUbicacion (crear/editar, error de unicidad amigable). Sin borrado.
- [x] T3 (S1,S7) ruta: inline — src/acciones/funcionarios.ts + FormularioFuncionario (RHF) + páginas /funcionarios/nuevo y /funcionarios/[id]/editar.
- [x] T4 (S1,S2,S4) ruta: inline — src/acciones/activos.ts + FormularioActivo: specs dinámicos (PC/portátil con batería/monitor/impresora), código propuesto por tipo que se actualiza al cambiar el tipo si el usuario no lo tocó.
- [x] T5 (S3,S6) ruta: inline — TablaInventario con TanStack Table v9 (useTable + tableFeatures, filtros de columna equalsString + búsqueda global includesString): tipo, estado, ubicación, responsable, disponible/asignado.
- [x] T6 (S5) ruta: inline — ficha /activos/[codigo]: datos, specs por tipo (DetalleSpecs), responsable actual, historial, mantenimientos; editar bloqueado para dado_de_baja.
- [x] T7 (S1) ruta: inline — 13 tests GREEN; tsc limpio; lint sin errores (2 warnings react-hooks/incompatible-library por watch() de RHF, limitación conocida de la regla); build OK (12 rutas); E2E contra COPIA de la base: PC portátil completo insertado con specs anidados correctos, duplicado/fecha inválida/código mal formado rechazados; base real intacta; smoke 200 en las 7 rutas con datos reales.

## Log

- L1 (2026-11-14, usuario): "Ok, vamos con la fase 2"
- 2026-11-14: APIs verificadas en doc actual antes de usar: drizzle-zod (createInsertSchema con refinements/overwrites), TanStack Table v9 (useTable + tableFeatures + filterFn_equalsString/includesString — cambio fuerte vs v8), shadcn ahora usa Base UI (prop render en triggers, no asChild).
- 2026-11-14: decisión — sin zodResolver en el cliente: los esquemas Zod con preprocess ("" → undefined) tienen input types unknown que pelean con los generics de RHF; el formulario usa RHF para estado/campos y la server action valida con Zod como única fuente de verdad. Mensajes de error del servidor se muestran en el formulario.
- 2026-11-14: incidente menor — un `next start` de la fase 1 quedó huérfano ocupando el puerto 3000 y causó 404 falsos en el smoke; se mató por PID (10912, 18815) sin tocar el `next dev` del usuario. Evidencia E2E en scratchpad de sesión (copia de BD), no en el worktree.
- Risk: none (sin migraciones ni cambios de datos existentes, sin contratos externos, sin concurrencia; lo compartido que se tocó —consultas.ts— mantiene las funciones previas y el smoke de las 6 pantallas de fase 1 sigue en 200).
