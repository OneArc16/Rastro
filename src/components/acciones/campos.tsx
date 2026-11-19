"use client";

import type { Destinos } from "@/db/consultas";
import { Selector } from "@/components/selector";
import { SelectorBuscable } from "@/components/selector-buscable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CampoFecha({
  valor,
  alCambiar,
  etiqueta = "Fecha",
  id = "fecha-accion",
  obligatorio = true,
}: {
  valor: string;
  alCambiar: (valor: string) => void;
  etiqueta?: string;
  id?: string;
  obligatorio?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Input
        id={id}
        type="date"
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        required={obligatorio}
      />
    </div>
  );
}

export function CampoMotivo({
  valor,
  alCambiar,
  placeholder,
  etiqueta = "Motivo",
}: {
  valor: string;
  alCambiar: (valor: string) => void;
  placeholder?: string;
  etiqueta?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="motivo-accion">{etiqueta}</Label>
      <Input
        id="motivo-accion"
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export type TipoDestino = "funcionario" | "ubicacion";

const OPCIONES_TIPO_DESTINO = [
  { valor: "funcionario", etiqueta: "Funcionario" },
  { valor: "ubicacion", etiqueta: "Ubicación (equipo compartido)" },
];

/** Elige a quién va el activo: un funcionario o una ubicación, nunca ambos. */
export function SelectorDestino({
  destinos,
  tipo,
  destinoId,
  alCambiarTipo,
  alCambiarDestino,
}: {
  destinos: Destinos;
  tipo: TipoDestino;
  destinoId: string;
  alCambiarTipo: (tipo: TipoDestino) => void;
  alCambiarDestino: (id: string) => void;
}) {
  const opciones =
    tipo === "funcionario"
      ? destinos.funcionarios.map((f) => ({ valor: String(f.id), etiqueta: f.nombre }))
      : destinos.ubicaciones.map((u) => ({ valor: String(u.id), etiqueta: u.nombre }));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tipo-destino">Asignar a</Label>
        <Selector
          id="tipo-destino"
          opciones={OPCIONES_TIPO_DESTINO}
          valor={tipo}
          alCambiar={(valor) => {
            alCambiarTipo(valor as TipoDestino);
            alCambiarDestino("");
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="destino">
          {tipo === "funcionario" ? "Funcionario" : "Ubicación"}
        </Label>
        <SelectorBuscable
          // Al cambiar entre funcionario y ubicación se reinicia la búsqueda
          key={tipo}
          id="destino"
          opciones={opciones}
          valor={destinoId}
          alCambiar={alCambiarDestino}
          placeholder={tipo === "funcionario" ? "Escriba el nombre..." : "Escriba la ubicación..."}
        />
      </div>
    </div>
  );
}
