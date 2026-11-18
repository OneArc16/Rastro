import { obtenerEscaneo } from "@/db/consultas-actas";

export const dynamic = "force-dynamic";

function entero(texto: string) {
  const numero = Number(texto);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

/** Nombre para Content-Disposition: versión ASCII segura más la original en UTF-8 (RFC 6266). */
function disposicion(tipo: "inline" | "attachment", nombre: string) {
  const ascii = nombre.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "") || "acta";
  return `${tipo}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nombre)}`;
}

/** Archivo del acta firmada escaneada; con ?descargar=1 se descarga en vez de abrirse. */
export async function GET(request: Request, { params }: RouteContext<"/actas/[id]/escaneos/[escaneoId]">) {
  const { id, escaneoId } = await params;
  const actaId = entero(id);
  const archivoId = entero(escaneoId);
  if (!actaId || !archivoId) return new Response("No encontrado", { status: 404 });

  const escaneo = obtenerEscaneo(actaId, archivoId);
  if (!escaneo) return new Response("No encontrado", { status: 404 });

  const descargar = new URL(request.url).searchParams.get("descargar") === "1";
  return new Response(new Uint8Array(escaneo.contenido), {
    headers: {
      "Content-Type": escaneo.tipo,
      "Content-Disposition": disposicion(descargar ? "attachment" : "inline", escaneo.nombre),
      "Cache-Control": "private, no-store",
      // El tipo ya se validó con los primeros bytes al guardar
      "X-Content-Type-Options": "nosniff",
    },
  });
}
