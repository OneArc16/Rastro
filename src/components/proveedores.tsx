"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { CLAVE_TEMA } from "@/lib/tema";

/** Tema claro/oscuro (clase .dark en <html>), animaciones que respetan "reducir movimiento" y avisos. */
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
      <Toaster />
    </ThemeProvider>
  );
}
