"use client";

import { useState } from "react";
import { Selector } from "@/components/selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TIPOS_ACTA_CORTOS } from "@/lib/actas";

type Filtros = { texto: string; tipo: string; desde: string; hasta: string };

/** Formulario GET: la búsqueda queda en la dirección y se puede volver a ella. */
export function FiltrosActas({ filtros }: { filtros: Filtros }) {
  const [tipo, setTipo] = useState(filtros.tipo);
  return (
    <form method="get" className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
      <div className="space-y-1.5">
        <Label htmlFor="texto">Buscar</Label>
        <Input
          id="texto"
          name="texto"
          defaultValue={filtros.texto}
          placeholder="ENT-0001, PC-014, nombre, texto del acta…"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tipo">Tipo</Label>
        <Selector
          id="tipo"
          nombre="tipo"
          valor={tipo}
          alCambiar={setTipo}
          opciones={[
            { valor: "", etiqueta: "Todas" },
            ...Object.entries(TIPOS_ACTA_CORTOS).map(([valor, etiqueta]) => ({ valor, etiqueta })),
          ]}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="desde">Desde</Label>
        <Input id="desde" name="desde" type="date" defaultValue={filtros.desde} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hasta">Hasta</Label>
        <Input id="hasta" name="hasta" type="date" defaultValue={filtros.hasta} />
      </div>
      <Button type="submit">Buscar</Button>
    </form>
  );
}
