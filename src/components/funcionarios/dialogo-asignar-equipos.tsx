"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { asignarVariosActivos } from "@/acciones/asignaciones";
import type { EquipoParaAsignar } from "@/db/consultas";
import { DialogoAccion } from "@/components/acciones/dialogo-accion";
import { CampoFecha, CampoMotivo } from "@/components/acciones/campos";
import { SelectorBuscable } from "@/components/selector-buscable";
import { Label } from "@/components/ui/label";
import { ETIQUETAS_TIPO } from "@/lib/etiquetas";
import { hoyIso } from "@/lib/fechas";

function describir(e: EquipoParaAsignar) {
  return [ETIQUETAS_TIPO[e.tipo], e.marca, e.modelo].filter(Boolean).join(" ");
}

/** Asigna varios equipos al funcionario en una sola operación. */
export function DialogoAsignarEquipos({
  funcionario,
  equipos,
}: {
  funcionario: { id: number; nombre: string };
  equipos: EquipoParaAsignar[];
}) {
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [fecha, setFecha] = useState(hoyIso());
  const [motivo, setMotivo] = useState("");

  const porId = new Map(equipos.map((e) => [e.id, e]));
  const opciones = equipos
    .filter((e) => !elegidos.includes(e.id) && e.tieneAhora !== funcionario.nombre)
    .map((e) => ({
      valor: String(e.id),
      etiqueta: [e.codigo, describir(e), e.serial, e.tieneAhora ?? "Disponible"]
        .filter(Boolean)
        .join(" · "),
    }));

  return (
    <DialogoAccion
      textoDisparador="Asignar equipos"
      titulo={`Asignar equipos a ${funcionario.nombre}`}
      descripcion="Los disponibles se asignan y los que tiene otra persona se trasladan, todo en una sola operación. Los equipos van al funcionario: su ubicación no cambia."
      textoConfirmar={elegidos.length > 1 ? `Asignar ${elegidos.length} equipos` : "Asignar"}
      mensajeExito="Equipos asignados"
      alAbrir={() => {
        setElegidos([]);
        setFecha(hoyIso());
        setMotivo("");
      }}
      alConfirmar={() =>
        asignarVariosActivos({ funcionarioId: funcionario.id, activoIds: elegidos, fecha, motivo })
      }
    >
      <div className="space-y-2">
        <Label htmlFor="agregar-equipo">Agregar equipo</Label>
        <SelectorBuscable
          // Se reinicia tras cada elección para dejar el buscador vacío
          key={elegidos.length}
          id="agregar-equipo"
          opciones={opciones}
          valor=""
          alCambiar={(valor) => valor && setElegidos([...elegidos, Number(valor)])}
          placeholder="Escriba código, serial o responsable..."
        />
      </div>

      {elegidos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin equipos elegidos.</p>
      ) : (
        <ul className="max-h-60 space-y-2 overflow-y-auto">
          {elegidos.map((id) => {
            const e = porId.get(id);
            if (!e) return null;
            return (
              <li key={id} className="flex items-start justify-between gap-2 text-sm">
                <div>
                  <span className="font-mono font-medium">{e.codigo}</span>{" "}
                  <span className="text-muted-foreground">{describir(e)}</span>
                  <p className="text-xs text-muted-foreground">
                    {e.tieneAhora ? `Se traslada desde ${e.tieneAhora}` : "Disponible"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Quitar ${e.codigo}`}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                  onClick={() => setElegidos(elegidos.filter((x) => x !== id))}
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <CampoFecha valor={fecha} alCambiar={setFecha} />
      <CampoMotivo valor={motivo} alCambiar={setMotivo} placeholder="Ej: Puesto nuevo" />
    </DialogoAccion>
  );
}
