"use client";

import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Duración de cada aviso; la barra inferior se vacía en este mismo tiempo. */
const DURACION_MS = 4500;

/**
 * Avisos con la estética de Rastro: tarjeta con una franja de color por tipo,
 * ícono en una placa teñida y una barra que muestra cuánto falta para cerrarse.
 * Los estilos viven en globals.css bajo `.aviso`.
 */
export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      duration={DURACION_MS}
      gap={10}
      visibleToasts={4}
      closeButton
      icons={{
        success: <CircleCheck />,
        error: <CircleAlert />,
        warning: <TriangleAlert />,
        info: <Info />,
        loading: <LoaderCircle className="animate-spin" />,
      }}
      style={{ "--duracion-aviso": `${DURACION_MS}ms` } as React.CSSProperties}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "aviso",
          icon: "aviso-icono",
          content: "aviso-contenido",
          title: "aviso-titulo",
          description: "aviso-descripcion",
          closeButton: "aviso-cerrar",
          actionButton: "aviso-accion",
          cancelButton: "aviso-cancelar",
        },
      }}
      {...props}
    />
  );
}
