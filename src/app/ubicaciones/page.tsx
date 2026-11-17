import type { Metadata } from "next";
import { listarUbicaciones } from "@/db/consultas";
import { DialogoUbicacion } from "@/components/ubicaciones/dialogo-ubicacion";
import { ListaUbicaciones } from "@/components/ubicaciones/lista-ubicaciones";

export const metadata: Metadata = { title: "Ubicaciones" };
export const dynamic = "force-dynamic";

export default function PaginaUbicaciones() {
  const filas = listarUbicaciones();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Ubicaciones</h1>
        <DialogoUbicacion />
      </div>

      <ListaUbicaciones filas={filas} />
    </div>
  );
}
