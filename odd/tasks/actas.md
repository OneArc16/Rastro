# Actas de entrega, egreso y baja (Rastro)

Objetivo: generar las tres actas en sus formatos aprobados y guardarlas como historial consultable y reimprimible.
Branch: actas (sobre master c4fbdf2). Delivery: ask-on-risk. Test runner: vitest + comparación visual con Chromium sin interfaz.

## Specs

- S1 (L1): "Quiero implementar para que me genere las Actas de entrega, egreso y baja, ya te paso los formatos para que los revises"
- S2 (L2): "La idea es que quede guardada como un historial y se tienen alguna duda yo la busco, me han pasado varios incovenientes por no tenerlas guardadas"
- S3 (formatos, docs/ — no se versionan: tienen datos personales):
  - "F-SIS-002 ACTA DE ENTREGA DE EQUIPOS DE COMPUTO.pdf": versión 003, emisión 15/05/2025, 2 páginas carta.
  - "ACTA DE EGRESO DE EQUIPOS DE COMPUTO.pdf": F-SIS-001, versión 002, emisión 23-02-2022, 1 página carta.
  - "ACTA DE BAJA PLANTILLA.pdf": FCOM-01, versión 002, emisión 05/06/2019, carta.

## Hallazgos de los formatos

- Entrega. Página 1: datos del responsable (nombre, cargo, n.° celular, correo, área, municipio); dispositivos periféricos con marca y n.° serial (monitor, mouse, teclado, impresora, parlantes, celular); torre (marca CPU, velocidad, cantidad RAM, tipo RAM, HDMI, VGA, disco duro, tarjeta de video, unidad CD/DVD, serial torre, sistema operativo, marca); software instalado; prueba de funcionalidad con OK/FALLA (pruebas on/off, función S.O., función aplicaciones, unidad óptica, prueba de sonido, función monitor, función teclado, función mouse); tiempo estimado de uso. Página 2: texto de responsabilidad, observación, texto de certificación, firma de quien entrega y de quien recibe, fecha de entrega y de recibido. Pie en ambas páginas: Elaboró/Revisó/Aprobó.
- Egreso: datos del funcionario T.I. que realiza el egreso (nombre, cargo, correo, celular); dispositivos enviados con SI/NO/cantidad/detalle (torre, monitor, mouse, teclado, impresora, parlantes, estabilizador, cables); detalle del envío; firma del funcionario T.I. y del funcionario del dispensario que recibe; fecha de salida; pie Elaborado/Revisado/Aprobado.
- Baja: datos del responsable (como en entrega); datos del equipo (elemento, marca, modelo, serial, capacidad disco duro, procesador, memoria RAM, fecha de compra, fecha de baja); calificación con 6 opciones (depósito y aprovechamiento de piezas, daño en circuitos eléctricos, uso inapropiado, baja definitiva, deterioro no enciende, otros); especificación de la calificación con foto; responsable del diagnóstico (nombre, cargo); firma del responsable y VoBo del jefe de área; pie Elaborado/Revisado/Autorizado. La página 2 del PDF solo tiene encabezado y un pie con firmantes antiguos: se toma como resto de la plantilla.
- Cada formato tiene su propio código, versión, fecha de emisión y firmantes del pie, distintos de los de la hoja de vida.
- Datos que la app no guarda hoy: correo del funcionario; municipio y área por separado; HDMI, VGA, unidad CD/DVD; celular, estabilizador y cables como dispositivos; foto.

## Reglas aprobadas (L3)

- P1: cada acta guarda una copia fija de todo lo que se imprime (snapshot) en el momento de crearla, precargada desde la app y editable en el formulario antes de guardar. Reimprimir muestra exactamente lo que se firmó, aunque después cambien los datos del equipo o del funcionario. Así los campos que la app no guarda (HDMI, VGA, municipio…) se completan en el acta sin cambiar el modelo.
- P2: número consecutivo por tipo (ENT-0001, EGR-0001, BAJ-0001) para citarlas y buscarlas.
- P3: pantalla "Actas" con historial y búsqueda por tipo, número, fechas, funcionario, código de equipo y texto; cada acta se abre e imprime en su formato. También aparecen en la ficha del funcionario y del activo.
- P4: entrega se crea desde la ficha del funcionario, con sus equipos actuales precargados; no cambia asignaciones.
- P5: egreso se crea desde la ficha de un activo o desde Actas eligiendo varios equipos; opcionalmente traslada los equipos a la ubicación de destino en la misma operación.
- P6: baja se crea desde la ficha del activo; guardar el acta también da de baja el equipo en la misma operación (cierra su asignación), si aún no lo está.
- P7: la foto de la baja se reduce en el navegador (≈1600 px, JPEG) y se guarda dentro de la base, para que entre en los respaldos.
- P8: Configuración tendrá código, versión, fecha de emisión y firmantes del pie por cada formato, precargados con los de los PDF.
- P9: se agrega el correo al funcionario (campo opcional) para precargarlo en las actas.
- P10 (cambiada por L3): las actas se pueden editar y no se borran.
- A1 (supuesto, para que el historial siga siendo confiable): cada edición guarda la versión anterior del acta con su fecha; la ficha del acta muestra que fue editada y permite ver versiones anteriores.

## Tasks

- [x] T1 (P1,P2,P8,P9,P10,A1) ruta: inline — modelo y migración: actas, actas_activos, actas_versiones, formatos_acta, correo en funcionarios; dominio de actas (crear con consecutivo, editar guardando versión) con tests en SQLite en memoria.
- [x] T2 (P6,P5) ruta: inline — baja y egreso en una sola transacción con darDeBaja/trasladar (versiones que reciben la transacción), con tests.
- [ ] T3 (S3,P1) ruta: inline — formatos impresos de las tres actas (fieles a los PDF) a partir del snapshot; comparación visual.
- [ ] T4 (P3,P4,P5,P6,P7) ruta: inline — formularios con precarga, foto reducida en el navegador, pantalla Actas con búsqueda, enlaces desde fichas, edición con versiones.
- [ ] T5 (P8,P9) ruta: inline — configuración por formato y correo del funcionario en su formulario.
- [ ] T6 ruta: inline — verificación completa y verificador independiente (item 1).

## Log

- L1 (2026-11-16, usuario): "Quiero implementar para que me genere las Actas de entrega, egreso y baja, ya te paso los formatos para que los revises, LISTI YA TE LOS ADJUNTE"
- L2 (2026-11-16, usuario): "La idea es que quede guardada como un historial y se tienen alguna duda yo la busco, me han pasado varios incovenientes por no tenerlas guardadas"
- Riesgo anticipado: item 1 (migración: tablas nuevas y columna nueva en funcionarios; dar de baja desde el acta modifica datos existentes).
- L3 (2026-11-16, usuario): "Si, yo las puedo editar" → propuesta aprobada con P10 cambiada: las actas se pueden editar. Se agrega A1 (versiones anteriores) como supuesto.
- L4 (2026-11-16): T1+T2 hechas. RED observado (módulo inexistente, luego 7 fallas de baja/egreso); GREEN 17 tests de actas, suite 136/136, tsc limpio. Migración 0001 solo aditiva (4 tablas nuevas + funcionarios.correo). Formatos sin firmantes por defecto (no se versionan nombres reales); se completan en Configuración. Egreso con traslado: asigna disponibles, traslada asignados, deja igual los que ya están en destino. docs/*.pdf a .gitignore.
