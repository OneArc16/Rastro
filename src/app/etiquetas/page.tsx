import type { Metadata } from "next";
import { listarActivos } from "@/db/consultas";
import { BotonImprimir } from "@/components/boton-imprimir";
import { EtiquetaQr, HojaEtiquetas } from "@/components/etiquetas/etiqueta-qr";
import { FiltrosEtiquetas } from "@/components/etiquetas/filtros-etiquetas";
import { filtrarParaEtiquetas } from "@/lib/etiquetas-qr";
import { obtenerUrlBase } from "@/lib/url-base-servidor";

export const metadata: Metadata = { title: "Etiquetas QR" };
export const dynamic = "force-dynamic";

const texto = (valor: string | string[] | undefined) => (typeof valor === "string" ? valor : "");

export default async function PaginaEtiquetas({ searchParams }: PageProps<"/etiquetas">) {
  const parametros = await searchParams;
  const filtros = {
    codigo: texto(parametros.codigo),
    tipo: texto(parametros.tipo),
    ubicacion: texto(parametros.ubicacion),
    texto: texto(parametros.texto),
  };

  const todos = listarActivos();
  const seleccion = filtrarParaEtiquetas(todos, filtros);
  const ubicaciones = [...new Set(todos.map((a) => a.ubicacion).filter((u): u is string => !!u))].sort();
  const { base, configurada } = await obtenerUrlBase();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-bold tracking-tight">Etiquetas QR</h1>
        <BotonImprimir />
      </div>

      <div className="space-y-3 print:hidden">
        {!filtros.codigo && (
          <FiltrosEtiquetas
            ubicaciones={ubicaciones}
            inicial={{ tipo: filtros.tipo, ubicacion: filtros.ubicacion, texto: filtros.texto }}
          />
        )}
        <p className="text-sm text-muted-foreground">
          {seleccion.length} {seleccion.length === 1 ? "etiqueta" : "etiquetas"}. Cada QR abre{" "}
          <span className="font-mono">{base}/activos/…</span>
        </p>
        {!configurada && (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            Falta configurar <span className="font-mono">APP_BASE_URL</span> con la dirección de
            este PC en la red (por ejemplo <span className="font-mono">http://192.168.1.50:3000</span>
            ). Mientras tanto los QR usan la dirección con que abriste esta página, que puede no
            funcionar desde el celular.
          </p>
        )}
      </div>

      {seleccion.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay activos con esos filtros.</p>
      ) : (
        <HojaEtiquetas>
          {seleccion.map((activo) => (
            <EtiquetaQr
              key={activo.codigo}
              base={base}
              codigo={activo.codigo}
              tipo={activo.tipo}
              marca={activo.marca}
              modelo={activo.modelo}
            />
          ))}
        </HojaEtiquetas>
      )}
    </div>
  );
}
