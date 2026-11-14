import type { Metadata } from "next";
import Link from "next/link";
import { listarActivos } from "@/db/consultas";
import { TablaInventario } from "@/components/inventario/tabla-inventario";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Inventario" };
export const dynamic = "force-dynamic";

export default function PaginaInventario() {
  const activos = listarActivos();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
        <Button render={<Link href="/activos/nuevo">Nuevo activo</Link>} />
      </div>
      <TablaInventario datos={activos} />
    </div>
  );
}
