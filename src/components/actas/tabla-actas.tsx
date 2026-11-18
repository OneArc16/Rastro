import Link from "next/link";
import { FileCheck2, FileClock } from "lucide-react";
import type { FilaActa } from "@/db/busqueda-actas";
import { Badge } from "@/components/ui/badge";
import { TIPOS_ACTA_CORTOS } from "@/lib/actas";
import { formatearFecha } from "@/lib/fechas";

/** Listado de actas; cada fila abre el acta en su formato. */
export function TablaActas({ actas, vacio }: { actas: FilaActa[]; vacio: string }) {
  if (actas.length === 0) return <p className="text-sm text-muted-foreground">{vacio}</p>;

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-4 py-3 font-medium">Acta</th>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Responsable / destino</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Equipos</th>
          </tr>
        </thead>
        <tbody>
          {actas.map((acta) => (
            <tr key={acta.id} className="border-b last:border-0">
              <td className="px-4 py-3">
                <Link href={`/actas/${acta.id}`} className="font-medium underline-offset-4 hover:underline">
                  {acta.codigo}
                </Link>{" "}
                <Badge variant="secondary">{TIPOS_ACTA_CORTOS[acta.tipo]}</Badge>
                {acta.editadaEn && (
                  <Badge variant="outline" className="ml-1">
                    Editada
                  </Badge>
                )}
                {acta.escaneos > 0 ? (
                  <Badge variant="outline" className="ml-1 gap-1">
                    <FileCheck2 aria-hidden /> Firmada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-1 gap-1 text-muted-foreground">
                    <FileClock aria-hidden /> Sin firmar
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3">{formatearFecha(acta.fecha)}</td>
              <td className="hidden px-4 py-3 sm:table-cell">
                {acta.funcionario ?? acta.ubicacion ?? "—"}
              </td>
              <td className="hidden px-4 py-3 md:table-cell">{acta.equipos ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
