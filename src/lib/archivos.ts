/**
 * Comprueba que el contenido de un archivo empiece con los bytes propios de
 * su tipo, para no confiar solo en el tipo que declara el navegador.
 */
export function coincideConTipo(contenido: Buffer, tipo: string): boolean {
  switch (tipo) {
    case "image/jpeg":
      return contenido.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    case "image/png":
      return contenido.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/webp":
      return (
        contenido.subarray(0, 4).toString("latin1") === "RIFF" &&
        contenido.subarray(8, 12).toString("latin1") === "WEBP"
      );
    case "application/pdf":
      return contenido.subarray(0, 5).toString("latin1") === "%PDF-";
    default:
      return false;
  }
}
