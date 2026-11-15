"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

function ListaEnlaces({ alNavegar }: { alNavegar?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ENLACES.map(({ href, etiqueta, icono: Icono }) => (
        <Link
          key={href}
          href={href}
          onClick={alNavegar}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            esActivo(pathname, href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icono className="h-4 w-4" />
          {etiqueta}
        </Link>
      ))}
    </nav>
  );
}

/** Barra lateral fija en escritorio. */
export function BarraLateral() {
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-background md:flex md:flex-col print:hidden">
      <div className="flex h-14 items-center border-b px-5">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Rastro
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <ListaEnlaces />
      </div>
    </aside>
  );
}

/** Barra superior con menú desplegable en móvil. */
export function BarraMovil() {
  const [abierto, setAbierto] = useState(false);
  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden print:hidden">
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Abrir menú">
              <Menu className="h-5 w-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b px-5 py-3">
            <SheetTitle className="text-left text-lg font-bold">Rastro</SheetTitle>
          </SheetHeader>
          <div className="p-3">
            <ListaEnlaces alNavegar={() => setAbierto(false)} />
          </div>
        </SheetContent>
      </Sheet>
      <span className="text-lg font-bold tracking-tight">Rastro</span>
    </header>
  );
}
