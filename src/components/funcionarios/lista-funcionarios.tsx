"use client";

import Link from "next/link";
import { useState } from "react";
import { BotonEnlace } from "@/components/boton-enlace";
import { CampoBusqueda } from "@/components/campo-busqueda";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { filtrarFuncionarios } from "./filtrar-funcionarios";

type FilaFuncionario = {
  id: number;
  nombre: string;
  cargo: string | null;
  ubicacion: string | null;
  telefono: string | null;
  equiposVigentes: number;
};

export function ListaFuncionarios({ filas }: { filas: FilaFuncionario[] }) {
  const [busqueda, setBusqueda] = useState("");
  const visibles = filtrarFuncionarios(filas, busqueda);

  return (
    <div className="space-y-4">
      <CampoBusqueda
        id="busqueda-funcionarios"
        valor={busqueda}
        alCambiar={setBusqueda}
        placeholder="Nombre, cargo, ubicación, teléfono..."
      />

      {visibles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ningún funcionario coincide con «{busqueda.trim()}».
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((funcionario) => (
            <Card key={funcionario.id}>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-base">
                  <Link
                    href={`/funcionarios/${funcionario.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {funcionario.nombre}
                  </Link>
                </CardTitle>
                <BotonEnlace
                  variant="outline"
                  size="sm"
                  href={`/funcionarios/${funcionario.id}/editar`}
                >
                  Editar
                </BotonEnlace>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{funcionario.cargo ?? "Sin cargo registrado"}</p>
                <p>{funcionario.ubicacion ?? "Sin ubicación"}</p>
                <p>{funcionario.telefono ?? "Sin teléfono"}</p>
                <p className="pt-1 font-medium text-foreground">
                  {funcionario.equiposVigentes}{" "}
                  {funcionario.equiposVigentes === 1
                    ? "equipo asignado"
                    : "equipos asignados"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
