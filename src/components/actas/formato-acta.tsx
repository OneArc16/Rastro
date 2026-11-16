import type { TipoActa } from "@/db/schema";
import {
  esquemaDatosBaja,
  esquemaDatosEgreso,
  esquemaDatosEntrega,
} from "@/lib/validacion/actas";
import { ActaBajaFormato } from "./formato/acta-baja";
import { ActaEgresoFormato } from "./formato/acta-egreso";
import { ActaEntregaFormato } from "./formato/acta-entrega";

/** Dibuja el contenido guardado de un acta en el formato aprobado de su tipo. */
export function FormatoActa({
  tipo,
  datos,
  fotoUrl,
}: {
  tipo: TipoActa;
  datos: Record<string, unknown>;
  fotoUrl?: string;
}) {
  // El contenido ya se validó al guardar; parsear completa valores por defecto
  switch (tipo) {
    case "entrega":
      return <ActaEntregaFormato datos={esquemaDatosEntrega.parse(datos)} />;
    case "egreso":
      return <ActaEgresoFormato datos={esquemaDatosEgreso.parse(datos)} />;
    case "baja":
      return <ActaBajaFormato datos={esquemaDatosBaja.parse(datos)} fotoUrl={fotoUrl} />;
  }
}
