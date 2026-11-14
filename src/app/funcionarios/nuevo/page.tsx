import type { Metadata } from "next";
import { listarUbicacionesSimple } from "@/db/consultas";
import { FormularioFuncionario } from "@/components/funcionarios/formulario-funcionario";

export const metadata: Metadata = { title: "Nuevo funcionario" };
export const dynamic = "force-dynamic";

export default function PaginaNuevoFuncionario() {
  const ubicaciones = listarUbicacionesSimple();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Nuevo funcionario</h1>
      <FormularioFuncionario ubicaciones={ubicaciones} />
    </div>
  );
}
