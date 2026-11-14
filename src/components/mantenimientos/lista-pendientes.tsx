import Link from "next/link";
import type { Pendiente } from "@/dominio/mantenimientos";
import { DialogoMantenimiento } from "@/components/mantenimientos/dialogo-mantenimiento";
import { Badge } from "@/components/ui/badge";
import { ETIQUETAS_MANTENIMIENTO } from "@/lib/etiquetas";
import { diasEntre, formatearFecha } from "@/lib/fechas";

function textoPlazo(hoy: string, fecha: string): string {
  const dias = diasEntre(hoy, fecha);
  if (dias === 0) return "hoy";
  if (dias > 0) return dias === 1 ? "en 1 día" : `en ${dias} días`;
  return dias === -1 ? "hace 1 día" : `hace ${-dias} días`;
}

/** Lista de mantenimientos pendientes; con `conRegistro` cada fila permite registrarlo. */
export function ListaPendientes({
  pendientes,
  hoy,
  vacio,
  conRegistro = false,
}: {
  pendientes: Pendiente[];
  hoy: string;
  vacio: string;
  conRegistro?: boolean;
}) {
  if (pendientes.length === 0) {
    return <p className="text-sm text-muted-foreground">{vacio}</p>;
  }

  return (
    <ul className="divide-y">
      {pendientes.map((p) => (
        <li key={p.activoId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
          <div>
            <Link
              href={`/activos/${p.codigo}`}
              className="font-mono font-medium underline-offset-4 hover:underline"
            >
              {p.codigo}
            </Link>{" "}
            <Badge variant="outline">{ETIQUETAS_MANTENIMIENTO[p.tipo]}</Badge>
            <p className="text-muted-foreground">
              Próximo: {formatearFecha(p.proximaFecha)} ({textoPlazo(hoy, p.proximaFecha)}) ·
              último: {formatearFecha(p.ultimaFecha)}
            </p>
          </div>
          {conRegistro && (
            <DialogoMantenimiento
              activo={{ id: p.activoId, codigo: p.codigo }}
              textoDisparador="Registrar"
            />
          )}
        </li>
      ))}
    </ul>
  );
}
