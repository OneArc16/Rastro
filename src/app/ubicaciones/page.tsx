import type { Metadata } from "next";
import Link from "next/link";
import { listarUbicaciones } from "@/db/consultas";
import { ETIQUETAS_TIPO } from "@/lib/etiquetas";
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
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Funcionarios</p>
                {ubicacion.funcionarios.length === 0 ? (
                  <p>—</p>
                ) : (
                  <ul>
                    {ubicacion.funcionarios.map((f) => (
                      <li key={f.id}>
                        <Link
                          href={`/funcionarios/${f.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {f.nombre}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-muted-foreground">Equipos compartidos</p>
                {ubicacion.equiposCompartidos.length === 0 ? (
                  <p>—</p>
                ) : (
                  <ul>
                    {ubicacion.equiposCompartidos.map((e) => (
                      <li key={e.codigo}>
                        <Link
                          href={`/activos/${e.codigo}`}
                          className="font-mono underline-offset-4 hover:underline"
                        >
                          {e.codigo}
                        </Link>{" "}
                        <span className="text-muted-foreground">
                          {ETIQUETAS_TIPO[e.tipo]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
