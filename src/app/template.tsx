import type { ReactNode } from "react";

/**
 * Se vuelve a montar en cada navegación: entrada suave de la página.
 * Es CSS (no Motion) para que el contenido nunca quede a medio aparecer al imprimir;
 * en @media print las animaciones se desactivan (globals.css) y con "reducir movimiento" no se anima.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:ease-out">{children}</div>
  );
}
