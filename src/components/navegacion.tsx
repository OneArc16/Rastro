"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Home,
  Monitor,
  Users,
  MapPin,
  Wrench,
  Settings,
  Menu,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SelectorTema } from "@/components/selector-tema";

const ENLACES = [
  { href: "/", etiqueta: "Inicio", icono: Home },
  { href: "/inventario", etiqueta: "Inventario", icono: Monitor },
  { href: "/funcionarios", etiqueta: "Funcionarios", icono: Users },
  { href: "/ubicaciones", etiqueta: "Ubicaciones", icono: MapPin },
  { href: "/mantenimientos", etiqueta: "Mantenimientos", icono: Wrench },
  { href: "/etiquetas", etiqueta: "Etiquetas QR", icono: QrCode },
  { href: "/configuracion", etiqueta: "Configuración", icono: Settings },
] as const;

function esActivo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Lista de secciones; el fondo de la activa se desliza entre opciones (layoutId de Motion). */
function ListaEnlaces({ id, alNavegar }: { id: string; alNavegar?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ENLACES.map(({ href, etiqueta, icono: Icono }) => {
        const activo = esActivo(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={alNavegar}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              activo
                ? "text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            {activo && (
              <motion.span
                layoutId={`seccion-activa-${id}`}
                className="absolute inset-0 rounded-lg bg-sidebar-primary shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icono className="relative size-4" />
            <span className="relative">{etiqueta}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Marca() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex h-9 items-center rounded-lg bg-white px-2 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo de la empresa, archivo local */}
        <img src="/logo.png" alt="SISM" className="h-6 w-auto" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-sidebar-accent-foreground">
        Rastro
      </span>
    </Link>
  );
}

/** Barra lateral fija en escritorio. */
export function BarraLateral() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex print:hidden">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Marca />
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <ListaEnlaces id="lateral" />
      </div>
      <div className="flex items-center justify-between border-t border-sidebar-border px-5 py-3 text-xs">
        <span>Inventario de tecnología</span>
        <SelectorTema className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
      </div>
    </aside>
  );
}

/** Barra superior con menú desplegable en móvil. */
export function BarraMovil() {
  const [abierto, setAbierto] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-sidebar px-3 text-sidebar-foreground shadow-md md:hidden print:hidden">
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir menú"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Menu className="size-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="border-b border-sidebar-border px-5 py-4">
            <SheetTitle className="text-left">
              <Marca />
            </SheetTitle>
          </SheetHeader>
          <div className="p-3">
            <ListaEnlaces id="movil" alNavegar={() => setAbierto(false)} />
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <Marca />
      </div>
      <SelectorTema className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
    </header>
  );
}
