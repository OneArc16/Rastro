import { fechaImpresa } from "@/lib/actas";
import type { DatosEgreso } from "@/lib/validacion/actas";
import { Columnas, Hoja, Hojas, Logo, TextoLibre } from "./comunes";

function Encabezado({ datos }: { datos: DatosEgreso }) {
  const { codigo, version, fechaEmision } = datos.formato;
  const fila = { height: "16pt" };
  return (
    <table className="ac-tabla" style={{ fontSize: "10pt" }}>
      <Columnas anchos={[24.3, 44.2, 18.6, 12.9]} />
      <tbody>
        <tr style={fila}>
          <td rowSpan={3} className="ac-celdaLogo">
            <Logo />
          </td>
          <td rowSpan={3} className="ac-centro" style={{ fontSize: "11pt", paddingTop: "12pt" }}>
            EGRESO DE EQUIPO DE COMPUTO
          </td>
          <td className="ac-centro">CÓDIGO</td>
          <td className="ac-centro">{codigo}</td>
        </tr>
        <tr style={fila}>
          <td className="ac-centro">VERSIÓN</td>
          <td className="ac-centro">{version}</td>
        </tr>
        <tr style={fila}>
          <td className="ac-centro">FECHA EMISIÓN</td>
          <td className="ac-centro">{fechaImpresa(fechaEmision, "-")}</td>
        </tr>
      </tbody>
    </table>
  );
}

function Pie({ datos }: { datos: DatosEgreso }) {
  const firmantes = [
    ["ELABORADO POR:", datos.formato.elaborado],
    ["REVISADO POR:", datos.formato.revisado],
    ["APROBADO POR:", datos.formato.aprobado],
  ] as const;
  return (
    <table
      className="ac-tabla"
      style={{ fontFamily: "Calibri, var(--fuente-calibri), sans-serif", fontSize: "7pt" }}
    >
      <Columnas anchos={[25.6, 44.9, 29.5]} />
      <tbody>
        <tr>
          {firmantes.map(([etiqueta]) => (
            <td key={etiqueta} className="ac-negrita">
              {etiqueta}
            </td>
          ))}
        </tr>
        <tr>
          {firmantes.map(([etiqueta, persona]) => (
            <td key={etiqueta}>
              {persona.nombre}
              <br />
              {persona.cargo}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

/** Acta de egreso F-SIS-001 con el diseño del formato aprobado. */
export function ActaEgresoFormato({ datos }: { datos: DatosEgreso }) {
  const ti = datos.funcionarioTi;
  const fila = { height: "20pt" };

  return (
    <Hojas>
      <Hoja formato="egreso" pie={<Pie datos={datos} />}>
        <Encabezado datos={datos} />

        <table className="ac-tabla" style={{ marginTop: "43pt" }}>
          <Columnas anchos={[18.1, 31.2, 16.1, 34.6]} />
          <tbody>
            <tr style={{ height: "20pt" }}>
              <td colSpan={4} className="ac-titulo">
                DATOS FUNCIONARIO T.I QUE REALIZA EL EGRESO
              </td>
            </tr>
            <tr style={{ height: "31pt" }}>
              <td className="ac-negrita">NOMBRE COMPLETO</td>
              <td className="ac-negrita">{ti.nombre}</td>
              <td className="ac-negrita">CARGO</td>
              <td>{ti.cargo}</td>
            </tr>
            <tr style={{ height: "31pt" }}>
              <td className="ac-negrita">CORREO ELECTRÓNICO</td>
              <td className="ac-negrita">{ti.correo}</td>
              <td className="ac-negrita">N° CELULAR</td>
              <td className="ac-negrita">{ti.celular}</td>
            </tr>
          </tbody>
        </table>

        <table className="ac-tabla" style={{ marginTop: "12pt" }}>
          <Columnas anchos={[22.7, 8.2, 9.5, 14.1, 45.5]} />
          <tbody>
            <tr style={{ height: "20pt" }}>
              <td colSpan={5} className="ac-titulo">
                DISPOSITIVOS ENVIADOS
              </td>
            </tr>
            <tr style={{ height: "20pt" }}>
              <td className="ac-titulo">DISPOSITIVO</td>
              <td className="ac-titulo">SI</td>
              <td className="ac-titulo">NO</td>
              <td className="ac-titulo">CANTIDAD</td>
              <td className="ac-titulo">DETALLE</td>
            </tr>
            {datos.dispositivos.map((d, i) => (
              <tr key={i} style={fila}>
                <td className="ac-negrita">{d.dispositivo.toUpperCase()}</td>
                <td className="ac-titulo">{d.enviado === "si" ? "X" : ""}</td>
                <td className="ac-titulo">{d.enviado === "no" ? "X" : ""}</td>
                <td className="ac-titulo">{d.cantidad}</td>
                <td style={{ fontSize: "10pt" }}>{d.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="ac-negrita" style={{ margin: "14pt 0 9pt 3pt", fontSize: "10pt" }}>
          DETALLE DEL ENVÍO:
        </p>
        <table className="ac-tabla">
          <tbody>
            <tr style={{ height: "38pt" }}>
              <td className="ac-arriba" style={{ fontSize: "10pt" }}>
                <TextoLibre texto={datos.detalleEnvio} />
              </td>
            </tr>
          </tbody>
        </table>

        <table className="ac-tabla" style={{ marginTop: "24pt" }}>
          <Columnas anchos={[50.4, 49.6]} />
          <tbody>
            <tr style={{ height: "20pt" }}>
              <td className="ac-negrita">FIRMA DE FUNCIONARIO T.I:</td>
              <td className="ac-negrita">FIRMA FUNCIONARIO DISPENSARIO QUE RECIBE:</td>
            </tr>
            <tr style={{ height: "74pt" }}>
              <td style={{ verticalAlign: "bottom" }}>
                <span className="ac-firmante">{ti.nombre}</span>
              </td>
              <td style={{ verticalAlign: "bottom" }}>
                <span className="ac-firmante">{datos.recibe.nombre}</span>
                <span className="ac-firmante">{datos.recibe.cargo}</span>
              </td>
            </tr>
            <tr style={{ height: "29pt" }}>
              <td colSpan={2} className="ac-negrita">
                FECHA DE SALIDA: {fechaImpresa(datos.fechaSalida)}
              </td>
            </tr>
          </tbody>
        </table>
      </Hoja>
    </Hojas>
  );
}
