import type { Metadata } from "next";
import { obtenerConfiguracion } from "@/db/consultas";
import { formatearFecha } from "@/lib/fechas";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span className="text-right font-medium">{valor ?? "—"}</span>
    </div>
  );
}

export default function PaginaConfiguracion() {
  const config = obtenerConfiguracion();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
      <p className="text-sm text-muted-foreground">
        Datos fijos que se imprimen en la hoja de vida. La edición llega en la
        fase 4.
      </p>

      {config ? (
        <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Formato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Dato etiqueta="Código" valor={config.codigoFormato} />
              <Dato etiqueta="Versión" valor={config.versionFormato} />
              <Dato
                etiqueta="Fecha de emisión"
                valor={formatearFecha(config.fechaEmision)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Firmas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Dato
                etiqueta="Elaborado por"
                valor={
                  config.elaboradoNombre &&
                  `${config.elaboradoNombre} — ${config.elaboradoCargo ?? ""}`
                }
              />
              <Dato
                etiqueta="Revisado por"
                valor={
                  config.revisadoNombre &&
                  `${config.revisadoNombre} — ${config.revisadoCargo ?? ""}`
                }
              />
              <Dato
                etiqueta="Aprobado por"
                valor={
                  config.aprobadoNombre &&
                  `${config.aprobadoNombre} — ${config.aprobadoCargo ?? ""}`
                }
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aún no hay configuración registrada.
        </p>
      )}
    </div>
  );
}
