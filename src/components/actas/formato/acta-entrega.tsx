import { fechaImpresa } from "@/lib/actas";
import { PRUEBAS_ENTREGA, type DatosEntrega } from "@/lib/validacion/actas";
import { Columnas, Hoja, Hojas, Logo, TextoLibre } from "./comunes";

const TEXTO_RESPONSABILIDAD =
  "Se establece que el FUNCIONARIO RESPONSABLE dispondrá del equipamiento y velará por el correcto funcionamiento; en caso de daño y el ingeniero determine que el motivo fue por causa de mal uso; el funcionario responsable asumirá los costos a que haya lugar.";

const TEXTO_CERTIFICACION =
  "Certifico que los elementos detallados en el presente documento, me han sido entregados para mi cuidado y custodia con el propósito de cumplir con las tareas y asignaciones propias de mi cargo en la empresa; siendo estos de mi única y exclusiva responsabilidad. Me comprometo a usar correctamente los recursos, y solo para los fines establecidos, a no instalar ni permitir la instalación de software por personal ajeno al grupo interno de trabajo de soporte del área de sistemas.";

/** Etiquetas impresas de cada prueba, en el orden de PRUEBAS_ENTREGA. */
const ETIQUETAS_PRUEBA: Record<(typeof PRUEBAS_ENTREGA)[number], string> = {
  "Pruebas On/Off": "PRUEBAS ON/OF",
  "Función S.O.": "FUNCIÓN S.O.",
  "Función aplicaciones": "FUNCIÓN APLICACIONES",
  "Unidad óptica": "UNIDAD ÓPTICA",
  "Prueba de sonido": "PRUEBA DE SONIDO",
  "Función monitor": "FUNCIÓN MONITOR",
  "Función teclado": "FUNCIÓN TECLADO",
  "Función mouse": "FUNCIÓN MOUSE",
};

