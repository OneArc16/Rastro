# Fase 6 — Importación del Excel actual (Rastro)

Objetivo: cargar en la app los equipos, responsables, ubicaciones, observaciones y mantenimientos de `docs/HOJAS DE VIDA DE PC.xlsx`.
Branch: fase-6-importacion (sobre fase-5-mantenimientos). Delivery: ask-on-risk. Test runner: vitest.

## Specs

- S1: "Importación del Excel actual: no empezar hasta que el usuario entregue un archivo de muestra; la estructura del Excel define cómo se importa."
- S2: "Librería de Excel para la importación (se decide en la fase 6)".
- S3: Reglas del dominio vigentes: código interno obligatorio y único con prefijo por tipo; una asignación va a un funcionario o a una ubicación; fechas AAAA-MM-DD; nada se borra.

## Hallazgos del archivo (relevamiento completo, 2026-11-14)

- 70 hojas: resumen "SISM" + hojas "1"…"42" (falta "36") + "14 (2)"; resumen "DISPENSARIO" + hojas "01 DISP"…"26 DISP". 68 hojas de PC.
- Las 68 hojas tienen las etiquetas en exactamente las mismas celdas que la hoja "1" (0 diferencias): se pueden leer por posición. Valores en B/D/F a la derecha de cada etiqueta.
- Cabecera por hoja: PC (B6), RESPONSABLE (D6), TELEFONO (F6, siempre vacío), VALOR (B7, número o texto "$1.661.344"), FECHA DE COMPRA (D7, fecha real), EXP. DE GARANTIA (F7, siempre vacía), UBICACIÓN (B8), TIPO DE COMPUTADOR (D8: 65 "PC DE MESA", 3 "PORTATIL"), FECHA DE ACTUALIZACION (F8).
- Observaciones: texto libre en A43–A49, numeración variada ("1.", "1)", "1-"), a menudo en orden inverso. Cuentan historia en prosa ("ANTERIOR PC DE…", "SE HIZO CAMBIO DE MONITOR").
- Novedades: filas 50/52/54 (ÚLTIMA FECHA en B, PRÓXIMA en D, TIPO en F) y la observación en la fila siguiente ("OBSERVACION: …"). La hoja "29" está corrida una fila (novedad en la fila 51).
- Problemas de datos:
  - El número de PC de la celda B6 no es único: hoja "18" dice 17, hoja "42" dice 32, "14 (2)" dice 14. El nombre de la hoja sí es único.
  - Las hojas DISP repiten la numeración 01…26, que choca con la de SISM.
  - "14 (2)" es otro equipo (serial G9340F2IMP0920W46) con el mismo responsable que la "14"; la "14" dice "SE HIZO CAMBIO DE PC EL DIA 16-10-2026, EL OTRO SE PUSO A LA JEFE LIUDYS".
  - Responsables que no son personas: "MEDICO DE TURNO" (8 PCs), "AUXILIAR DE TURNO", "CONSULTORIO 11", "CONSULTORIO 12", "CONSULTORIO PURPURA", municipios en DISP ("GUACAMAYAL", "EL DIFICIL (ARIGUANI)"), y "26 DISP" sin responsable.
  - Seriales repetidos entre hojas (copiar y pegar): PC 38P0D42 (04 y 05 DISP), 8VZLWK2 (14 y 21 DISP); monitores en 26/32, 23/42, 33/40, 01/02 DISP, 23/24 DISP, 14/21 DISP. Seriales "NA", "NO TIENE" o vacíos.
  - Fechas de mantenimiento como texto ("16/03/2026", "18-06-2026"), una inexistente ("29/02/2026") y dos con la próxima fecha anterior a la del mantenimiento (hoja "34" y "22 DISP").
  - Ubicaciones casi iguales: "LINEA DE FRENTE 2do PISO" y "LINEA DE FRENTE 2D0 PISO"; "BODEGA" (DISP) y "BODEGA DISPENSARIO" (hoja 29).
  - Los resúmenes "SISM" y "DISPENSARIO" tienen 5 y 8 columnas y contradicen las hojas en varios casos (índices 29 y 34 repetidos); las hojas tienen el detalle completo.

## Reglas aprobadas (L5)

