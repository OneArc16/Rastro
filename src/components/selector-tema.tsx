"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { ThemeToggler, type ThemeSelection } from "@animate-ui/react/primitives/effects/theme-toggler";
import { cn } from "@/lib/utils";

const SIGUIENTE: Record<ThemeSelection, ThemeSelection> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const ETIQUETA: Record<ThemeSelection, string> = {
  light: "Tema claro",
  dark: "Tema oscuro",
  system: "Tema del sistema",
};

const ICONO = { light: Sun, dark: Moon, system: Monitor } as const;

const sinSuscripcion = () => () => {};

/** Cambia entre claro, oscuro y el tema del sistema. Solo se dibuja ya montado (el tema se conoce en el cliente). */
export function SelectorTema({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false);

  if (!montado) return <span className={cn("inline-block size-9", className)} aria-hidden />;

  const actual = (theme ?? "system") as ThemeSelection;
  const resuelto = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <ThemeToggler theme={actual} resolvedTheme={resuelto} setTheme={setTheme} direction="ltr">
      {({ effective, toggleTheme }) => {
        const Icono = ICONO[effective];
        return (
          <button
            type="button"
            onClick={() => toggleTheme(SIGUIENTE[effective])}
            title={`${ETIQUETA[effective]} (tocar para cambiar)`}
            aria-label={`${ETIQUETA[effective]}. Cambiar tema`}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg transition-colors",
              className,
            )}
          >
            <Icono className="size-4" />
          </button>
        );
      }}
    </ThemeToggler>
  );
}
