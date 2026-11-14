import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerFichaFuncionario } from "@/db/consultas";
import { DialogoRetiro } from "@/components/funcionarios/dialogo-retiro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ETIQUETAS_TIPO } from "@/lib/etiquetas";
import { formatearFecha } from "@/lib/fechas";

export const metadata: Metadata = { title: "Ficha de funcionario" };
export const dynamic = "force-dynamic";

function describirActivo(a: { activoMarca: string | null; activoModelo: string | null }) {
  return [a.activoMarca, a.activoModelo].filter(Boolean).join(" ");
}

export default async function PaginaFichaFuncionario({
  params,
}: PageProps<"/funcionarios/[id]">) {
  const { id } = await params;
  const idNumerico = Number.parseInt(id, 10);
  const ficha = Number.isNaN(idNumerico) ? null : obtenerFichaFuncionario(idNumerico);
  if (!ficha) notFound();

  const { funcionario, vigentes, historial } = ficha;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{funcionario.nombre}</h1>
          {funcionario.retirado && <Badge variant="outline">Retirado</Badge>}
        </div>
        {!funcionario.retirado && (
          <div className="flex flex-wrap gap-2">
            <Button
              render={
                <Link href={`/funcionarios/${funcionario.id}/hoja-de-vida`}>
                  Hoja de vida
                </Link>
              }
            />
            <Button
              variant="outline"
              render={<Link href={`/funcionarios/${funcionario.id}/editar`}>Editar</Link>}
            />
            <DialogoRetiro
              funcionario={{ id: funcionario.id, nombre: funcionario.nombre }}
              equiposVigentes={vigentes.length}
            />
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {[funcionario.cargo, funcionario.ubicacion, funcionario.telefono]
          .filter(Boolean)
          .join(" · ") || "Sin datos de contacto"}
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Equipos asignados</CardTitle>
          </CardHeader>
          <CardContent>
            {vigentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin equipos asignados.</p>
            ) : (
              <ul className="space-y-3">
                {vigentes.map((v) => (
                  <li key={v.id} className="text-sm">
                    <Link
                      href={`/activos/${v.activoCodigo}`}
                      className="font-mono font-medium underline-offset-4 hover:underline"
                    >
                      {v.activoCodigo}
                    </Link>{" "}
                    <span className="text-muted-foreground">
                      {ETIQUETAS_TIPO[v.activoTipo]} {describirActivo(v)}
                    </span>
                    <p className="text-muted-foreground">
                      Desde {formatearFecha(v.fechaDesde)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de asignaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {historial.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin historial.</p>
            ) : (
              <ul className="space-y-3">
                {historial.map((h) => (
                  <li key={h.id} className="text-sm">
                    <p className="font-medium">
                      <Link
                        href={`/activos/${h.activoCodigo}`}
                        className="font-mono underline-offset-4 hover:underline"
                      >
                        {h.activoCodigo}
                      </Link>{" "}
                      <span className="font-normal text-muted-foreground">
                        {ETIQUETAS_TIPO[h.activoTipo]}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      {formatearFecha(h.fechaDesde)} →{" "}
                      {h.fechaHasta ? formatearFecha(h.fechaHasta) : "hoy"}
                      {h.motivo ? ` · ${h.motivo}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
