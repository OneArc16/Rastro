# Fase 5 — Mantenimientos e inicio (Rastro)

Objetivo: registrar mantenimientos, ver los próximos y vencidos, y completar el panel de inicio.
Branch: fase-5-mantenimientos (sobre fase-4-hoja-de-vida). Delivery: ask-on-risk. Test runner: vitest (dominio en SQLite en memoria y funciones puras de alertas).

## Specs

- S1: "Mantenimientos e inicio: registro, próximas fechas y el panel de inicio."
- S2: Inicio: "totales por tipo y estado, activos disponibles, mantenimientos próximos o vencidos, garantías por vencer."
- S3: Mantenimientos: "próximos y vencidos, con registro rápido."
- S4: Ficha de activo, acción: "registrar mantenimiento".
- S5: "Fechas como texto `AAAA-MM-DD`. Se muestran al usuario como `DD/MM/AAAA`."

## Asunciones

- A1: la fecha pendiente de un activo es la `proxima_fecha` de su mantenimiento más reciente; las de mantenimientos anteriores quedan reemplazadas.
- A2: vencido = próxima fecha anterior a hoy; próximo = desde hoy hasta 30 días.
- A3: garantía por vencer = `garantia_hasta` desde hoy hasta 60 días. Las ya vencidas no se listan.
- A4: los activos dados de baja no generan alertas ni admiten mantenimientos nuevos.
- A5: la próxima fecha, si se da, debe ser posterior a la fecha del mantenimiento.

## Tasks

- [x] T1 (S1,S2,S3) ruta: inline — src/dominio/mantenimientos.ts: registrarMantenimiento, pendientesDeMantenimiento, garantiasPorVencer; sumarDias y diasEntre en lib/fechas. 11 tests RED→GREEN. ErrorDeNegocio y validarFecha pasan a src/dominio/comunes.ts (los 19 tests de asignaciones siguen en verde).
- [x] T2 (S3,S4) ruta: inline — src/acciones/ejecutar.ts (wrapper compartido), acción registrarMantenimientoAccion, DialogoMantenimiento (activo fijo o a elegir), acción en la ficha de activo; CampoFecha y CampoMotivo aceptan id/obligatorio/etiqueta opcionales.
- [x] T3 (S2,S3) ruta: inline — /mantenimientos con vencidos, próximos (con "Registrar" por fila), registro rápido e historial; inicio con 4 indicadores, vencidos, próximos, garantías por vencer, activos disponibles, totales por tipo y estado. "Disponibles" del inicio reutiliza la definición del inventario.
- [x] T4 (S1) ruta: inline — 56 tests GREEN; tsc limpio; lint 0 errores; build OK. E2E en copia: registrar PC-001 lo saca de vencidos; próxima fecha igual a la fecha, activo vacío y tipo inválido rechazados; base real intacta (4 mantenimientos). Capturas en Chromium de inicio, mantenimientos y del diálogo abierto (selects con etiquetas). A 390 px, sin desbordes en /, /mantenimientos, /activos/PC-001.

## Log

- L1 (2026-11-14, usuario): "Empieza la fase 5"
- 2026-11-14: el campo de fecha nativo muestra el formato del idioma del navegador (en el Chromium de prueba, en inglés, sale MM/DD/AAAA); en un navegador en español sale DD/MM/AAAA. Las fechas que muestra la app siempre usan DD/MM/AAAA.
- Nota de mantenimiento: src/db/consultas.ts ya pasa de 450 líneas; si sigue creciendo conviene dividirlo por dominio.
- Risk: none (sin migraciones ni cambios de datos existentes; solo se insertan mantenimientos nuevos; la refactorización de ErrorDeNegocio/ejecutar está cubierta por los tests existentes).
