import { fechaImpresa } from "@/lib/actas";
import type { DatosInduccion } from "@/lib/validacion/actas";
import { Columnas, Hoja, Hojas, Logo, TextoLibre } from "./comunes";

function Encabezado({ datos }: { datos: DatosInduccion }) {
  const { codigo, version, fechaEmision } = datos.formato;
  const fila = { height: "14pt" };
  return (
    <table className="ac-tabla" style={{ fontSize: "10pt" }}>
      <Columnas anchos={[23, 46, 15, 16]} />
      <tbody>
        <tr style={fila}>
          <td rowSpan={3} className="ac-celdaLogo">
            <Logo />
          </td>
          <td rowSpan={3} className="ac-centro ac-negrita" style={{ fontSize: "11pt" }}>
            ACTA DE REUNIÓN
          </td>
          <td className="ac-centro">CÓDIGO</td>
          <td className="ac-centro">{codigo}</td>
        </tr>
        <tr style={fila}>
          <td className="ac-centro">VERSIÓN</td>
          <td className="ac-centro">{version}</td>
        </tr>
        <tr style={fila}>
          <td className="ac-centro">FECHA</td>
          <td className="ac-centro">{fechaImpresa(fechaEmision)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function Pie({ datos }: { datos: DatosInduccion }) {
  const firmantes = [
    ["Elaboró", datos.formato.elaborado],
    ["Revisó", datos.formato.revisado],
    ["Aprobó", datos.formato.aprobado],
  ] as const;
  return (
    <table className="ac-tabla" style={{ fontSize: "11pt" }}>
      <Columnas anchos={[33.3, 33.4, 33.3]} />
      <tbody>
        <tr style={{ height: "15pt" }}>
          {firmantes.map(([etiqueta]) => (
            <td key={etiqueta} className="ac-centro">
              {etiqueta}
            </td>
          ))}
        </tr>
        <tr style={{ height: "46pt" }}>
          {firmantes.map(([etiqueta, persona]) => (
            <td key={etiqueta} className="ac-centro">
              <div className="ac-negrita">{persona.nombre}</div>
              <div>{persona.cargo}</div>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

/** Acta de reunión F-SGI-001 (inducción) con el diseño del formato aprobado. */
export function ActaInduccionFormato({ datos }: { datos: DatosInduccion }) {
  const puntos = datos.puntos
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Hojas>
      <Hoja formato="induccion" pie={<Pie datos={datos} />}>
        <Encabezado datos={datos} />

        <table className="ac-tabla" style={{ marginTop: "31pt" }}>
          <Columnas anchos={[34.5, 27, 38.5]} />
          <tbody>
            <tr style={{ height: "30pt" }}>
              <td className="ac-azul ac-negrita" style={{ paddingLeft: "12pt" }}>
                FECHA: {fechaImpresa(datos.fecha)}
              </td>
              <td className="ac-azul ac-negrita">HORA: {datos.hora}</td>
              <td className="ac-azul ac-negrita">LUGAR: {datos.lugar}</td>
            </tr>
            <tr style={{ height: "57pt" }}>
              <td colSpan={3} className="ac-induccion-campo">
                <span className="ac-negrita">OBJETIVO DE LA REUNIÓN: </span>
                <TextoLibre texto={datos.objetivo} />
              </td>
            </tr>
            <tr style={{ height: "34pt" }}>
              <td colSpan={3}>
                <span className="ac-negrita">PROCESO RESPONSABLE: </span>
                {datos.proceso}
              </td>
            </tr>
            <tr style={{ height: "23pt" }}>
              <td colSpan={3}>
                <span className="ac-negrita">RESPONSABLES DE LA REUNIÓN: </span> {datos.responsables}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="ac-negrita ac-induccion-titulo">ASISTENTES</p>
        <table className="ac-tabla">
          <Columnas anchos={[39, 34, 27]} />
          <tbody>
            <tr>
              <td className="ac-azul ac-centro ac-negrita">NOMBRES Y APELLIDOS</td>
              <td className="ac-azul ac-centro ac-negrita">CARGO</td>
              <td className="ac-azul ac-centro ac-negrita">FIRMA</td>
            </tr>
            {datos.asistentes.map((a, i) => (
              <tr key={i} style={{ height: "14pt" }}>
                <td>{a.nombre}</td>
                <td>{a.cargo}</td>
                {/* En blanco: aquí firma cada asistente */}
                <td />
              </tr>
            ))}
          </tbody>
        </table>

        <table className="ac-tabla" style={{ marginTop: "14pt" }}>
          <tbody>
            <tr style={{ height: "28pt" }}>
              <td className="ac-azul ac-centro ac-negrita">PUNTOS A TRATAR</td>
            </tr>
            <tr style={{ height: "112pt" }}>
              <td className="ac-induccion-campo">
                <ol className="ac-induccion-puntos">
                  {puntos.map((punto, i) => (
                    <li key={i}>
                      {i + 1}) {punto}
                    </li>
                  ))}
                </ol>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="ac-tabla">
          <tbody>
            <tr style={{ height: "14pt" }}>
              <td className="ac-azul ac-centro ac-negrita">DESARROLLO DE LA REUNIÓN</td>
            </tr>
            <tr style={{ height: "90pt" }}>
              <td className="ac-induccion-campo ac-negrita">
                <TextoLibre texto={datos.desarrollo} />
              </td>
            </tr>
          </tbody>
        </table>
      </Hoja>
    </Hojas>
  );
}
