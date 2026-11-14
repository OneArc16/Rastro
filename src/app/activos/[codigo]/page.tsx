import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerFichaActivo } from "@/db/consultas";
import { DetalleSpecs } from "@/components/activos/detalle-specs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ETIQUETAS_ESTADO,
  ETIQUETAS_MANTENIMIENTO,
  ETIQUETAS_TIPO,
} from "@/lib/etiquetas";
import { formatearFecha } from "@/lib/fechas";
import { formatearPesos } from "@/lib/moneda";

export const metadata: Metadata = { title: "Ficha de activo" };
export const dynamic = "force-dynamic";

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="text-right font-medium">{valor}</dd>
    </div>
  );
}

export default async function PaginaFichaActivo({
  params,
}: PageProps<"/activos/[codigo]">) {
  const { codigo } = await params;
  const ficha = obtenerFichaActivo(decodeURIComponent(codigo));
  if (!ficha) notFound();

  const { activo, historial, mantenimientos, asignacionVigente } = ficha;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-2xl font-bold tracking-tight">
            {activo.codigo}
          </h1>
          <Badge variant="secondary">{ETIQUETAS_TIPO[activo.tipo]}</Badge>
          <Badge variant={activo.estado === "operativo" ? "default" : "outline"}>
            {ETIQUETAS_ESTADO[activo.estado]}
          </Badge>
        </div>
        {activo.estado !== "dado_de_baja" && (
          <Button
            variant="outline"
            render={<Link href={`/activos/${activo.codigo}/editar`}>Editar</Link>}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos generales</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <Dato etiqueta="Marca" valor={activo.marca ?? "—"} />
              <Dato etiqueta="Modelo" valor={activo.modelo ?? "—"} />
              <Dato etiqueta="Serial" valor={activo.serial ?? "—"} />
              <Dato etiqueta="Color" valor={activo.color ?? "—"} />
              <Dato etiqueta="Valor" valor={formatearPesos(activo.valor)} />
              <Dato
                etiqueta="Fecha de compra"
                valor={formatearFecha(activo.fechaCompra)}
              />
              <Dato
                etiqueta="Garantía hasta"
                valor={formatearFecha(activo.garantiaHasta)}
              />
            </dl>
            {activo.observaciones && (
              <p className="mt-4 text-sm text-muted-foreground">
                {activo.observaciones}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsable actual</CardTitle>
          </CardHeader>
          <CardContent>
            {asignacionVigente ? (
              <dl className="space-y-2">
                <Dato
                  etiqueta={asignacionVigente.funcionario ? "Funcionario" : "Ubicación"}
                  valor={
                    asignacionVigente.funcionario ??
                    asignacionVigente.ubicacion ??
                    "—"
                  }
                />
                <Dato
                  etiqueta="Desde"
                  valor={formatearFecha(asignacionVigente.fechaDesde)}
                />
                <Dato etiqueta="Motivo" valor={asignacionVigente.motivo ?? "—"} />
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                Disponible: sin asignación vigente.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Especificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <DetalleSpecs tipo={activo.tipo} specs={activo.specs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de asignaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {historial.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin asignaciones.</p>
            ) : (
              <ul className="space-y-3">
                {historial.map((asignacion) => (
                  <li key={asignacion.id} className="text-sm">
                    <p className="font-medium">
                      {asignacion.funcionario ?? asignacion.ubicacion}
                      {asignacion.fechaHasta === null && (
                        <Badge className="ml-2" variant="default">
                          Vigente
                        </Badge>
                      )}
                    </p>
                    <p className="text-muted-foreground">
                      {formatearFecha(asignacion.fechaDesde)}
                      {" → "}
                      {asignacion.fechaHasta
                        ? formatearFecha(asignacion.fechaHasta)
                        : "hoy"}
                      {asignacion.motivo ? ` · ${asignacion.motivo}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mantenimientos</CardTitle>
          </CardHeader>
          <CardContent>
            {mantenimientos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin mantenimientos.</p>
            ) : (
              <ul className="space-y-3">
                {mantenimientos.map((mantenimiento) => (
                  <li key={mantenimiento.id} className="text-sm">
                    <p className="font-medium">
                      {formatearFecha(mantenimiento.fecha)} ·{" "}
                      {ETIQUETAS_MANTENIMIENTO[mantenimiento.tipo]}
                    </p>
                    <p className="text-muted-foreground">
                      {mantenimiento.observacion ?? "Sin observación"}
                      {mantenimiento.proximaFecha
                        ? ` · Próximo: ${formatearFecha(mantenimiento.proximaFecha)}`
                        : ""}
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
