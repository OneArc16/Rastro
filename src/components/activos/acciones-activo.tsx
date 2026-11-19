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
import { SelectorBuscable } from "@/components/selector-buscable";
import { Label } from "@/components/ui/label";
import type { Destinos } from "@/db/consultas";
import { ETIQUETAS_TIPO } from "@/lib/etiquetas";
import { hoyIso } from "@/lib/fechas";

type ActivoResumen = { id: number; codigo: string };
type Ubicacion = { id: number; nombre: string };
type QuienSeMueve = "funcionario" | "equipo";

/**
 * Al trasladar a un funcionario que está en otra ubicación que el equipo:
 * pregunta si se va la persona o se va el equipo.
 */
function PreguntaUbicacion({
  funcionario,
  ubicacionEquipo,
  ubicacionFuncionario,
  valor,
  alCambiar,
}: {
  funcionario: string;
  ubicacionEquipo: string;
  ubicacionFuncionario: string | null;
  valor: QuienSeMueve | "";
  alCambiar: (valor: QuienSeMueve) => void;
}) {
  const opciones: { valor: QuienSeMueve; titulo: string; detalle: string }[] = [
    {
      valor: "funcionario",
      titulo: `${funcionario} se va a ${ubicacionEquipo}`,
      detalle: `Su ubicación cambia a ${ubicacionEquipo}; sus otros equipos asignados también quedan ahí.`,
    },
    {
      valor: "equipo",
      titulo: ubicacionFuncionario
        ? `El equipo va a ${ubicacionFuncionario}`
        : `El equipo queda con ${funcionario}, sin ubicación`,
      detalle: `${funcionario} sigue ${ubicacionFuncionario ? `en ${ubicacionFuncionario}` : "sin ubicación"}.`,
    },
  ];
  return (
    <div
      role="radiogroup"
      aria-labelledby="pregunta-ubicacion"
      className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3"
    >
      <p id="pregunta-ubicacion" className="text-sm font-medium">
        El equipo está en {ubicacionEquipo} y {funcionario}{" "}
        {ubicacionFuncionario ? `en ${ubicacionFuncionario}` : "no tiene ubicación"}. ¿Quién cambia de lugar?
      </p>
      {opciones.map((o) => (
        <label key={o.valor} className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="radio"
            name="se-mueve"
            className="mt-0.5 size-4 accent-primary"
            checked={valor === o.valor}
            onChange={() => alCambiar(o.valor)}
          />
          <span>
            <span className="font-medium">{o.titulo}</span>
            <span className="block text-muted-foreground">{o.detalle}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

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
  ubicacionActual = null,
}: {
  activo: ActivoResumen;
  destinos: Destinos;
  modo: "asignar" | "trasladar";
  ubicacionActual?: Ubicacion | null;
}) {
  const [tipo, setTipo] = useState<TipoDestino>("funcionario");
  const [destinoId, setDestinoId] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [motivo, setMotivo] = useState("");
  const [seMueve, setSeMueve] = useState<QuienSeMueve | "">("");
  const esTraslado = modo === "trasladar";

  // Funcionario elegido que está en otra ubicación que el equipo
  const funcionario =
    tipo === "funcionario" ? destinos.funcionarios.find((f) => String(f.id) === destinoId) : undefined;
  const conflicto =
    esTraslado && ubicacionActual !== null && funcionario !== undefined && funcionario.ubicacionId !== ubicacionActual.id
      ? {
          funcionario: funcionario.nombre,
          ubicacionFuncionario:
            destinos.ubicaciones.find((u) => u.id === funcionario.ubicacionId)?.nombre ?? null,
        }
      : null;

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
      mensajeExito={`${activo.codigo} ${esTraslado ? "trasladado" : "asignado"}`}
      alAbrir={() => {
        setTipo("funcionario");
        setDestinoId("");
        setFecha(hoyIso());
        setMotivo("");
        setSeMueve("");
      }}
      alConfirmar={() => {
        const datos = {
          activoId: activo.id,
          tipoDestino: tipo,
          destinoId,
          fecha,
          motivo,
          seMueve: conflicto && seMueve ? seMueve : undefined,
        };
        return esTraslado ? trasladarActivo(datos) : asignarActivo(datos);
      }}
    >
      <SelectorDestino
        destinos={destinos}
        tipo={tipo}
        destinoId={destinoId}
        alCambiarTipo={setTipo}
        alCambiarDestino={(id) => {
          setDestinoId(id);
          setSeMueve("");
        }}
      />
      {conflicto && ubicacionActual && (
        <PreguntaUbicacion
          funcionario={conflicto.funcionario}
          ubicacionEquipo={ubicacionActual.nombre}
          ubicacionFuncionario={conflicto.ubicacionFuncionario}
          valor={seMueve}
          alCambiar={setSeMueve}
        />
      )}
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
      mensajeExito={`${activo.codigo} devuelto y disponible`}
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
      mensajeExito="Intercambio registrado"
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
        <SelectorBuscable
          id="otro-activo"
          opciones={opciones}
          valor={otroId}
          alCambiar={setOtroId}
          placeholder="Escriba código, tipo o responsable..."
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
      mensajeExito={`${activo.codigo} dado de baja`}
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
  /** Dónde está hoy el activo, para preguntar quién se mueve al trasladar. */
  ubicacionActual: Ubicacion | null;
};

/** Acciones disponibles según el estado del activo. */
export function AccionesActivo({
  activo,
  dadoDeBaja,
  tieneVigente,
  destinos,
  asignados,
  ubicacionActual,
}: Props) {
  if (dadoDeBaja) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tieneVigente ? (
        <>
          <DialogoMovimiento
            activo={activo}
            destinos={destinos}
            modo="trasladar"
            ubicacionActual={ubicacionActual}
          />
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
