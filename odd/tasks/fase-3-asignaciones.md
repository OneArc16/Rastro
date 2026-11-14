# Fase 3 — Asignaciones (Rastro)

Objetivo: asignar, trasladar, devolver e intercambiar activos con historial, más dar de baja activos y retirar funcionarios (pendientes de la fase 2, asunción A2).
Branch: fase-3-asignaciones (sobre fase-2-crud). Delivery: ask-on-risk. Test runner: vitest (servicio de dominio contra SQLite en memoria con las migraciones reales).

## Specs

- S1: "Asignaciones: asignar, trasladar y devolver, con historial en las fichas. *Listo cuando:* un cambio de PC entre dos funcionarios se hace en una operación y ambos quedan con sus equipos correctos."
- S2: "Asignación vigente = `fecha_hasta` es null. Un activo tiene como máximo una (lo garantiza un índice único parcial)."
- S3: "Una asignación va a un funcionario o a una ubicación, nunca ambos ni ninguno (lo garantiza un CHECK)."
- S4: "Trasladar un activo = cerrar la asignación vigente y abrir una nueva, en una sola transacción. Nunca se edita la asignación anterior para cambiarle el responsable."
- S5: "Nada se borra: los funcionarios se marcan como `retirado` y los activos pasan a `dado_de_baja`, para conservar el historial. Al retirar un funcionario o dar de baja un activo, se cerran sus asignaciones vigentes."
- S6: Ficha de activo: "Acciones: asignar, trasladar, devolver, registrar mantenimiento, dar de baja." (registrar mantenimiento = fase 5). Funcionarios: "lista y ficha con sus equipos vigentes, historial" (botón de hoja de vida = fase 4).
- A1 (asunción): no se asigna un activo dado de baja ni a un funcionario retirado; un activo en reparación sí puede estar asignado.
- A2 (asunción): la fecha de cierre no puede ser anterior a la fecha desde de la asignación vigente.
- A3 (asunción): devolver solo registra la fecha (la tabla tiene un único `motivo`, el de apertura). Dar de baja agrega el motivo a las observaciones del activo.

## Tasks

- [x] T1 (S1-S5) ruta: inline — src/dominio/asignaciones.ts (asignar, trasladar, devolver, intercambiar, darDeBaja, retirarFuncionario; ErrorDeNegocio). 19 tests RED→GREEN contra SQLite en memoria con las migraciones reales (incluye rollback del traslado cuando la apertura falla). src/db/index.ts expone conectar(ruta) y el tipo Db.
- [x] T2 (S1,S6) ruta: inline — src/acciones/asignaciones.ts (wrapper ejecutar: Zod → dominio → ResultadoAccion), src/lib/validacion/asignaciones.ts, DialogoAccion genérico + campos comunes, AccionesActivo en la ficha.
- [x] T3 (S5,S6) ruta: inline — /funcionarios/[id] (equipos vigentes, historial, retirar), enlaces desde lista, ficha de activo y ubicaciones; ubicaciones muestra funcionarios y equipos compartidos.
- [x] T4 (S1) ruta: inline — 32 tests GREEN; tsc limpio; lint 0 errores; build OK; E2E contra copia: intercambio PC-001↔PC-002 deja a CARLOS con PC-001 y a MARIA con PC-002 en una operación, cierres con fecha; fecha inválida, fecha anterior al inicio y destino vacío rechazados; base real intacta. Smoke 200 en 7 rutas en puerto 3100.

## Log

- L1 (2026-11-14, usuario): "Sigue con la Fase 3"
- 2026-11-14: BUG de fase 2 encontrado y corregido — Base UI Select.Value muestra el valor crudo ("pc_mesa", id de ubicación) salvo que Select.Root reciba `items` (verificado en la doc de Base UI). Nuevo componente src/components/selector.tsx que siempre pasa items; reemplaza los selects del formulario de activo, funcionario y filtros del inventario. Commit propio (fix).
- Decisión: la lógica de negocio vive en src/dominio/ y recibe la conexión como parámetro (testeable en memoria); las server actions solo validan y traducen errores.
- Risk: item 1 a medias descartado — se actualizan filas existentes (fecha_hasta, estado, retirado), pero es la operación normal de la app pedida por el plan, transaccional y cubierta por tests; no hay migraciones ni cambios de formato. Risk: none.
