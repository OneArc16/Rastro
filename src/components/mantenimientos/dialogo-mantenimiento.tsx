"use client";

import { useState } from "react";
import { registrarMantenimientoAccion } from "@/acciones/mantenimientos";
import { DialogoAccion } from "@/components/acciones/dialogo-accion";
import { CampoFecha, CampoMotivo } from "@/components/acciones/campos";
import { opcionesDesde, Selector, type Opcion } from "@/components/selector";
import { Label } from "@/components/ui/label";
import { ETIQUETAS_MANTENIMIENTO } from "@/lib/etiquetas";
import { hoyIso } from "@/lib/fechas";

const OPCIONES_TIPO = opcionesDesde(ETIQUETAS_MANTENIMIENTO);

type Props = {
  textoDisparador?: string;
  varianteDisparador?: "default" | "outline";
} & (
  | { /** Activo ya elegido (ficha de activo, fila de pendientes). */ activo: { id: number; codigo: string } }
  | { /** Registro rápido: el usuario elige el activo. */ activos: Opcion[] }
);

/** Registro de un mantenimiento, para un activo fijo o eligiéndolo de una lista. */
export function DialogoMantenimiento(props: Props) {
  const activoFijo = "activo" in props ? props.activo : null;

  const [activoId, setActivoId] = useState(activoFijo ? String(activoFijo.id) : "");
  const [fecha, setFecha] = useState(hoyIso());
  const [tipo, setTipo] = useState("preventivo");
  const [proximaFecha, setProximaFecha] = useState("");
  const [observacion, setObservacion] = useState("");

  return (
    <DialogoAccion
      textoDisparador={props.textoDisparador ?? "Registrar mantenimiento"}
      varianteDisparador={props.varianteDisparador ?? "outline"}
      titulo={activoFijo ? `Mantenimiento de ${activoFijo.codigo}` : "Registrar mantenimiento"}
      textoConfirmar="Registrar"
      alAbrir={() => {
        setActivoId(activoFijo ? String(activoFijo.id) : "");
        setFecha(hoyIso());
        setTipo("preventivo");
        setProximaFecha("");
        setObservacion("");
      }}
      alConfirmar={() =>
        registrarMantenimientoAccion({ activoId, fecha, tipo, proximaFecha, observacion })
      }
    >
      {!activoFijo && "activos" in props && (
        <div className="space-y-2">
          <Label htmlFor="activo-mantenimiento">Activo</Label>
          <Selector
            id="activo-mantenimiento"
            opciones={props.activos}
            valor={activoId}
            alCambiar={setActivoId}
            placeholder="Seleccione el activo..."
          />
        </div>
      )}
      <CampoFecha valor={fecha} alCambiar={setFecha} etiqueta="Fecha del mantenimiento" />
      <div className="space-y-2">
        <Label htmlFor="tipo-mantenimiento">Tipo</Label>
        <Selector id="tipo-mantenimiento" opciones={OPCIONES_TIPO} valor={tipo} alCambiar={setTipo} />
      </div>
      <CampoFecha
        id="proxima-fecha"
        valor={proximaFecha}
        alCambiar={setProximaFecha}
        etiqueta="Próxima fecha (opcional)"
        obligatorio={false}
      />
      <CampoMotivo
        etiqueta="Observación"
        valor={observacion}
        alCambiar={setObservacion}
        placeholder="Limpieza interna y actualización de Windows"
      />
    </DialogoAccion>
  );
}
