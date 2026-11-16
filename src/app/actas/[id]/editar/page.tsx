import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listarUbicacionesSimple } from "@/db/consultas";
import { listarEquiposParaEgreso, obtenerActa } from "@/db/consultas-actas";
import { BotonEnlace } from "@/components/boton-enlace";
import { FormularioActa } from "@/components/actas/formulario/formulario-acta";

export const metadata: Metadata = { title: "Editar acta" };
export const dynamic = "force-dynamic";

export default async function PaginaEditarActa({ params }: PageProps<"/actas/[id]/editar">) {
  const id = Number((await params).id);
  const acta = Number.isInteger(id) && id > 0 ? obtenerActa(id) : null;
  if (!acta) notFound();

  // En un egreso se pueden corregir los equipos listados; se ofrecen también los ya incluidos
  const equipos =
    acta.tipo === "egreso"
      ? [
          ...acta.equipos.map((e) => ({ ...e, marca: null })),
          ...listarEquiposParaEgreso().filter((e) => !acta.equipos.some((a) => a.id === e.id)),
        ]
      : acta.equipos.map((e) => ({ ...e, marca: null }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Editar acta {acta.codigo}</h1>
        <BotonEnlace variant="outline" href={`/actas/${acta.id}`}>
          Cancelar
        </BotonEnlace>
      </div>
      <FormularioActa
        modo="editar"
        actaId={acta.id}
        tipo={acta.tipo}
        inicial={{
          funcionarioId: acta.funcionarioId ?? undefined,
          ubicacionId: acta.ubicacionId ?? undefined,
          activoIds: acta.equipos.map((e) => e.id),
          datos: acta.datos,
        }}
        equipos={equipos}
        ubicaciones={acta.tipo === "egreso" ? listarUbicacionesSimple() : []}
        fotoActualUrl={acta.tieneFoto ? `/actas/${acta.id}/foto` : undefined}
      />
    </div>
  );
}
