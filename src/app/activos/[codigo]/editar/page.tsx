import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obtenerFichaActivo, propuestasDeCodigo } from "@/db/consultas";
import { FormularioActivo } from "@/components/activos/formulario-activo";
import { BotonEnlace } from "@/components/boton-enlace";

export const metadata: Metadata = { title: "Editar activo" };
export const dynamic = "force-dynamic";

export default async function PaginaEditarActivo({
  params,
}: PageProps<"/activos/[codigo]/editar">) {
  const { codigo } = await params;
  const ficha = obtenerFichaActivo(decodeURIComponent(codigo));
  if (!ficha) notFound();

  if (ficha.activo.estado === "dado_de_baja") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">
          {ficha.activo.codigo}
        </h1>
        <p className="text-sm text-muted-foreground">
          Un activo dado de baja no se edita, para conservar el historial.
        </p>
        <BotonEnlace variant="outline" href={`/activos/${ficha.activo.codigo}`}>
          Volver a la ficha
        </BotonEnlace>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Editar {ficha.activo.codigo}
      </h1>
      <FormularioActivo propuestas={propuestasDeCodigo()} activo={ficha.activo} />
    </div>
  );
}
