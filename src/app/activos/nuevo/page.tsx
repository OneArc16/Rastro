import type { Metadata } from "next";
import { propuestasDeCodigo } from "@/db/consultas";
import { FormularioActivo } from "@/components/activos/formulario-activo";

export const metadata: Metadata = { title: "Nuevo activo" };
export const dynamic = "force-dynamic";

export default function PaginaNuevoActivo() {
  const propuestas = propuestasDeCodigo();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Nuevo activo</h1>
      <FormularioActivo propuestas={propuestas} />
    </div>
  );
}
