"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Opcion = { valor: string; etiqueta: string };

type Props = {
  opciones: Opcion[];
  valor: string;
  alCambiar: (valor: string) => void;
  placeholder?: string;
  tamano?: "sm" | "default";
  id?: string;
  className?: string;
};

/**
 * Select de una sola opción con etiquetas legibles.
 * Base UI muestra el valor crudo en el disparador salvo que la raíz reciba
 * `items`; este componente siempre lo pasa.
 */
export function Selector({
  opciones,
  valor,
  alCambiar,
  placeholder,
  tamano = "default",
  id,
  className = "w-full",
}: Props) {
  const items = opciones.map((opcion) => ({
    value: opcion.valor,
    label: opcion.etiqueta,
  }));

  return (
    <Select
      items={items}
      value={valor}
      onValueChange={(nuevo) => alCambiar((nuevo as string | null) ?? "")}
    >
      <SelectTrigger id={id} size={tamano} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {opciones.map((opcion) => (
          <SelectItem key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Convierte un registro { valor: etiqueta } en opciones del selector. */
export function opcionesDesde(registro: Record<string, string>): Opcion[] {
  return Object.entries(registro).map(([valor, etiqueta]) => ({ valor, etiqueta }));
}
