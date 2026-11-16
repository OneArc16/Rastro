/**
 * Reducción de la foto de la baja en el navegador, antes de enviarla:
 * a 1600 px de lado mayor en JPEG, bajando la calidad hasta que quepa.
 */
import { MAXIMO_BYTES_FOTO } from "@/lib/validacion/actas";

export const LADO_MAXIMO_FOTO = 1600;

export function dimensionesReducidas(ancho: number, alto: number, maximo = LADO_MAXIMO_FOTO) {
  const escala = Math.min(1, maximo / Math.max(ancho, alto));
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) };
}

const CALIDADES = [0.85, 0.75, 0.65, 0.5];

/** Devuelve la foto reducida como JPEG, o un error legible si no se pudo. */
export async function reducirFoto(archivo: File): Promise<Blob> {
  if (!archivo.type.startsWith("image/")) throw new Error("El archivo no es una imagen");

  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  } catch {
    throw new Error("No se pudo leer la imagen");
  }

  const { ancho, alto } = dimensionesReducidas(imagen.width, imagen.height);
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const contexto = lienzo.getContext("2d");
  if (!contexto) throw new Error("No se pudo procesar la imagen");
  // Fondo blanco: un PNG con transparencia no queda negro al pasar a JPEG
  contexto.fillStyle = "#ffffff";
  contexto.fillRect(0, 0, ancho, alto);
  contexto.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  for (const calidad of CALIDADES) {
    const blob = await new Promise<Blob | null>((listo) =>
      lienzo.toBlob(listo, "image/jpeg", calidad),
    );
    if (blob && blob.size <= MAXIMO_BYTES_FOTO) return blob;
  }
  throw new Error("La foto es demasiado grande incluso reducida");
}
