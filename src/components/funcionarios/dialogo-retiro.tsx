"use client";

import { useState } from "react";
import { retirarFuncionarioAccion } from "@/acciones/asignaciones";
import { DialogoAccion } from "@/components/acciones/dialogo-accion";
import { CampoFecha } from "@/components/acciones/campos";
import { hoyIso } from "@/lib/fechas";

export function DialogoRetiro({
  funcionario,
  equiposVigentes,
}: {
  funcionario: { id: number; nombre: string };
  equiposVigentes: number;
}) {
  const [fecha, setFecha] = useState(hoyIso());

  const aviso =
    equiposVigentes > 0
      ? `Se cerrarán sus ${equiposVigentes} asignaciones vigentes y esos equipos quedarán disponibles.`
      : "No tiene equipos asignados.";

  return (
    <DialogoAccion
      textoDisparador="Retirar"
      varianteDisparador="destructive"
      titulo={`Retirar a ${funcionario.nombre}`}
      descripcion={`No se borra: conserva su historial. ${aviso}`}
      textoConfirmar="Retirar"
      varianteConfirmar="destructive"
      alAbrir={() => setFecha(hoyIso())}
      alConfirmar={() => retirarFuncionarioAccion({ funcionarioId: funcionario.id, fecha })}
    >
      <CampoFecha valor={fecha} alCambiar={setFecha} etiqueta="Fecha de retiro" />
    </DialogoAccion>
  );
}
