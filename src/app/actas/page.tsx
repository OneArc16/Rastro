import type { Metadata } from "next";
import { buscarActas } from "@/db/consultas-actas";
import { TIPOS_ACTA, type TipoActa } from "@/db/schema";
import { BotonEnlace } from "@/components/boton-enlace";
import { FiltrosActas } from "@/components/actas/filtros-actas";
import { TablaActas } from "@/components/actas/tabla-actas";
import { FORMATO_FECHA_ISO } from "@/lib/validacion/comunes";

export const metadata: Metadata = { title: "Actas" };
export const dynamic = "force-dynamic";

const texto = (valor: string | string[] | undefined) =>
  (Array.isArray(valor) ? valor[0] : valor)?.trim() ?? "";

const esTipo = (valor: string): valor is TipoActa => (TIPOS_ACTA as readonly string[]).includes(valor);
const fecha = (valor: string) => (FORMATO_FECHA_ISO.test(valor) ? valor : "");

export default async function PaginaActas({ searchParams }: PageProps<"/actas">) {
  const parametros = await searchParams;
  const filtros = {
    texto: texto(parametros.texto),
    tipo: esTipo(texto(parametros.tipo)) ? texto(parametros.tipo) : "",
    desde: fecha(texto(parametros.desde)),
    hasta: fecha(texto(parametros.hasta)),
  };
  const actas = buscarActas({
    texto: filtros.texto || undefined,
    tipo: esTipo(filtros.tipo) ? filtros.tipo : undefined,
    desde: filtros.desde || undefined,
    hasta: filtros.hasta || undefined,
  });
  const filtrando = Object.values(filtros).some(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Actas</h1>
          <p className="text-sm text-muted-foreground">
            Historial de actas de entrega, egreso y baja. La entrega se crea desde la ficha del
            funcionario y la baja desde la ficha del equipo.
          </p>
        </div>
        <BotonEnlace href="/actas/nueva?tipo=egreso">Nueva acta de egreso</BotonEnlace>
      </div>

      <FiltrosActas filtros={filtros} />

      <TablaActas
        actas={actas}
        vacio={filtrando ? "Ninguna acta coincide con la búsqueda." : "Todavía no hay actas guardadas."}
      />
    </div>
  );
}
