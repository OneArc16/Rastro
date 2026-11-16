"use client";

import type { UseFormWatch, FieldValues } from "react-hook-form";
import {
  CALIFICACIONES_BAJA,
  type DatosEgreso,
  type DatosEntrega,
} from "@/lib/validacion/actas";
import {
  CampoArea,
  CampoTexto,
  CamposPersona,
  CamposResponsable,
  Rejilla,
  Seccion,
  type Registro,
} from "./campos";

const claseSelect =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30";

// ---------------------------------------------------------------------------
// Entrega
// ---------------------------------------------------------------------------

export function SeccionesEntrega({
  register,
  datos,
}: {
  register: Registro;
  datos: DatosEntrega;
}) {
  return (
    <>
      <Seccion titulo="Datos del responsable del equipo">
        <CamposResponsable register={register} />
      </Seccion>

      <Seccion titulo="Dispositivos periféricos">
        <div className="space-y-2">
          {datos.perifericos.map((p, i) => (
            <div key={i} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[8rem_1fr_1fr]">
              <p className="text-sm font-medium sm:pb-1.5">{p.dispositivo}</p>
              <CampoTexto ruta={`datos.perifericos.${i}.marca`} etiqueta="Marca" register={register} />
              <CampoTexto
                ruta={`datos.perifericos.${i}.serial`}
                etiqueta="N° serial"
                register={register}
              />
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Torre de computador">
        <Rejilla>
          {(
            [
              ["marcaCpu", "Marca CPU"],
              ["velocidad", "Velocidad"],
              ["cantidadRam", "Cantidad RAM"],
              ["tipoRam", "Tipo de RAM"],
              ["hdmi", "HDMI"],
              ["vga", "VGA"],
              ["discoDuro", "Disco duro"],
              ["tarjetaVideo", "Tarjeta de video"],
              ["unidadOptica", "Unidad de CD/DVD"],
              ["serialTorre", "Serial torre"],
              ["sistemaOperativo", "Sistema operativo"],
              ["marca", "Marca"],
            ] as const
          ).map(([campo, etiqueta]) => (
            <CampoTexto
              key={campo}
              ruta={`datos.torre.${campo}`}
              etiqueta={etiqueta}
              register={register}
            />
          ))}
        </Rejilla>
      </Seccion>

      <Seccion titulo="Software y pruebas">
        <CampoArea ruta="datos.software" etiqueta="Software instalado" register={register} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {datos.pruebas.map((p, i) => (
            <label key={i} className="flex items-center justify-between gap-3 text-sm">
              {p.prueba}
              <select className={`${claseSelect} max-w-32`} {...register(`datos.pruebas.${i}.resultado`)}>
                <option value="">Sin marcar</option>
                <option value="ok">OK</option>
                <option value="falla">Falla</option>
              </select>
            </label>
          ))}
        </div>
        <CampoTexto
          ruta="datos.tiempoEstimadoUso"
          etiqueta="Tiempo estimado de uso"
          register={register}
        />
      </Seccion>

      <Seccion titulo="Observación y firmas">
        <CampoArea ruta="datos.observacion" etiqueta="Observación" register={register} />
        <Rejilla>
          <CamposPersona ruta="datos.entrega" titulo="Quien entrega" register={register} />
          <CampoTexto
            ruta="datos.fechaEntrega"
            etiqueta="Fecha de entrega"
            tipo="date"
            register={register}
          />
          <CampoTexto
            ruta="datos.fechaRecibido"
            etiqueta="Fecha de recibido"
            tipo="date"
            register={register}
          />
        </Rejilla>
      </Seccion>
    </>
  );
}

// ---------------------------------------------------------------------------
// Egreso
// ---------------------------------------------------------------------------

export function SeccionesEgreso({
  register,
  datos,
}: {
  register: Registro;
  datos: DatosEgreso;
}) {
  return (
    <>
      <Seccion titulo="Funcionario T.I. que realiza el egreso">
        <Rejilla>
          <CamposPersona ruta="datos.funcionarioTi" titulo="Funcionario" register={register} />
          <CampoTexto
            ruta="datos.funcionarioTi.correo"
            etiqueta="Correo electrónico"
            register={register}
          />
          <CampoTexto ruta="datos.funcionarioTi.celular" etiqueta="N° celular" register={register} />
        </Rejilla>
      </Seccion>

      <Seccion titulo="Dispositivos enviados">
        <div className="space-y-2">
          {datos.dispositivos.map((d, i) => (
            <div
              key={i}
              className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[8rem_7rem_6rem_1fr]"
            >
              <p className="col-span-2 text-sm font-medium sm:col-span-1 sm:pb-1.5">
                {d.dispositivo}
              </p>
              <label className="space-y-1.5 text-sm">
                <span className="block">Enviado</span>
                <select className={claseSelect} {...register(`datos.dispositivos.${i}.enviado`)}>
                  <option value="">—</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </label>
              <CampoTexto
                ruta={`datos.dispositivos.${i}.cantidad`}
                etiqueta="Cantidad"
                register={register}
              />
              <div className="col-span-2 sm:col-span-1">
                <CampoTexto
                  ruta={`datos.dispositivos.${i}.detalle`}
                  etiqueta="Detalle"
                  register={register}
                />
              </div>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Envío y firmas">
        <CampoArea ruta="datos.detalleEnvio" etiqueta="Detalle del envío" register={register} />
        <Rejilla>
          <CamposPersona ruta="datos.recibe" titulo="Quien recibe en el dispensario" register={register} />
          <CampoTexto
            ruta="datos.fechaSalida"
            etiqueta="Fecha de salida"
            tipo="date"
            register={register}
          />
        </Rejilla>
      </Seccion>
    </>
  );
}

// ---------------------------------------------------------------------------
// Baja
// ---------------------------------------------------------------------------

export function SeccionesBaja({
  register,
  watch,
}: {
  register: Registro;
  watch: UseFormWatch<FieldValues>;
}) {
  const marcadas: string[] = watch("datos.calificaciones") ?? [];
  return (
    <>
      <Seccion titulo="Datos del responsable del equipo">
        <CamposResponsable register={register} />
      </Seccion>

      <Seccion titulo="Datos del equipo a dar de baja">
        <Rejilla>
          {(
            [
              ["elemento", "Elemento de cómputo"],
              ["marca", "Marca"],
              ["modelo", "Modelo"],
              ["serial", "Serial"],
              ["capacidadDisco", "Capacidad disco duro"],
              ["procesador", "Procesador"],
              ["ram", "Memoria RAM"],
            ] as const
          ).map(([campo, etiqueta]) => (
            <CampoTexto
              key={campo}
              ruta={`datos.equipo.${campo}`}
              etiqueta={etiqueta}
              register={register}
            />
          ))}
          <CampoTexto
            ruta="datos.equipo.fechaCompra"
            etiqueta="Fecha de compra"
            tipo="date"
            register={register}
          />
          <CampoTexto
            ruta="datos.equipo.fechaBaja"
            etiqueta="Fecha de baja del equipo"
            tipo="date"
            register={register}
          />
        </Rejilla>
      </Seccion>

      <Seccion titulo="Calificación del equipo">
        <div className="space-y-2">
          {CALIFICACIONES_BAJA.map((calificacion) => (
            <label key={calificacion} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                value={calificacion}
                className="mt-0.5 size-4 accent-primary"
                {...register("datos.calificaciones")}
              />
              <span className={marcadas.includes(calificacion) ? "font-medium" : undefined}>
                {calificacion}
              </span>
            </label>
          ))}
        </div>
        <CampoArea
          ruta="datos.especificacion"
          etiqueta="Especificación de la calificación"
          register={register}
        />
      </Seccion>

      <Seccion titulo="Diagnóstico y firmas">
        <Rejilla>
          <CamposPersona
            ruta="datos.diagnostico"
            titulo="Responsable del diagnóstico"
            register={register}
          />
          <CamposPersona ruta="datos.jefeArea" titulo="Jefe de área (VoBo)" register={register} />
        </Rejilla>
      </Seccion>
    </>
  );
}
