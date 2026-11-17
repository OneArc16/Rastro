import type { Metadata } from "next";
import { listarFuncionarios } from "@/db/consultas";
import { BotonEnlace } from "@/components/boton-enlace";
import { ListaFuncionarios } from "@/components/funcionarios/lista-funcionarios";

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

      <ListaFuncionarios filas={filas} />
    </div>
  );
}
