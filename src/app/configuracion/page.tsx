import type { Metadata } from "next";
import { obtenerConfiguracion } from "@/db/consultas";
import { FormularioConfiguracion } from "@/components/configuracion/formulario-configuracion";

export const metadata: Metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

export default function PaginaConfiguracion() {
  const configuracion = obtenerConfiguracion();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
      <p className="text-sm text-muted-foreground">
        Datos fijos que se imprimen en el encabezado y las firmas de todas las hojas de vida.
      </p>
      <FormularioConfiguracion configuracion={configuracion} />
    </div>
  );
}
