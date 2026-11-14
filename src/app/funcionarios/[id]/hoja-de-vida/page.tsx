import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obtenerDatosHojaDeVida } from "@/db/consultas";
import { construirHojaDeVida } from "@/dominio/hoja-de-vida";
import { BotonImprimir } from "@/components/hoja-de-vida/boton-imprimir";
import { HojaDeVidaFormato } from "@/components/hoja-de-vida/hoja-de-vida-formato";
import { BotonEnlace } from "@/components/boton-enlace";

export const dynamic = "force-dynamic";

function idDesde(texto: string): number | null {
  const id = Number.parseInt(texto, 10);
  return Number.isNaN(id) ? null : id;
}

export async function generateMetadata({
  params,
}: PageProps<"/funcionarios/[id]/hoja-de-vida">): Promise<Metadata> {
  const id = idDesde((await params).id);
  const datos = id === null ? null : obtenerDatosHojaDeVida(id);
  // El título se usa como nombre sugerido al guardar el PDF
  return { title: datos ? `Hoja de vida ${datos.funcionario.nombre}` : "Hoja de vida" };
}

export default async function PaginaHojaDeVida({
  params,
}: PageProps<"/funcionarios/[id]/hoja-de-vida">) {
  const id = idDesde((await params).id);
  const datos = id === null ? null : obtenerDatosHojaDeVida(id);
  if (!datos) notFound();

  const hoja = construirHojaDeVida(datos);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-bold tracking-tight">
          Hoja de vida — {datos.funcionario.nombre}
        </h1>
        <div className="flex gap-2">
          <BotonEnlace variant="outline" href={`/funcionarios/${id}`}>
            Volver
          </BotonEnlace>
          <BotonImprimir />
        </div>
      </div>
      <HojaDeVidaFormato hoja={hoja} />
    </div>
  );
}
