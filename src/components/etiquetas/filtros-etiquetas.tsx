"use client";

import { useState } from "react";
import { BotonEnlace } from "@/components/boton-enlace";
import { opcionesDesde, Selector } from "@/components/selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ETIQUETAS_TIPO } from "@/lib/etiquetas";

const TODOS = { valor: "", etiqueta: "Todos" };

/** Filtros de la hoja de etiquetas: se envían por GET y quedan en la URL. */
export function FiltrosEtiquetas({
  ubicaciones,
  inicial,
}: {
  ubicaciones: string[];
  inicial: { tipo: string; ubicacion: string; texto: string };
}) {
  const [tipo, setTipo] = useState(inicial.tipo);
  const [ubicacion, setUbicacion] = useState(inicial.ubicacion);

  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      <div className="min-w-44 flex-1 space-y-1">
        <Label htmlFor="texto" className="text-xs text-muted-foreground">
          Buscar
        </Label>
        <Input
          id="texto"
          name="texto"
          defaultValue={inicial.texto}
          placeholder="Código, marca, modelo, responsable..."
        />
      </div>
      <div className="min-w-40 space-y-1">
        <Label htmlFor="tipo" className="text-xs text-muted-foreground">
          Tipo
        </Label>
        <Selector
          id="tipo"
          nombre="tipo"
          opciones={[TODOS, ...opcionesDesde(ETIQUETAS_TIPO)]}
          valor={tipo}
          alCambiar={setTipo}
        />
      </div>
      <div className="min-w-56 space-y-1">
        <Label htmlFor="ubicacion" className="text-xs text-muted-foreground">
          Ubicación
        </Label>
        <Selector
          id="ubicacion"
          nombre="ubicacion"
          opciones={[TODOS, ...ubicaciones.map((u) => ({ valor: u, etiqueta: u }))]}
          valor={ubicacion}
          alCambiar={setUbicacion}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Filtrar</Button>
        <BotonEnlace variant="outline" href="/etiquetas">
          Limpiar
        </BotonEnlace>
      </div>
    </form>
  );
}
