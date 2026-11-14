import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listarUbicacionesSimple, obtenerFuncionarioPorId } from "@/db/consultas";
import { FormularioFuncionario } from "@/components/funcionarios/formulario-funcionario";

export const metadata: Metadata = { title: "Editar funcionario" };
export const dynamic = "force-dynamic";

export default async function PaginaEditarFuncionario({
  params,
}: PageProps<"/funcionarios/[id]/editar">) {
  const { id } = await params;
  const idNumerico = Number.parseInt(id, 10);
  const funcionario = Number.isNaN(idNumerico)
    ? null
    : obtenerFuncionarioPorId(idNumerico);

  if (!funcionario) notFound();

  const ubicaciones = listarUbicacionesSimple();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Editar funcionario
      </h1>
      <FormularioFuncionario ubicaciones={ubicaciones} funcionario={funcionario} />
    </div>
  );
}
