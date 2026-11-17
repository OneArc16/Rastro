import { obtenerFotoActa } from "@/db/consultas-actas";

export const dynamic = "force-dynamic";

function entero(texto: string) {
  const numero = Number(texto);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

/** Una foto de un acta de baja (vigente o de una versión anterior). */
export async function GET(_request: Request, { params }: RouteContext<"/actas/[id]/fotos/[fotoId]">) {
  const { id, fotoId } = await params;
  const actaId = entero(id);
  const fotoNumero = entero(fotoId);
  if (!actaId || !fotoNumero) return new Response("No encontrada", { status: 404 });

  const foto = obtenerFotoActa(actaId, fotoNumero);
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
