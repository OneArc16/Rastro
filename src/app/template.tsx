import type { ReactNode } from "react";

/**
 * Se vuelve a montar en cada navegación: entrada suave de la página.
 * Es CSS (no Motion) para que el contenido nunca quede a medio aparecer al imprimir;
 * en @media print las animaciones se desactivan (globals.css).
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out">{children}</div>
  );
}
