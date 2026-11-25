"use client";

import { useState } from "react";
import { cruzarPuestosAccion } from "@/acciones/asignaciones";
import { DialogoAccion } from "@/components/acciones/dialogo-accion";
import { CampoFecha, CampoMotivo } from "@/components/acciones/campos";
import { SelectorBuscable } from "@/components/selector-buscable";
import { Label } from "@/components/ui/label";
import { hoyIso } from "@/lib/fechas";

const MOTIVO_POR_DEFECTO = "Cambio de puesto";

/** Dos funcionarios cambian de puesto: cada uno queda con los equipos y la ubicación del otro. */
export function DialogoCrucePuestos({
  funcionario,
  companeros,
}: {
  funcionario: { id: number; nombre: string };
  companeros: { id: number; nombre: string; ubicacion: string | null }[];
}) {
  const [otroId, setOtroId] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [motivo, setMotivo] = useState(MOTIVO_POR_DEFECTO);

  const opciones = companeros
    .filter((c) => c.id !== funcionario.id)
    .map((c) => ({
      valor: String(c.id),
      etiqueta: c.ubicacion ? `${c.nombre} · ${c.ubicacion}` : c.nombre,
    }));

  return (
    <DialogoAccion
      textoDisparador="Cambiar de puesto"
      titulo={`Cambiar de puesto a ${funcionario.nombre}`}
      descripcion="Los equipos se quedan en su puesto: cada funcionario pasa a responder por todos los equipos del otro y toma su ubicación."
      textoConfirmar="Cambiar de puesto"
      mensajeExito="Cambio de puesto registrado"
      alAbrir={() => {
        setOtroId("");
        setFecha(hoyIso());
        setMotivo(MOTIVO_POR_DEFECTO);
      }}
      alConfirmar={() =>
        cruzarPuestosAccion({
          funcionarioAId: funcionario.id,
          funcionarioBId: otroId,
          fecha,
          motivo,
        })
      }
    >
      <div className="space-y-2">
        <Label htmlFor="otro-funcionario">Cambia de puesto con</Label>
        <SelectorBuscable
          id="otro-funcionario"
          opciones={opciones}
          valor={otroId}
          alCambiar={setOtroId}
          placeholder="Escriba el nombre..."
        />
      </div>
      <CampoFecha valor={fecha} alCambiar={setFecha} />
      <CampoMotivo valor={motivo} alCambiar={setMotivo} />
    </DialogoAccion>
  );
}
