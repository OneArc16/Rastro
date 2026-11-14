import type { Metadata } from "next";
import { listarMantenimientos } from "@/db/consultas";
import { ETIQUETAS_MANTENIMIENTO } from "@/lib/etiquetas";
import { formatearFecha } from "@/lib/fechas";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Mantenimientos" };
export const dynamic = "force-dynamic";

export default function PaginaMantenimientos() {
  const filas = listarMantenimientos();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mantenimientos</h1>

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
