import type { Metadata } from "next";
import { listarActivos } from "@/db/consultas";
import { BotonEnlace } from "@/components/boton-enlace";
import { TablaInventario } from "@/components/inventario/tabla-inventario";

export const metadata: Metadata = { title: "Inventario" };
export const dynamic = "force-dynamic";

export default function PaginaInventario() {
  const activos = listarActivos();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
        <BotonEnlace href="/activos/nuevo">Nuevo activo</BotonEnlace>
      </div>
      <TablaInventario datos={activos} />
    </div>
  );
}
