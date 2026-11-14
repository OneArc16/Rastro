import type { Metadata } from "next";
import { listarUbicaciones } from "@/db/consultas";
import { DialogoUbicacion } from "@/components/ubicaciones/dialogo-ubicacion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filas.map((ubicacion) => (
          <Card key={ubicacion.id}>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle className="text-base">{ubicacion.nombre}</CardTitle>
              <DialogoUbicacion
                ubicacion={{ id: ubicacion.id, nombre: ubicacion.nombre }}
              />
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {ubicacion.funcionarios}{" "}
              {ubicacion.funcionarios === 1 ? "funcionario" : "funcionarios"}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
