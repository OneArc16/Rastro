"use client";

import Link from "next/link";
import { useState } from "react";
import { CampoBusqueda } from "@/components/campo-busqueda";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogoUbicacion } from "@/components/ubicaciones/dialogo-ubicacion";
import { ETIQUETAS_TIPO } from "@/lib/etiquetas";
import { filtrarUbicaciones } from "./filtrar-ubicaciones";

type FilaUbicacion = {
  id: number;
  nombre: string;
  funcionarios: { id: number; nombre: string }[];
  equiposCompartidos: { codigo: string; tipo: keyof typeof ETIQUETAS_TIPO }[];
};

export function ListaUbicaciones({ filas }: { filas: FilaUbicacion[] }) {
  const [busqueda, setBusqueda] = useState("");
  const visibles = filtrarUbicaciones(filas, busqueda);

  return (
    <div className="space-y-4">
      <CampoBusqueda
        id="busqueda-ubicaciones"
        valor={busqueda}
        alCambiar={setBusqueda}
        placeholder="Ubicación, funcionario, código de equipo..."
      />

      {visibles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ninguna ubicación coincide con «{busqueda.trim()}».
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((ubicacion) => (
            <Card key={ubicacion.id}>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-base">{ubicacion.nombre}</CardTitle>
                <DialogoUbicacion
                  ubicacion={{ id: ubicacion.id, nombre: ubicacion.nombre }}
                />
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Funcionarios</p>
                  {ubicacion.funcionarios.length === 0 ? (
                    <p>—</p>
                  ) : (
                    <ul>
                      {ubicacion.funcionarios.map((f) => (
                        <li key={f.id}>
                          <Link
                            href={`/funcionarios/${f.id}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {f.nombre}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Equipos compartidos</p>
                  {ubicacion.equiposCompartidos.length === 0 ? (
                    <p>—</p>
                  ) : (
                    <ul>
                      {ubicacion.equiposCompartidos.map((e) => (
                        <li key={e.codigo}>
                          <Link
                            href={`/activos/${e.codigo}`}
                            className="font-mono underline-offset-4 hover:underline"
                          >
                            {e.codigo}
                          </Link>{" "}
                          <span className="text-muted-foreground">
                            {ETIQUETAS_TIPO[e.tipo]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
