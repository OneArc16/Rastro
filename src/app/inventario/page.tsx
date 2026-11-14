import type { Metadata } from "next";
import { listarActivos } from "@/db/consultas";
import { ETIQUETAS_ESTADO, ETIQUETAS_TIPO } from "@/lib/etiquetas";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Inventario" };
export const dynamic = "force-dynamic";

const VARIANTE_ESTADO = {
  operativo: "default",
  en_reparacion: "secondary",
  dado_de_baja: "outline",
} as const;

export default function PaginaInventario() {
  const filas = listarActivos();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Marca / Modelo</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Serial</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Asignado a</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((activo) => (
              <tr key={activo.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono font-medium">{activo.codigo}</td>
                <td className="px-4 py-3">{ETIQUETAS_TIPO[activo.tipo]}</td>
                <td className="px-4 py-3">
                  {[activo.marca, activo.modelo].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs sm:table-cell">
                  {activo.serial ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={VARIANTE_ESTADO[activo.estado]}>
                    {ETIQUETAS_ESTADO[activo.estado]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {activo.responsable ?? activo.ubicacion ?? (
                    <span className="text-muted-foreground">Disponible</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
