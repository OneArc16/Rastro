/* eslint-disable @next/next/no-img-element -- el logo debe imprimirse tal cual, sin optimización */
import type { ReactNode } from "react";
import { Arimo, Carlito, Questrial } from "next/font/google";
import "./actas.css";

// Se descargan al compilar y se sirven desde la propia app: no hay peticiones externas en uso.
// Arimo y Carlito tienen las mismas medidas que Arial y Calibri.
const arial = Arimo({ weight: ["400", "700"], subsets: ["latin"], variable: "--fuente-arial" });
export const calibri = Carlito({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--fuente-calibri",
});
const gothic = Questrial({ weight: "400", subsets: ["latin"], variable: "--fuente-gothic" });

const FUENTES = `${arial.variable} ${calibri.variable} ${gothic.variable}`;

/** Anchos de columna medidos sobre el formato original, en porcentaje. */
export function Columnas({ anchos }: { anchos: number[] }) {
  return (
    <colgroup>
      {anchos.map((ancho, i) => (
        <col key={i} style={{ width: `${ancho}%` }} />
      ))}
    </colgroup>
  );
}

export function Logo() {
  return <img src="/logo.png" alt="Logo de la empresa" className="ac-logo" />;
}

/** Una página carta del formato; el pie va siempre al final de la hoja. */
export function Hoja({
  formato,
  pie,
  children,
}: {
  formato: "entrega" | "egreso" | "baja";
  pie: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className={`ac-hoja ac-${formato}`}>
      <div className="ac-cuerpo">{children}</div>
      <div className="ac-pie">{pie}</div>
    </article>
  );
}

export function Hojas({ children }: { children: ReactNode }) {
  return (
    <div className={`ac-contenedor ${FUENTES}`}>
      {/* Solo mientras se muestra un acta: los márgenes van dentro de cada hoja.
          Al salir de la página React quita este estilo y vuelve la regla general. */}
      <style>{"@page { size: letter; margin: 0; }"}</style>
      <div className="ac-hojas">{children}</div>
    </div>
  );
}

/** Texto libre que respeta los saltos de línea escritos en el formulario. */
export function TextoLibre({ texto }: { texto: string }) {
  return <span className="ac-texto">{texto}</span>;
}