- P1: fuente de verdad = las hojas de PC. Del resumen "DISPENSARIO" solo se usan MUNICIPIO y AREA para nombrar la ubicación (se cruza por número: "6 DISP" = hoja "06 DISP"). El resumen "SISM" no se importa.
- P2: código desde el nombre de la hoja: "N" → PC-0NN; "NN DISP" → PC-1NN (PC-101…PC-126); "14 (2)" → PC-043, sin asignar, con su texto de observaciones.
- P3: el PC y sus periféricos van a la ubicación (B8), no a una persona, cuando el responsable está vacío, es un rol de turno ("MEDICO DE TURNO", "AUXILIAR DE TURNO"), empieza por "CONSULTORIO" o es igual a la ubicación o a un municipio; si no, a un funcionario. Un mismo nombre = un solo funcionario.
- P4: cada ubicación lleva su sede (L5: "hay varias sedes IPS y los dispensarios"). IPS: "IPS - {B8}" (o el responsable, si B8 está vacía y el responsable es un lugar). Dispensarios: "DISPENSARIO {MUNICIPIO} - {AREA}" según el resumen; si falta la fila, "DISPENSARIO {B8}". Si la hoja contradice al resumen, se usa el resumen y se avisa. Los nombres casi iguales se listan en el informe, no se unen solos.
- P5: activos por hoja: PC; monitor si B35 no es NO/vacío; teclado, mouse, parlantes y audífonos si su marca no es NO/vacía; impresora si B39 = SI. Códigos de periféricos con el siguiente consecutivo de su tipo.
- P6: "NO", "NA", "NO TIENE" y vacío → sin dato. Valor "$1.661.344" → 1661344.
- P7: asignación desde la FECHA DE ACTUALIZACION de la hoja, motivo "Importado del Excel".
- P8: observaciones A43–A49 → observaciones del PC, ordenadas por su número. Novedades → mantenimientos; fecha inválida → se omite con aviso; próxima fecha no posterior → se guarda sin próxima fecha, con aviso.
- P9: mecanismo: comando `pnpm importar <archivo>` que por defecto solo muestra el informe (qué se crea y todos los avisos) y con `--confirmar` escribe todo en una sola transacción, después de un respaldo automático.
- P10: la importación exige una base sin activos. Para eso se borran los datos de ejemplo de la fase 1, conservando la configuración (encabezado y firmas) y con respaldo previo.
- P11: librería: exceljs 4.4.0 (MIT; lee fechas, celdas combinadas y fórmulas). SheetJS se descarta: la versión de npm (0.18.5) está desactualizada y tiene vulnerabilidades conocidas.

## Tasks

- [x] T1 (S2) ruta: inline — exceljs 4.4.0; src/importacion/excel.ts (hojas de PC reconocidas por "PC" en A6; fórmulas, texto enriquecido y fechas) con 3 tests sobre un .xlsx generado en un directorio temporal del sistema.
- [x] T2 (P5-P8) ruta: inline — src/importacion/lectura.ts, 15 tests RED→GREEN.
- [x] T3 (P1-P7) ruta: inline — src/importacion/plan.ts, 15 tests RED→GREEN.
- [x] T4 (P9,P10) ruta: inline — src/importacion/aplicar.ts (4 tests: crea todo, se niega sin --reemplazar, reemplaza conservando configuración, atomicidad), src/importacion/informe.ts (2 tests), src/db/rutas.ts + src/db/respaldo.ts compartidos, scripts/importar.ts (`pnpm importar`).
- [x] T5 ruta: inline — 96 tests GREEN; tsc limpio; lint 0 errores. Vista previa con el archivo real: 68 hojas → 276 activos, 50 funcionarios, 43 ubicaciones, 271 asignaciones, 36 mantenimientos, 19 avisos. Importación en copia: sin --reemplazar se niega; con --reemplazar crea todo, conserva la configuración, ningún activo con 2 vigentes, respaldo con los 7 activos previos; hash de la base real idéntico antes y después. Hoja de vida de TEYLIN MARTINEZ (PC-014) impresa con Chromium: coincide con el PDF original en datos del equipo, periféricos, monitor, impresora, fecha de actualización (09/07/2025) y observaciones. Sin desbordes a 390 px con los datos reales.

## Log

- L1 (2026-11-14, usuario): "Sigue con la fase 6"
- L2 (2026-11-14, usuario): "No tengo un excel porque no usamos, puedes crearlo tu mismo no?"
- L3 (2026-11-14, usuario): "pense que era excel para exportar"
- L4 (2026-11-14, usuario): "listo ya esta el excel que me pediste" → docs/HOJAS DE VIDA DE PC.xlsx
- 2026-11-14: relevamiento hecho con exceljs en el scratchpad de la sesión (fuera del proyecto).
- L5 (2026-11-14, usuario): "Si, resuelvelo como mejor lo veas, lo que pasa es que hay varias sedes IPS y los dispensarios si me entiendes" → reglas aprobadas; P1 y P4 ajustadas para nombrar ubicaciones con su sede.
- Riesgo anticipado: item 1 (el modo de reemplazo borra los datos actuales de la base). Mitigación: respaldo automático, vista previa por defecto, transacción única, configuración conservada.
- 2026-11-14: el Excel tiene nombres reales y el repo tiene remoto en GitHub: docs/*.xlsx va al .gitignore. El PDF de docs/ quedó commiteado en la fase 1 (104094b, nombre de una funcionaria y firmas); no se reescribe el historial sin pedido del usuario.
- 2026-11-14: la comparación con el PDF original detectó dos errores, corregidos con tests: (1) la fecha de actualización salía con el día de la importación → los activos importados toman como actualizado_en la fecha de la hoja; (2) la asignación de carga inicial aparecía como "RECIBE … MOTIVO: IMPORTADO DEL EXCEL" en las observaciones → MOTIVO_CARGA_INICIAL en src/dominio/comunes.ts y la hoja de vida no cuenta esa recepción como cambio de equipo (su entrega posterior sí).
- 2026-11-14: la configuración actual de la base real tiene las firmas de ejemplo ("Daniel Castañeda", "Por definir"); el usuario debe cargarlas en Configuración.
- Risk: item 1 (datos irreversibles: `--reemplazar` borra activos, funcionarios, ubicaciones, asignaciones y mantenimientos existentes). Requiere verificador independiente.
