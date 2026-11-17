/* eslint-disable @next/next/no-img-element -- la foto se imprime tal cual, desde la base local */
import { fechaImpresa, partesFecha } from "@/lib/actas";
import { CALIFICACIONES_BAJA, type DatosBaja } from "@/lib/validacion/actas";
import { Columnas, Hoja, Hojas, Logo, TextoLibre } from "./comunes";

function Encabezado({ datos }: { datos: DatosBaja }) {
  const { codigo, version, fechaEmision } = datos.formato;
  return (
    // El encabezado del original es un poco más angosto que las tablas
    <table className="ac-tabla" style={{ width: "95.5%", marginLeft: "1%" }}>
      <Columnas anchos={[29.6, 38.2, 32.2]} />
      <tbody>
        <tr style={{ height: "14pt" }}>
          <td rowSpan={3} className="ac-celdaLogo">
            <Logo />
          </td>
          <td rowSpan={3} className="ac-titulo" style={{ fontSize: "12pt", paddingTop: "8pt" }}>
            FORMATO
            <br />
            BAJA DE EQUIPOS DE COMPUTO
          </td>
          <td style={{ fontSize: "10pt" }}>
            <b>CODIGO:</b> {codigo}
          </td>
        </tr>
        <tr style={{ height: "14pt" }}>
          <td style={{ fontSize: "10pt" }}>
            <b>VERSIÓN:</b> {version}
          </td>
        </tr>
        <tr style={{ height: "14pt" }}>
          <td style={{ fontSize: "10pt" }}>
            <b>FECHA EMISIÓN:</b> {fechaImpresa(fechaEmision)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Pie({ datos }: { datos: DatosBaja }) {
  const firmantes = [
    ["Elaborado por:", datos.formato.elaborado],
    ["Revisado por:", datos.formato.revisado],
    ["Autorizado por:", datos.formato.aprobado],
  ] as const;
  return (
    <table
      className="ac-tabla"
      style={{ width: "87%", margin: "0 auto 0 6.5%", fontSize: "7pt", lineHeight: 1.05 }}
    >
      <Columnas anchos={[32, 33.4, 34.6]} />
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
              {persona.nombre.toUpperCase()}
              <br />
              {persona.cargo}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

/** Fecha en tres casillas (día, mes, año), como en el formato. */
function CasillasFecha({ fecha, gris = false }: { fecha: string; gris?: boolean }) {
  const { dia, mes, anio } = partesFecha(fecha);
  const estilo = gris ? { color: "#7f7f7f", fontWeight: 700 } : undefined;
  return (
    <td colSpan={1} style={{ padding: 0 }}>
      <table className="ac-tabla" style={{ height: "100%" }}>
        <Columnas anchos={[33, 33, 34]} />
        <tbody>
          <tr style={{ height: "24pt" }}>
            {[dia, mes, anio].map((parte, i) => (
              <td
                key={i}
                className="ac-centro"
                style={{
                  ...estilo,
                  padding: 0,
                  fontSize: "8pt",
                  borderTop: 0,
                  borderBottom: 0,
                  borderLeft: i === 0 ? 0 : undefined,
                  borderRight: i === 2 ? 0 : undefined,
                }}
              >
                {parte}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </td>
  );
}

/** Acta de baja FCOM-01 con el diseño del formato aprobado. */
export function ActaBajaFormato({ datos, fotoUrls = [] }: { datos: DatosBaja; fotoUrls?: string[] }) {
  const r = datos.responsable;
  const e = datos.equipo;
  const marcadas = new Set<string>(datos.calificaciones);
  const etiqueta = "ac-negrita ac-arriba";

  return (
    <Hojas>
      <Hoja formato="baja" pie={<Pie datos={datos} />}>
        <Encabezado datos={datos} />

        <table className="ac-tabla" style={{ marginTop: "34pt", fontSize: "10pt" }}>
          <Columnas anchos={[14, 32.6, 8.5, 19.8, 13.2, 11.9]} />
          <tbody>
            <tr>
              <td colSpan={6} className="ac-titulo">
                DATOS DEL RESPONSABLE DEL EQUIPO DE COMPUTO
              </td>
            </tr>
            <tr>
              <td className={etiqueta}>NOMBRE COMPLETO</td>
              <td className="ac-arriba">{r.nombre}</td>
              <td className={etiqueta}>CARGO</td>
              <td className="ac-arriba">{r.cargo}</td>
              <td className={etiqueta}>N° CELULAR</td>
              <td className="ac-arriba">{r.celular}</td>
            </tr>
            <tr>
              <td className={etiqueta}>CORREO ELECTRÓNICO</td>
              <td className="ac-arriba">{r.correo}</td>
              <td className={etiqueta}>ÁREA</td>
              <td className="ac-arriba">{r.area}</td>
              <td className={etiqueta}>MUNICIPIO</td>
              <td className="ac-arriba">{r.municipio}</td>
            </tr>
          </tbody>
        </table>

        <table className="ac-tabla" style={{ marginTop: "21pt", fontSize: "10pt" }}>
          <Columnas anchos={[13.3, 26.8, 13.1, 15, 16.1, 15.7]} />
          <tbody>
            <tr>
              <td colSpan={6} className="ac-titulo">
                DATOS DEL EQUIPO DE COMPUTO A DAR DE BAJA
              </td>
            </tr>
            <tr>
              <td className={etiqueta}>ELEMENTO DE COMPUTO</td>
              <td className="ac-arriba">{e.elemento}</td>
              <td className={etiqueta}>MARCA</td>
              <td className="ac-arriba">{e.marca}</td>
              <td className={etiqueta}>MODELO</td>
              <td className="ac-arriba">{e.modelo}</td>
            </tr>
            <tr>
              <td className={etiqueta}>SERIAL</td>
              <td className="ac-arriba">{e.serial}</td>
              <td className={etiqueta}>CAPACIDAD DISCO DURO</td>
              <td className="ac-arriba">{e.capacidadDisco}</td>
              <td className={etiqueta}>PROCESADOR</td>
              <td className="ac-arriba">{e.procesador}</td>
            </tr>
            <tr>
              <td className={etiqueta}>MEMORIA RAM</td>
              <td className="ac-arriba">{e.ram}</td>
              <td className={etiqueta}>FECHA DE COMPRA</td>
              <CasillasFecha fecha={e.fechaCompra} />
              <td className={etiqueta}>FECHA DE BAJA DEL EQUIPO</td>
              <CasillasFecha fecha={e.fechaBaja} gris />
            </tr>
          </tbody>
        </table>

        <table
          className="ac-tabla"
          style={{ marginTop: "21pt", width: "99%", marginLeft: "1%", fontSize: "10pt" }}
        >
          <Columnas anchos={[89.3, 10.7]} />
          <tbody>
            <tr>
              <td colSpan={2} className="ac-titulo">
                CALIFICACIÓN DEL EQUIPO
              </td>
            </tr>
            {CALIFICACIONES_BAJA.map((calificacion) => (
              <tr key={calificacion} style={{ lineHeight: 1 }}>
                <td>{calificacion}</td>
                <td className="ac-centro">{marcadas.has(calificacion) ? "X" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="ac-tabla" style={{ marginTop: "21pt", fontSize: "10pt" }}>
          <tbody>
            <tr>
              <td>ESPECIFICACIÓN DE LA CALIFICACIÓN DEL EQUIPO</td>
            </tr>
            <tr style={{ height: "134pt" }}>
              <td className="ac-arriba">
                <TextoLibre texto={datos.especificacion} />
                {fotoUrls.length > 0 && (
                  <div className={fotoUrls.length > 1 ? "ac-fotos ac-fotos--varias" : "ac-fotos"}>
                    {fotoUrls.map((url, i) => (
                      <img key={url} src={url} alt={`Foto ${i + 1} del equipo`} className="ac-foto" />
                    ))}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="ac-tabla" style={{ marginTop: "21pt", fontSize: "10pt" }}>
          <Columnas anchos={[50, 50]} />
          <tbody>
            <tr>
              <td colSpan={2}>RESPONSABLE DEL DIAGNOSTICO DE BAJA DEL EQUIPO DE COMPUTO</td>
            </tr>
            <tr style={{ height: "28pt" }}>
              <td className="ac-arriba">NOMBRE: {datos.diagnostico.nombre.toUpperCase()}</td>
              <td className="ac-arriba">CARGO: {datos.diagnostico.cargo.toUpperCase()}</td>
            </tr>
          </tbody>
        </table>

        <div className="ac-lineasFirma">
          <div className="ac-lineaFirma">
            {/* Línea en blanco: aquí se firma a mano */}
            <span className="ac-raya" />
            <span>RESPONSABLE</span>
          </div>
          <div className="ac-lineaFirma">
            <span style={{ display: "flex", fontWeight: 400 }}>
              VoBo<span className="ac-raya" style={{ flex: 1 }} />
            </span>
            <span style={{ paddingLeft: "0.4in" }}>JEFE DE ÁREA</span>
          </div>
        </div>
      </Hoja>
    </Hojas>
  );
}
