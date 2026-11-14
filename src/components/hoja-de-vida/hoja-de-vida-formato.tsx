/* eslint-disable @next/next/no-img-element -- el logo debe imprimirse tal cual, sin optimización */
import type { ReactNode } from "react";
import { Carlito } from "next/font/google";
import type { HojaDeVida } from "@/dominio/hoja-de-vida";
import "./hoja-de-vida.css";

// Se descarga al compilar y se sirve desde la propia app: no hay peticiones externas en uso
const fuenteHoja = Carlito({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--fuente-hoja",
});

/** Anchos de las 6 columnas del formato original, en porcentaje. */
const COLUMNAS = [9.4, 24.4, 22.7, 21.8, 12.4, 9.2];

function Columnas() {
  return (
    <colgroup>
      {COLUMNAS.map((ancho, i) => (
        <col key={i} style={{ width: `${ancho}%` }} />
      ))}
    </colgroup>
  );
}

type Par = [etiqueta: string, valor: string, alineacion?: "derecha"];

/** Fila de tres pares etiqueta/valor, la estructura base de todo el formato. */
function Fila({ pares }: { pares: [Par, Par, Par] }) {
  return (
    <tr>
      {pares.map(([etiqueta, valor, alineacion]) => [
        <td key={`e-${etiqueta}`} className="hv-etiqueta">
          {etiqueta}
        </td>,
        <td
          key={`v-${etiqueta}`}
          className={alineacion === "derecha" ? "hv-derecha" : undefined}
        >
          {valor}
        </td>,
      ])}
    </tr>
  );
}

function Seccion({
  titulo,
  grande = false,
  children,
}: {
  titulo: string;
  grande?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="hv-seccion">
      <h2 className={grande ? "hv-barra hv-barraGrande" : "hv-barra"}>{titulo}</h2>
      {children}
    </section>
  );
}

function Rejilla({ children }: { children: ReactNode }) {
  return (
    <table className="hv-rejilla">
      <Columnas />
      <tbody>{children}</tbody>
    </table>
  );
}

function Encabezado({ hoja }: { hoja: HojaDeVida }) {
  const { codigo, version, fechaEmision } = hoja.encabezado;
  return (
    <table className="hv-rejilla">
      <Columnas />
      <tbody>
        <tr>
          <td colSpan={2} rowSpan={3} className="hv-celdaLogo">
            <img src="/logo.png" alt="Logo de la empresa" className="hv-logo" />
          </td>
          <td colSpan={2} rowSpan={3} className="hv-titulo">
            HOJA DE VIDA EQUIPOS DE
            <br />
            COMPUTO
          </td>
          <td>CODIGO</td>
          <td>{codigo}</td>
        </tr>
        <tr>
          <td>VERSION</td>
          <td>{version}</td>
        </tr>
        <tr>
          <td>FECHA EMISIÓN</td>
          <td>{fechaEmision}</td>
        </tr>
      </tbody>
    </table>
  );
}

function Firmas({ hoja }: { hoja: HojaDeVida }) {
  const { elaborado, revisado, aprobado } = hoja.firmas;
  return (
    <table className="hv-rejilla hv-firmas">
      <Columnas />
      <tbody>
        <tr>
          <td colSpan={2}>ELABORADO POR:</td>
          {/* Etiqueta literal del formato aprobado (asunción A5) */}
          <td colSpan={2}>REVISADOR POR:</td>
          <td colSpan={2}>APROBADO POR:</td>
        </tr>
        <tr>
          <td colSpan={2}>{elaborado.nombre}</td>
          <td colSpan={2}>{revisado.nombre}</td>
          <td colSpan={2}>{aprobado.nombre}</td>
        </tr>
        <tr>
          <td colSpan={2}>{elaborado.cargo}</td>
          <td colSpan={2}>{revisado.cargo}</td>
          <td colSpan={2}>{aprobado.cargo}</td>
        </tr>
      </tbody>
    </table>
  );
}