function Encabezado({ datos }: { datos: DatosEntrega }) {
  const { codigo, version, fechaEmision } = datos.formato;
  const fila = { height: "16pt" };
  return (
    <table className="ac-tabla" style={{ fontSize: "9pt" }}>
      <Columnas anchos={[23.8, 47.4, 15.6, 13.2]} />
      <tbody>
        <tr style={fila}>
          <td rowSpan={3} className="ac-celdaLogo">
            <Logo />
          </td>
          <td rowSpan={3} className="ac-centro" style={{ fontSize: "11pt", paddingTop: "14pt" }}>
            ENTREGA EQUIPOS DE COMPUTO
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
          <td className="ac-centro">{fechaImpresa(fechaEmision)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function Pie({ datos }: { datos: DatosEntrega }) {
  const firmantes = [
    ["Elaboró", datos.formato.elaborado],
    ["Revisó", datos.formato.revisado],
    ["Aprobó", datos.formato.aprobado],
  ] as const;
  return (
    <table className="ac-tabla" style={{ fontSize: "11pt" }}>
      <Columnas anchos={[33.3, 33.4, 33.3]} />
      <tbody>
        <tr style={{ height: "21pt" }}>
          {firmantes.map(([etiqueta]) => (
            <td key={etiqueta} className="ac-centro">
              {etiqueta}
            </td>
          ))}
        </tr>
        <tr style={{ height: "55pt" }}>
          {firmantes.map(([etiqueta, persona]) => (
            <td key={etiqueta} className="ac-centro">
              <div className="ac-negrita">{persona.nombre}</div>
              <div style={{ marginTop: "6pt" }}>{persona.cargo}</div>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function Pagina1({ datos }: { datos: DatosEntrega }) {
  const r = datos.responsable;
  const t = datos.torre;
  const resultados = new Map(datos.pruebas.map((p) => [p.prueba, p.resultado]));
  const perifericos = datos.perifericos;
  const filaTorre = { height: "17.5pt" };
  const mitad = PRUEBAS_ENTREGA.length / 2;

  function Prueba({ prueba }: { prueba: (typeof PRUEBAS_ENTREGA)[number] }) {
    const resultado = resultados.get(prueba) ?? "";
    // El original escribe "Ok" en la segunda columna; se respeta
    const ok = PRUEBAS_ENTREGA.indexOf(prueba) < mitad ? "OK" : "Ok";
    return (
      <>
        <td className="ac-negrita">{ETIQUETAS_PRUEBA[prueba]}</td>
        <td className={`ac-opcion ${resultado === "ok" ? "ac-opcionMarcada" : ""}`}>{ok}</td>
        <td className={`ac-opcion ${resultado === "falla" ? "ac-opcionMarcada" : ""}`}>FALLA</td>
      </>
    );
  }

  return (
    <Hoja formato="entrega" pie={<Pie datos={datos} />}>
      <Encabezado datos={datos} />

      <table className="ac-tabla" style={{ marginTop: "26pt" }}>
        <Columnas anchos={[15.6, 32.7, 9.3, 15.6, 14.6, 12.2]} />
        <tbody>
          <tr style={{ height: "15pt" }}>
            <td colSpan={6} className="ac-titulo">
              DATOS RESPONSABLE DEL EQUIPO DE COMPUTO
            </td>
          </tr>
          <tr style={{ height: "28pt" }}>
            <td className="ac-titulo">NOMBRE COMPLETO</td>
            <td>{r.nombre}</td>
            <td className="ac-titulo">CARGO</td>
            <td>{r.cargo}</td>
            <td className="ac-titulo">N° CELULAR</td>
            <td>{r.celular}</td>
          </tr>
          <tr style={{ height: "25pt" }}>
            <td className="ac-titulo">CORREO ELECTRÓNICO</td>
            <td>{r.correo}</td>
            <td className="ac-titulo">ÁREA</td>
            <td>{r.area}</td>
            <td className="ac-titulo">MUNICIPIO</td>
            <td>{r.municipio}</td>
          </tr>
        </tbody>
      </table>

      <table className="ac-tabla" style={{ marginTop: "12pt" }}>
        <Columnas anchos={[25.1, 28.4, 21.6, 24.9]} />
        <tbody>
          <tr>
            <td colSpan={4} className="ac-titulo">
              DISPOSITIVOS PERIFÉRICOS
            </td>
          </tr>
          {perifericos.map((p, i) => (
            <tr key={i} style={{ height: "13.4pt" }}>
              <td className="ac-negrita">{p.dispositivo.toUpperCase()}</td>
              <td>{p.marca}</td>
              <td className="ac-negrita">N° SERIAL</td>
              <td>{p.serial}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="ac-tabla" style={{ marginTop: "12pt" }}>
        <Columnas anchos={[25.1, 25, 24.9, 25]} />
        <tbody>
          <tr style={{ height: "18pt" }}>
            <td colSpan={4} className="ac-titulo">
              TORRE DE COMPUTADOR
            </td>
          </tr>
          {(
            [
              ["MARCA CPU", t.marcaCpu, "VELOCIDAD", t.velocidad],
              ["CANTIDAD RAM", t.cantidadRam, "TIPO DE RAM", t.tipoRam],
              ["HDMI", t.hdmi, "VGA", t.vga],
              ["DISCO DURO", t.discoDuro, "TARJETA DE VIDEO", t.tarjetaVideo],
              ["UNIDAD DE CD/DVD", t.unidadOptica, "SERIAL TORRE", t.serialTorre],
              ["SISTEMA OPERATIVO", t.sistemaOperativo, "MARCA", t.marca],
            ] as const
          ).map(([e1, v1, e2, v2]) => (
            <tr key={e1} style={filaTorre}>
              <td className="ac-negrita">{e1}</td>
              <td>{v1}</td>
              <td className="ac-negrita">{e2}</td>
              <td>{v2}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="ac-tabla" style={{ marginTop: "12pt" }}>
        <tbody>
          <tr>
            <td className="ac-titulo">SOFTWARE INSTALADO</td>
          </tr>
          <tr style={{ height: "70pt" }}>
            <td className="ac-arriba">
              <TextoLibre texto={datos.software} />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="ac-tabla" style={{ marginTop: "12pt" }}>
        <Columnas anchos={[36.2, 8.6, 8.5, 29.8, 8.5, 8.4]} />
        <tbody>
          <tr>
            <td colSpan={6} className="ac-titulo">
              PRUEBA DE FUNCIONALIDAD
            </td>
          </tr>
          <tr>
            <td className="ac-titulo">DESCRIPCIÓN</td>
            <td colSpan={2} className="ac-titulo">
              CALIFICACIÓN
            </td>
            <td className="ac-titulo">DESCRIPCIÓN</td>
            <td colSpan={2} className="ac-titulo">
              CALIFICACIÓN
            </td>
          </tr>
          {PRUEBAS_ENTREGA.slice(0, mitad).map((prueba, i) => (
            <tr key={prueba} style={{ height: "17.5pt" }}>
              <Prueba prueba={prueba} />
              <Prueba prueba={PRUEBAS_ENTREGA[i + mitad]} />
            </tr>
          ))}
        </tbody>
      </table>

      <p className="ac-negrita" style={{ margin: "14pt 0 0" }}>
        TIEMPO ESTIMADO DE USO{" "}
        <span style={{ fontWeight: 400 }}>{datos.tiempoEstimadoUso}</span>
      </p>
    </Hoja>
  );
}

function Pagina2({ datos }: { datos: DatosEntrega }) {
  return (
    <Hoja formato="entrega" pie={<Pie datos={datos} />}>
      <Encabezado datos={datos} />

      <p style={{ margin: "16pt 0 0", textAlign: "justify" }}>{TEXTO_RESPONSABILIDAD}</p>

      <p className="ac-negrita" style={{ margin: "14pt 0 10pt" }}>
        OBSERVACIÓN:
      </p>
      <table className="ac-tabla">
        <tbody>
          <tr style={{ height: "119pt" }}>
            <td className="ac-arriba">
              <TextoLibre texto={datos.observacion} />
            </td>
          </tr>
        </tbody>
      </table>

      <table className="ac-tabla" style={{ marginTop: "12pt" }}>
        <tbody>
          <tr style={{ height: "70pt" }}>
            <td className="ac-arriba" style={{ textAlign: "justify" }}>
              {TEXTO_CERTIFICACION}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="ac-tabla" style={{ marginTop: "12pt" }}>
        <Columnas anchos={[50, 50]} />
        <tbody>
          <tr>
            <td className="ac-negrita">FIRMA DE QUIEN ENTREGA:</td>
            <td className="ac-negrita">FIRMA DE QUIEN RECIBE:</td>
          </tr>
          {/* Recuadros en blanco: aquí se firma a mano */}
          <tr style={{ height: "47pt" }}>
            <td />
            <td />
          </tr>
          <tr style={{ height: "35pt" }}>
            <td className="ac-negrita">
              FECHA DE ENTREGA:{" "}
              <span style={{ fontWeight: 400 }}>{fechaImpresa(datos.fechaEntrega)}</span>
            </td>
            <td className="ac-negrita">
              FECHA DE RECIBIDO:{" "}
              <span style={{ fontWeight: 400 }}>{fechaImpresa(datos.fechaRecibido)}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </Hoja>
  );
}

/** Acta de entrega F-SIS-002 con el diseño del formato aprobado. */
export function ActaEntregaFormato({ datos }: { datos: DatosEntrega }) {
  return (
    <Hojas>
      <Pagina1 datos={datos} />
      <Pagina2 datos={datos} />
    </Hojas>
  );
}
