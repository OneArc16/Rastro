"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  id: string;
  valor: string;
  alCambiar: (valor: string) => void;
  placeholder: string;
};

/** Caja de búsqueda con etiqueta "Buscar", para filtrar listas en el navegador. */
export function CampoBusqueda({ id, valor, alCambiar, placeholder }: Props) {
  return (
    <div className="max-w-md space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        Buscar
      </Label>
      <Input
        id={id}
        type="search"
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
