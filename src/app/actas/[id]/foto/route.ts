import { obtenerFotoActa } from "@/db/consultas-actas";

export const dynamic = "force-dynamic";

function entero(texto: string | null) {
  if (texto === null) return undefined;
  const numero = Number(texto);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

/** Foto de un acta de baja (o de una versión anterior con ?version=ID). */
export async function GET(request: Request, { params }: RouteContext<"/actas/[id]/foto">) {
  const actaId = entero((await params).id);
  const versionId = entero(new URL(request.url).searchParams.get("version"));
  if (!actaId || versionId === null) return new Response("No encontrada", { status: 404 });

  const foto = obtenerFotoActa(actaId, versionId);
  if (!foto) return new Response("No encontrada", { status: 404 });

  return new Response(new Uint8Array(foto.contenido), {
    headers: {
      "Content-Type": foto.tipo,
      "Cache-Control": "private, no-store",
      // El tipo ya se validó con los primeros bytes al guardar; esto evita que se interprete como otra cosa
      "X-Content-Type-Options": "nosniff",
    },
  });
}
