import type { Metadata } from "next";
import {
  alertasDeMantenimiento,
  listarActivosParaMantenimiento,
  listarMantenimientos,
} from "@/db/consultas";
import { DIAS_AVISO_MANTENIMIENTO } from "@/dominio/mantenimientos";
import { DialogoMantenimiento } from "@/components/mantenimientos/dialogo-mantenimiento";
import { ListaPendientes } from "@/components/mantenimientos/lista-pendientes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ETIQUETAS_MANTENIMIENTO, ETIQUETAS_TIPO } from "@/lib/etiquetas";
import { formatearFecha, hoyIso } from "@/lib/fechas";

export const metadata: Metadata = { title: "Mantenimientos" };
export const dynamic = "force-dynamic";

export default function PaginaMantenimientos() {
  const hoy = hoyIso();
  const { vencidos, proximos } = alertasDeMantenimiento(hoy);
  const filas = listarMantenimientos();
  const opcionesActivos = listarActivosParaMantenimiento().map((a) => ({
    valor: String(a.id),
    etiqueta: [a.codigo, ETIQUETAS_TIPO[a.tipo], a.marca, a.modelo].filter(Boolean).join(" · "),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Mantenimientos</h1>
        <DialogoMantenimiento activos={opcionesActivos} varianteDisparador="default" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vencidos ({vencidos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ListaPendientes
              pendientes={vencidos}
              hoy={hoy}
              vacio="No hay mantenimientos vencidos."
              conRegistro
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              Próximos {DIAS_AVISO_MANTENIMIENTO} días ({proximos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ListaPendientes
              pendientes={proximos}
              hoy={hoy}
              vacio="No hay mantenimientos próximos."
              conRegistro
            />
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold">Historial</h2>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Activo</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Próxima</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Observación</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((mantenimiento) => (
              <tr key={mantenimiento.id} className="border-b last:border-0">
                <td className="px-4 py-3">{formatearFecha(mantenimiento.fecha)}</td>
                <td className="px-4 py-3">
                  <span className="font-mono font-medium">
                    {mantenimiento.activoCodigo}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {[mantenimiento.activoMarca, mantenimiento.activoModelo]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={mantenimiento.tipo === "preventivo" ? "default" : "secondary"}
                  >
                    {ETIQUETAS_MANTENIMIENTO[mantenimiento.tipo]}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {formatearFecha(mantenimiento.proximaFecha)}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {mantenimiento.observacion ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
