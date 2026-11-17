import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerActa } from "@/db/consultas-actas";
import { BotonEnlace } from "@/components/boton-enlace";
import { BotonImprimir } from "@/components/boton-imprimir";
import { FormatoActa } from "@/components/actas/formato-acta";
import { Badge } from "@/components/ui/badge";
import { NOMBRES_ACTA } from "@/lib/actas";
import { formatearFecha } from "@/lib/fechas";

export const dynamic = "force-dynamic";

function idDesde(texto: string | undefined): number | null {
  if (!texto) return null;
  const id = Number(texto);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const formatoFechaHora = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "short",
  timeStyle: "short",
});

export async function generateMetadata({ params }: PageProps<"/actas/[id]">): Promise<Metadata> {
  const id = idDesde((await params).id);
  const acta = id === null ? null : obtenerActa(id);
  // El título se usa como nombre sugerido al guardar el PDF
  return { title: acta ? `Acta ${acta.codigo}` : "Acta" };
}

export default async function PaginaActa({ params, searchParams }: PageProps<"/actas/[id]">) {
  const id = idDesde((await params).id);
  const acta = id === null ? null : obtenerActa(id);
  if (!acta) notFound();

  const { version } = await searchParams;
  const versionId = idDesde(typeof version === "string" ? version : undefined);
  const anterior = versionId === null ? null : acta.versiones.find((v) => v.id === versionId);
  if (versionId !== null && !anterior) notFound();

  const mostrada = anterior ?? acta;
  const fotoUrls = mostrada.fotoIds.map((fotoId) => `/actas/${acta.id}/fotos/${fotoId}`);

  return (
    <div className="space-y-4">
      <div className="space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {acta.codigo} — {NOMBRES_ACTA[acta.tipo]}
            </h1>
            <p className="text-sm text-muted-foreground">
              Fecha {formatearFecha(acta.fecha)} · guardada{" "}
              {formatoFechaHora.format(acta.creadaEn)}
              {acta.editadaEn && ` · editada ${formatoFechaHora.format(acta.editadaEn)}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BotonEnlace variant="outline" href="/actas">
              Volver
            </BotonEnlace>
            {!anterior && (
              <BotonEnlace variant="outline" href={`/actas/${acta.id}/editar`}>
                Editar
              </BotonEnlace>
            )}
            <BotonImprimir />
          </div>
        </div>

        {acta.equipos.length > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-sm">
            Equipos:
            {acta.equipos.map((equipo) => (
              <Link key={equipo.id} href={`/activos/${encodeURIComponent(equipo.codigo)}`}>
                <Badge variant="secondary">{equipo.codigo}</Badge>
              </Link>
            ))}
          </p>
        )}

        {acta.versiones.length > 0 && (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">
              {anterior
                ? `Está viendo una versión anterior (reemplazada el ${formatoFechaHora.format(anterior.reemplazadaEn)}).`
                : `Esta acta fue editada ${acta.versiones.length} ${acta.versiones.length === 1 ? "vez" : "veces"}.`}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              <li>
                <Link
                  href={`/actas/${acta.id}`}
                  className={anterior ? "underline" : "font-semibold"}
                >
                  Versión actual
                </Link>
              </li>
              {acta.versiones.map((v, i) => (
                <li key={v.id}>
                  <Link
                    href={`/actas/${acta.id}?version=${v.id}`}
                    className={anterior?.id === v.id ? "font-semibold" : "underline"}
                  >
                    Versión {i + 1} (hasta {formatoFechaHora.format(v.reemplazadaEn)})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <FormatoActa tipo={acta.tipo} datos={mostrada.datos} fotoUrls={fotoUrls} />
    </div>
  );
}
