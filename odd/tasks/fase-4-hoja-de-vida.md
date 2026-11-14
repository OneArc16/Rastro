# Fase 4 — Hoja de vida (Rastro)

Objetivo: generar la hoja de vida de cada funcionario en el formato aprobado (vista e impresión idénticas, tamaño carta) y editar la configuración del encabezado y las firmas.
Branch: fase-4-hoja-de-vida (sobre fase-3-asignaciones). Delivery: ask-on-risk. Test runner: vitest (armado del modelo de la hoja como función pura).

## Specs

- S1: "Hoja de vida: vista e impresión en el formato original, más la pantalla de configuración. *Listo cuando:* la hoja impresa de un funcionario coincide con el PDF original."
- S2: "El formato original estará en `docs/HOJAS_DE_VIDA_DE_PC.pdf`. Ábrelo y respeta su diseño: mismas secciones, mismo orden, mismas etiquetas, barras de título azules, tamaño carta. Es un formato aprobado y no se rediseña."
- S3: "La hoja se genera por funcionario: su PC vigente más los demás activos que tiene asignados." Tabla de secciones del plan: Encabezado, Información general, Batería, Información del equipo, Periféricos, Monitor, Impresora, Observaciones, Novedades, Firmas, con sus orígenes de datos.
- S4: "'Fecha de actualización' = fecha del último cambio en el PC o en sus asignaciones"; Impresora: "impresora asignada al funcionario o a su ubicación"; Observaciones: "historial de asignaciones del funcionario (cambios de equipo, con fecha y motivo) más las observaciones del PC"; Novedades: "`mantenimientos` del PC, los más recientes primero".
- S5: "Los campos vacíos se imprimen como `NO` o `NA`, igual que en el original." "Si el funcionario tiene más de un monitor, se repite el bloque de monitor."
- S6: "Primera versión: una página con estilos de impresión (`@media print`, tamaño carta) y un botón 'Imprimir / Guardar PDF'. La vista en pantalla debe ser idéntica a lo que se imprime."
- S7: Configuración: "datos del encabezado del formato y de las tres firmas."

## Hallazgos del PDF original (docs/HOJAS DE VIDA DE PC.pdf)

- 2 páginas carta (612 × 792 pt). Rejilla de 6 columnas (anchos ≈ 9.4 / 24.4 / 22.7 / 21.8 / 12.4 / 9.2 %): etiqueta en negrita, valor, etiqueta, valor, etiqueta, valor; textos alineados abajo como en Excel.
- Barras de título: relleno #4472C4, borde #264275, texto blanco centrado, esquinas levemente redondeadas.
- Encabezado: logo (2 columnas), título "HOJA DE VIDA EQUIPOS DE COMPUTO" (2 columnas), CODIGO / VERSION / FECHA EMISIÓN con su valor.
- Reglas de vacíos observadas: batería sin portátil → NA, NA, NA; sin tarjeta gráfica → NO, NA, NA; sin wifi → NO, NO; sin tarjeta de sonido → NO, NO; periférico ausente → NO, NO, NO; serial ausente → NO.
- Etiquetas literales: "MARCA:" (con dos puntos solo en información del equipo), "EXP. DE GARANTIA", "TIPO DE MANTENIMIENTO", "REVISADOR POR:" (así está escrito en el formato aprobado), "OBSERVACION:".
- El bloque de firmas aparece dos veces: tras PERIFÉRICOS en la página 1 y al final de la página 2.

## Asunciones

- A1: DISCO y UNIDAD DE DISCO muestran ambos `unidadDisco` (en el original llevan el mismo valor); CAPACIDAD = `capacidadDisco`.
- A2: si el funcionario tiene más de un PC vigente, la hoja usa el de asignación más reciente y menciona los demás en Observaciones.
- A3: Observaciones agrupa los movimientos del mismo día, tipo (RECIBE/ENTREGA) y motivo en una línea, en orden cronológico.
- A4: el bloque de firmas se imprime una sola vez, al final, según el orden de la tabla del plan; la repetición tras PERIFÉRICOS se consulta con el usuario.
- A5: se conserva la etiqueta literal "REVISADOR POR:" del formato aprobado.
- A6: la hoja ocupa una página carta; si hay muchas observaciones o novedades, continúa en una segunda página sin cortar bloques.

## Tasks

- [x] T1 (S3-S5) ruta: inline — src/dominio/hoja-de-vida.ts (construirHojaDeVida). 13 tests RED→GREEN que cubren cada regla de NO/NA, PC elegido, monitores repetidos, impresora propia o de ubicación, observaciones agrupadas y novedades ordenadas.
- [x] T2 (S3,S4) ruta: inline — obtenerDatosHojaDeVida en src/db/consultas.ts.
- [x] T3 (S2,S6) ruta: inline — HojaDeVidaFormato + hoja-de-vida.css (clases hv-) + ruta /funcionarios/[id]/hoja-de-vida + botón "Hoja de vida" en la ficha; @page carta en globals.css; navegación oculta al imprimir; fuente Carlito (mismas métricas que Calibri) con next/font.
- [x] T4 (S7) ruta: inline — configuración editable: esquema drizzle-zod, acción con upsert sobre id = 1, formulario.
- [x] T5 (S1) ruta: inline — 45 tests GREEN; tsc limpio; lint 0 errores; build OK. Comparación visual: hoja de MARIA impresa a PDF con Chromium sin interfaz → 1 página carta con mismas secciones, orden, etiquetas, barras y rejilla que el original. Pantalla de PC idéntica a lo impreso. A 390 px ninguna página se desborda (medido con CDP). Configuración: E2E en copia (upsert de 1 fila, vacíos → null, fecha inválida rechazada); base real intacta.

## Log

- L1 (2026-11-14, usuario): "Sigue con la fase 4"
- 2026-11-14: el PDF se leyó con mupdf (WASM) instalado en el scratchpad de la sesión; Python no tiene pip y no hay poppler. Colores medidos sobre los píxeles de la página renderizada.
- 2026-11-14: los módulos CSS (*.module.css) no funcionan en este proyecto: la regla de Turbopack de next.config.ts ("*.css" → @tailwindcss/turbopack, as "*.css") les quita el mapeo de clases (class="undefined"). Decisión: hoja CSS normal con prefijo hv- en vez de tocar la config del build.
- 2026-11-14: la primera impresión salió en Arial y en 2 páginas; con Carlito entra en 1 página como el original. Se quitó el text-transform a mayúsculas: el original respeta lo escrito ("2do PISO").
- 2026-11-14: BUG de fase 1 encontrado y corregido — la interfaz salía en serif: globals.css tenía --font-sans: var(--font-sans) (autorreferencia de shadcn init) y las variables de Geist estaban en <body> mientras la fuente se aplica en <html>. Commit propio.
- 2026-11-14: verificado en navegador el arreglo de selects de la fase 3 (el tipo muestra "PC de mesa").
- 2026-11-14: las firmas de la base real cambiaron a nombres reales durante la sesión: fue el usuario desde su next dev; las pruebas de escritura usan copias.
- Pendiente con el usuario: A4 (¿repetir el bloque de firmas tras PERIFÉRICOS como en el original?).
- Risk: none (sin migraciones; la única escritura nueva es el upsert de la fila de configuración, que ya existía; @page y print:hidden solo afectan la impresión).