/** Hoja de vida con el diseño del formato aprobado; solo presenta textos ya armados. */
export function HojaDeVidaFormato({ hoja }: { hoja: HojaDeVida }) {
  const { general: g, bateria: b, equipo: e, impresora: i } = hoja;

  return (
    <div className="hv-contenedor">
      <article className={`hv-hoja ${fuenteHoja.variable}`}>
        <Encabezado hoja={hoja} />

        <Seccion titulo="Información general">
          <Rejilla>
            <Fila pares={[["PC", g.pc, "derecha"], ["RESPONSABLE", g.responsable], ["TELEFONO", g.telefono]]} />
            <Fila pares={[["VALOR", g.valor], ["FECHA DE COMPRA", g.fechaCompra], ["EXP. DE GARANTIA", g.garantia]]} />
            <Fila pares={[["UBICACIÓN", g.ubicacion], ["TIPO DE COMPUTADOR", g.tipoComputador], ["FECHA DE ACTUALIZACION", g.fechaActualizacion, "derecha"]]} />
          </Rejilla>
        </Seccion>

        <Seccion titulo="Bateria (en caso de portatiles)">
          <Rejilla>
            <Fila pares={[["APLICA", b.aplica], ["SERIAL", b.serial], ["ESTADO", b.estado]]} />
          </Rejilla>
        </Seccion>

        <Seccion titulo="Información del equipo">
          <Rejilla>
            <Fila pares={[["MARCA:", e.marca], ["SERIAL", e.serial], ["COLOR", e.color]]} />
            <Fila pares={[["MODELO", e.modelo], ["UNIDAD DE DISCO", e.unidadDisco], ["PUERTOS USB", e.puertosUsb, "derecha"]]} />
            <Fila pares={[["DISCO", e.disco], ["CAPACIDAD", e.capacidad], ["CANTIDAD RAM", e.ram]]} />
            <Fila pares={[["TIPO DE RAM", e.tipoRam], ["PROCESADOR", e.procesador], ["VELOCIDAD", e.velocidad]]} />
            <Fila pares={[["TARJETA GRAFICA", e.tarjetaGrafica], ["MODELO", e.graficaModelo], ["CAPACIDAD", e.graficaCapacidad]]} />
            <Fila pares={[["WIFI", e.wifi], ["TARJETA WIFI", e.tarjetaWifi], ["PUERTO DE RED", e.puertoRed]]} />
            <Fila pares={[["TARJETA DE SONIDO", e.tarjetaSonido], ["MODELO", e.sonidoModelo], ["BOARD", e.board]]} />
            <Fila pares={[["SISTEMA OPERATIVO", e.sistemaOperativo], ["HERRAMIENTAS OFIMATICAS", e.ofimatica], ["ANTIVIRUS", e.antivirus]]} />
          </Rejilla>
        </Seccion>

        <Seccion titulo="Perifericos">
          <Rejilla>
            {hoja.perifericos.map((p) => (
              <Fila key={p.etiqueta} pares={[[p.etiqueta, p.marca], ["MODELO", p.modelo], ["SERIAL", p.serial]]} />
            ))}
          </Rejilla>
        </Seccion>

        {hoja.monitores.map((m, indice) => (
          <Seccion key={indice} titulo="Monitor">
            <Rejilla>
              <Fila pares={[["MARCA", m.marca], ["MODELO", m.modelo], ["TAMAÑO", m.tamano]]} />
              <Fila pares={[["COLOR", m.color], ["TIPO", m.tipo], ["SERIAL", m.serial]]} />
            </Rejilla>
          </Seccion>
        ))}

        <Seccion titulo="Impresora">
          <Rejilla>
            <Fila pares={[["APLICA", i.aplica], ["MARCA", i.marca], ["MODELO", i.modelo]]} />
            <Fila pares={[["SERIAL", i.serial], ["CABLE DE CONEXIÓN", i.cableConexion], ["CABLE DE ENERGIA", i.cableEnergia]]} />
          </Rejilla>
        </Seccion>

        <Seccion titulo="Observaciones" grande>
          <div className="hv-observaciones">
            {hoja.observaciones.map((linea, indice) => (
              <p key={indice}>
                {indice + 1}. {linea}
              </p>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Novedades">
          {hoja.novedades.map((n, indice) => (
            <div key={indice} className="hv-novedad">
              <Rejilla>
                <Fila pares={[["ULTIMA FECHA", n.ultimaFecha], ["PROXIMA FECHA", n.proximaFecha], ["TIPO DE MANTENIMIENTO", n.tipo]]} />
              </Rejilla>
              <p className="hv-observacionNovedad">OBSERVACION: {n.observacion}</p>
            </div>
          ))}
        </Seccion>

        <Firmas hoja={hoja} />
      </article>
    </div>
  );
}
