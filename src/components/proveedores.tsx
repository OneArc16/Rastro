"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { CLAVE_TEMA } from "@/lib/tema";

/** Tema claro/oscuro (clase .dark en <html>) y animaciones que respetan "reducir movimiento". */
export function Proveedores({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={CLAVE_TEMA}
      themes={["light", "dark"]}
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeProvider>
  );
}
