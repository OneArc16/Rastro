# Rediseño de la interfaz (Rastro)

Objetivo: interfaz moderna y cómoda, con identidad de la empresa, animaciones y componentes de librería; sin tocar los formatos impresos.
Branch: rediseno-ui (sobre master 2546552). Delivery: ask-on-risk. Test runner: vitest + revisión visual con Chromium sin interfaz.

## Specs

- S1: "Vamos a mejorar el diseño front, para que no sea blanco simplon, vamos a darle un diseño moderno y comodo, usando librerias de diseños para los botones y animaciones"
- S2 (restricción del plan): la hoja de vida es "un formato aprobado y no se rediseña"; "La vista en pantalla debe ser idéntica a lo que se imprime". Las etiquetas QR también son un formato impreso.
- S3 (restricción del plan): "Toda la interfaz va en español"; "En el celular se usa recorriendo las oficinas, así que las pantallas deben funcionar bien en móvil."
- S4 (restricción del plan): "Los datos no salen de la máquina: nada de servicios en la nube, analítica ni APIs externas."

## Decisiones

- D1: librerías: Motion (motion/react) para animaciones; Animate UI (@animate-ui/react) para animar los componentes de shadcn existentes (tiene variante Base UI, que es la del proyecto); next-themes para modo claro/oscuro. Todas se instalan con pnpm y se sirven desde la app (S4).
- D2: paleta tomada del logo (public/logo.png, píxeles medidos): azul #10509A como color principal, rojo #C02030 para alertas y acciones destructivas.
- D3: modo oscuro con selector; por defecto sigue la preferencia del sistema.
- D4: animaciones moderadas y con `reducedMotion="user"` (respeta la preferencia "reducir movimiento" del sistema).
- D5: la hoja de vida y las etiquetas QR conservan su CSS propio (colores fijos, fondo blanco) y se verifica que su impresión no cambie.

## Tasks

- [x] T1 (S1,D2,D3) ruta: inline — tokens claro/oscuro con la paleta del logo (convertida a OKLCH), success/warning nuevos, radio 0.75rem, tarjeta con sombra sutil; next-themes (attribute class, sistema por defecto) con SelectorTema (ThemeToggler de Animate UI).
- [x] T2 (S1,D1) ruta: inline — motion 14.14.0, @animate-ui/react 2.4.5, next-themes 0.4.6. animate-ui CLI (dry-run y luego real) animó checkbox, dialog, select y sheet (solo cambia el import). Button envuelto en RippleButton (onda + escala al tocar), alto 36 px.
- [x] T3 (S1,S3) ruta: inline — barra lateral azul marino con logo, indicador de sección con layoutId de Motion, barra móvil con selector de tema, template.tsx con entrada CSS por página, contenido con ancho máximo.
- [x] T4 (S1) ruta: inline — Indicador con ícono, tono y CountingNumber (resorte firme), entrada escalonada; Badge success/warning y VARIANTE_ESTADO centralizada en lib/etiquetas.ts.
- [x] T5 (S2,S3) ruta: inline — 113 tests, tsc, lint 0 errores, build. Capturas antes/después en claro, oscuro y 390 px sin desbordes ni errores de consola. Hoja de vida y etiquetas impresas en tema claro y oscuro: texto idéntico y 0 % de píxeles distintos contra la referencia previa. Selector de tema probado (sistema → claro → oscuro → sistema).

## Log

- L1 (2026-11-15, usuario): "Vamos a mejorar el diseño front, para que no sea blanco simplon, vamos a darle un diseño moderno y comodo, usando librerias de diseños para los botones y animaciones"
- 2026-11-15: hallazgos corregidos durante la verificación: (1) el contador de Animate UI tardaba ~6 s en llegar al valor real → resorte firme (~1 s). (2) Imprimir con tema oscuro dejaba márgenes negros: next-themes pone color-scheme: dark en línea en <html> y Chrome pinta los márgenes según ese esquema → @media print con color-scheme: light !important. (3) RippleButton fija position: relative en línea y movía la X de diálogos y menú móvil → style={{ position: undefined }} para que decidan las clases.
- 2026-11-15: licencia de @animate-ui/react: MIT + Commons Clause (uso libre dentro de una aplicación, incluso comercial; prohíbe vender o redistribuir los componentes en sí). Compatible con una app interna.
- Risk: item 5 (tres dependencias nuevas, una con licencia no estándar) y cambio global de la interfaz. Requiere verificador independiente.
