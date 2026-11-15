import type { TIPOS_ACTIVO } from "@/db/schema";
import { ETIQUETAS_TIPO } from "@/lib/etiquetas";
import { svgQr } from "@/lib/qr";
import { urlDeActivo } from "@/lib/url-publica";
import "./etiquetas.css";

type Props = {
  base: string;
  codigo: string;
  tipo: (typeof TIPOS_ACTIVO)[number];
  marca: string | null;
  modelo: string | null;
};

/** Etiqueta para pegar en el equipo: el QR abre la ficha del activo. */
export async function EtiquetaQr({ base, codigo, tipo, marca, modelo }: Props) {
  const svg = await svgQr(urlDeActivo(base, codigo));
  const detalle = [marca, modelo].filter(Boolean).join(" ");

  return (
    <div className="et-etiqueta">
      {/* SVG generado en el servidor por la librería qrcode a partir de una URL propia */}
      <div className="et-qr" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="et-texto">
        <p className="et-codigo">{codigo}</p>
        <p className="et-tipo">{ETIQUETAS_TIPO[tipo]}</p>
        {detalle && <p className="et-detalle">{detalle}</p>}
      </div>
    </div>
  );
}

/** Hoja carta con las etiquetas en tres columnas, igual en pantalla y en papel. */
export function HojaEtiquetas({ children }: { children: React.ReactNode }) {
  return (
    <div className="et-contenedor">
      <div className="et-hoja">
        <div className="et-rejilla">{children}</div>
      </div>
    </div>
  );
}
