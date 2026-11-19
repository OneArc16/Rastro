import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  datosNuevaBaja,
  datosNuevaEntrega,
  datosNuevaInduccion,
  datosNuevoEgreso,
  listarEquiposParaEgreso,
} from "@/db/consultas-actas";
import { listarFuncionarios, listarUbicacionesSimple } from "@/db/consultas";
import { BotonEnlace } from "@/components/boton-enlace";
import { FormularioActa } from "@/components/actas/formulario/formulario-acta";
import {
  precargarBaja,
  precargarEgreso,
  precargarEntrega,
  precargarInduccion,
} from "@/dominio/precarga-actas";
import { NOMBRES_ACTA } from "@/lib/actas";
import { hoyIso } from "@/lib/fechas";

export const metadata: Metadata = { title: "Nueva acta" };
export const dynamic = "force-dynamic";

function ids(valor: string | string[] | undefined): number[] {
  const texto = Array.isArray(valor) ? valor.join(",") : (valor ?? "");
  return texto
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
}

function Encabezado({ titulo, volver }: { titulo: string; volver: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
      <BotonEnlace variant="outline" href={volver}>
        Cancelar
      </BotonEnlace>
    </div>
  );
}

export default async function PaginaNuevaActa({ searchParams }: PageProps<"/actas/nueva">) {
  const parametros = await searchParams;
  const hoy = hoyIso();

  switch (parametros.tipo) {
    case "entrega": {
      const [funcionarioId] = ids(parametros.funcionario);
      const datos = funcionarioId ? datosNuevaEntrega(funcionarioId) : null;
      if (!datos) notFound();
      const { activoIds, datos: contenido } = precargarEntrega({ ...datos, hoy });
      return (
        <div className="space-y-6">
          <Encabezado
            titulo={`${NOMBRES_ACTA.entrega} — ${datos.funcionario.nombre}`}
            volver={`/funcionarios/${funcionarioId}`}
          />
          <FormularioActa
            modo="crear"
            tipo="entrega"
            inicial={{ funcionarioId, activoIds, datos: contenido }}
            equipos={datos.equipos}
          />
        </div>
      );
    }

    case "baja": {
      const [activoId] = ids(parametros.activo);
      const datos = activoId ? datosNuevaBaja(activoId) : null;
      if (!datos) notFound();
      const contenido = precargarBaja({ ...datos, hoy });
      return (
        <div className="space-y-6">
          <Encabezado
            titulo={`${NOMBRES_ACTA.baja} — ${datos.equipo.codigo}`}
            volver={`/activos/${encodeURIComponent(datos.equipo.codigo)}`}
          />
          {datos.equipo.estado === "dado_de_baja" && (
            <p className="text-sm text-muted-foreground">
              Este equipo ya está dado de baja: solo se guardará el acta.
            </p>
          )}
          <FormularioActa
            modo="crear"
            tipo="baja"
            inicial={{
              funcionarioId: datos.responsable?.id,
              activoIds: [datos.equipo.id],
              datos: contenido,
            }}
            equipos={[datos.equipo]}
          />
        </div>
      );
    }

    case "egreso": {
      const { equipos, formato } = datosNuevoEgreso([
        ...ids(parametros.activos),
        ...ids(parametros.activo),
      ]);
      const { activoIds, datos: contenido } = precargarEgreso({ formato, equipos, hoy });
      return (
        <div className="space-y-6">
          <Encabezado titulo={NOMBRES_ACTA.egreso} volver="/actas" />
          <FormularioActa
            modo="crear"
            tipo="egreso"
            inicial={{ activoIds, datos: contenido }}
            equipos={listarEquiposParaEgreso()}
            ubicaciones={listarUbicacionesSimple()}
          />
        </div>
      );
    }

    case "induccion": {
      const contenido = precargarInduccion({ ...datosNuevaInduccion(), hoy });
      return (
        <div className="space-y-6">
          <Encabezado titulo={NOMBRES_ACTA.induccion} volver="/actas" />
          <FormularioActa
            modo="crear"
            tipo="induccion"
            inicial={{ activoIds: [], datos: contenido }}
            equipos={[]}
            funcionarios={listarFuncionarios()}
          />
        </div>
      );
    }

    default:
      notFound();
  }
}
