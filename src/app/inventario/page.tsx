import type { Metadata } from "next";
import { listarActivos } from "@/db/consultas";
import { Download } from "lucide-react";
import { BotonEnlace } from "@/components/boton-enlace";
import { Button } from "@/components/ui/button";
import { TablaInventario } from "@/components/inventario/tabla-inventario";

export const metadata: Metadata = { title: "Inventario" };
export const dynamic = "force-dynamic";

export default function PaginaInventario() {
  const activos = listarActivos();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
        <div className="flex flex-wrap gap-2">
          {/* Enlace normal y no <Link>: la ruta devuelve un archivo, no una página */}
          <Button variant="outline" nativeButton={false} render={<a href="/inventario/excel" download />}>
            <Download />
            Descargar Excel
          </Button>
          <BotonEnlace href="/activos/nuevo">Nuevo activo</BotonEnlace>
        </div>
      </div>
      <TablaInventario datos={activos} />
    </div>
  );
}
