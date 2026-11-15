import QRCode from "qrcode";

/**
 * QR como SVG: escala sin perder nitidez al imprimir.
 * El margen de 2 módulos es la zona blanca que necesitan los lectores.
 */
export function svgQr(texto: string): Promise<string> {
  return QRCode.toString(texto, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
}
