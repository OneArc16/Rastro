import { listarInventarioParaExportar } from "@/db/consultas";
import { libroInventario, nombreArchivoInventario } from "@/exportacion/inventario";
import { hoyIso } from "@/lib/fechas";

/** Descarga el inventario completo de equipos como archivo de Excel. */
export async function GET() {
  const contenido = await libroInventario(listarInventarioParaExportar());

  return new Response(new Uint8Array(contenido), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivoInventario(hoyIso())}"`,
      "Cache-Control": "no-store",
    },
  });
}
