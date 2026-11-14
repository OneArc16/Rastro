"use client";

import { useState } from "react";
import {
  asignarActivo,
  darDeBajaActivo,
  devolverActivo,
  intercambiarActivos,
  trasladarActivo,
} from "@/acciones/asignaciones";
import { DialogoAccion } from "@/components/acciones/dialogo-accion";
import {
  CampoFecha,
  CampoMotivo,
  SelectorDestino,
  type TipoDestino,
} from "@/components/acciones/campos";
import { DialogoMantenimiento } from "@/components/mantenimientos/dialogo-mantenimiento";
import { Selector } from "@/components/selector";
import { Label } from "@/components/ui/label";
import type { Destinos } from "@/db/consultas";
import { ETIQUETAS_TIPO } from "@/lib/etiquetas";
import { hoyIso } from "@/lib/fechas";

type ActivoResumen = { id: number; codigo: string };

type ActivoAsignado = {
  id: number;
  codigo: string;
  tipo: keyof typeof ETIQUETAS_TIPO;
  responsable: string | null;
  ubicacion: string | null;
};

/** Asignar (sin vigente) o trasladar (con vigente): mismos campos, distinta acción. */
function DialogoMovimiento({
  activo,
  destinos,
  modo,
}: {
  activo: ActivoResumen;
  destinos: Destinos;
  modo: "asignar" | "trasladar";
}) {
  const [tipo, setTipo] = useState<TipoDestino>("funcionario");
  const [destinoId, setDestinoId] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [motivo, setMotivo] = useState("");
  const esTraslado = modo === "trasladar";

  return (
    <DialogoAccion
      textoDisparador={esTraslado ? "Trasladar" : "Asignar"}
      varianteDisparador={esTraslado ? "outline" : "default"}
      titulo={`${esTraslado ? "Trasladar" : "Asignar"} ${activo.codigo}`}
      descripcion={
        esTraslado
          ? "Se cierra la asignación actual y se abre una nueva con el nuevo responsable."
          : undefined
      }
      textoConfirmar={esTraslado ? "Trasladar" : "Asignar"}
      alAbrir={() => {
        setTipo("funcionario");
        setDestinoId("");
        setFecha(hoyIso());
        setMotivo("");
      }}
      alConfirmar={() => {
        const datos = { activoId: activo.id, tipoDestino: tipo, destinoId, fecha, motivo };
        return esTraslado ? trasladarActivo(datos) : asignarActivo(datos);
      }}
    >
      <SelectorDestino
        destinos={destinos}
        tipo={tipo}
        destinoId={destinoId}
        alCambiarTipo={setTipo}
        alCambiarDestino={setDestinoId}
      />
      <CampoFecha valor={fecha} alCambiar={setFecha} />
      <CampoMotivo
        valor={motivo}
        alCambiar={setMotivo}
        placeholder={esTraslado ? "Traslado de monitor" : "Asignación inicial"}
      />
    </DialogoAccion>
  );
}

function DialogoDevolver({ activo }: { activo: ActivoResumen }) {
  const [fecha, setFecha] = useState(hoyIso());

  return (
    <DialogoAccion
      textoDisparador="Devolver"
      titulo={`Devolver ${activo.codigo}`}
      descripcion="Se cierra la asignación actual y el activo queda disponible."
      textoConfirmar="Devolver"
      alAbrir={() => setFecha(hoyIso())}
      alConfirmar={() => devolverActivo({ activoId: activo.id, fecha })}
    >
      <CampoFecha valor={fecha} alCambiar={setFecha} etiqueta="Fecha de devolución" />
    </DialogoAccion>
  );
}

function DialogoIntercambio({
  activo,
  asignados,
}: {
  activo: ActivoResumen;
  asignados: ActivoAsignado[];
}) {
  const [otroId, setOtroId] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [motivo, setMotivo] = useState("Cambio de PC");

  const opciones = asignados
    .filter((a) => a.id !== activo.id)
    .map((a) => ({
      valor: String(a.id),
      etiqueta: `${a.codigo} · ${ETIQUETAS_TIPO[a.tipo]} · ${a.responsable ?? a.ubicacion}`,
    }));

  return (
    <DialogoAccion
      textoDisparador="Intercambiar"
      titulo={`Intercambiar ${activo.codigo}`}
      descripcion="Cada responsable queda con el equipo del otro, en una sola operación."
      textoConfirmar="Intercambiar"
      alAbrir={() => {
        setOtroId("");
        setFecha(hoyIso());
        setMotivo("Cambio de PC");
      }}
      alConfirmar={() =>
        intercambiarActivos({ activoAId: activo.id, activoBId: otroId, fecha, motivo })
      }
    >
      <div className="space-y-2">
        <Label htmlFor="otro-activo">Intercambiar con</Label>
        <Selector
          id="otro-activo"
          opciones={opciones}
          valor={otroId}
          alCambiar={setOtroId}
          placeholder="Seleccione el otro activo..."
        />
      </div>
      <CampoFecha valor={fecha} alCambiar={setFecha} />
      <CampoMotivo valor={motivo} alCambiar={setMotivo} />
    </DialogoAccion>
  );
}

function DialogoBaja({ activo }: { activo: ActivoResumen }) {
  const [fecha, setFecha] = useState(hoyIso());
  const [motivo, setMotivo] = useState("");

  return (
    <DialogoAccion
      textoDisparador="Dar de baja"
      varianteDisparador="destructive"
      titulo={`Dar de baja ${activo.codigo}`}
      descripcion="El activo no se borra: queda con su historial, pero ya no se puede asignar ni editar. Si está asignado, se cierra su asignación."
      textoConfirmar="Dar de baja"
      varianteConfirmar="destructive"
      alAbrir={() => {
        setFecha(hoyIso());
        setMotivo("");
      }}
      alConfirmar={() => darDeBajaActivo({ activoId: activo.id, fecha, motivo })}
    >
      <CampoFecha valor={fecha} alCambiar={setFecha} />
      <CampoMotivo valor={motivo} alCambiar={setMotivo} placeholder="Board dañada" />
    </DialogoAccion>
  );
}

type Props = {
  activo: ActivoResumen;
  dadoDeBaja: boolean;
  tieneVigente: boolean;
  destinos: Destinos;
  asignados: ActivoAsignado[];
};

/** Acciones disponibles según el estado del activo. */
export function AccionesActivo({
  activo,
  dadoDeBaja,
  tieneVigente,
  destinos,
  asignados,
}: Props) {
  if (dadoDeBaja) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tieneVigente ? (
        <>
          <DialogoMovimiento activo={activo} destinos={destinos} modo="trasladar" />
          <DialogoIntercambio activo={activo} asignados={asignados} />
          <DialogoDevolver activo={activo} />
        </>
      ) : (
        <DialogoMovimiento activo={activo} destinos={destinos} modo="asignar" />
      )}
      <DialogoMantenimiento activo={activo} />
      <DialogoBaja activo={activo} />
    </div>
  );
}
