import type { Metadata } from "next";
import Link from "next/link";
import { listarFuncionarios } from "@/db/consultas";
import { BotonEnlace } from "@/components/boton-enlace";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Funcionarios" };
export const dynamic = "force-dynamic";

export default function PaginaFuncionarios() {
  const filas = listarFuncionarios();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Funcionarios</h1>
        <BotonEnlace href="/funcionarios/nuevo">Nuevo funcionario</BotonEnlace>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filas.map((funcionario) => (
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
    </div>
  );
}
