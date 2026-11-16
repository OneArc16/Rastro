import type { Metadata } from "next";
import { db } from "@/db";
import { obtenerConfiguracion } from "@/db/consultas";
import { TIPOS_ACTA } from "@/db/schema";
import { obtenerFormatoActa } from "@/dominio/actas";
import { FormularioFormatoActa } from "@/components/actas/formulario-formato-acta";
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

      <section className="max-w-3xl space-y-4 pt-4">
        <h2 className="text-lg font-semibold">Formatos de actas</h2>
        <p className="text-sm text-muted-foreground">
          Cada acta copia estos datos al crearse: cambiarlos no modifica las actas ya guardadas.
        </p>
        {TIPOS_ACTA.map((tipo) => (
          <FormularioFormatoActa key={tipo} tipo={tipo} formato={obtenerFormatoActa(db, tipo)} />
        ))}
      </section>
    </div>
  );
}
