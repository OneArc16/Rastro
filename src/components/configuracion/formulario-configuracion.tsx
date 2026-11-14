"use client";

import { useState, useTransition } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { guardarConfiguracion } from "@/acciones/configuracion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Valores = {
  codigoFormato: string;
  versionFormato: string;
  fechaEmision: string;
  elaboradoNombre: string;
  elaboradoCargo: string;
  revisadoNombre: string;
  revisadoCargo: string;
  aprobadoNombre: string;
  aprobadoCargo: string;
};

type Props = { configuracion: Partial<Record<keyof Valores, string | null>> | null };

function Campo({
  nombre,
  etiqueta,
  register,
  tipo = "text",
}: {
  nombre: keyof Valores;
  etiqueta: string;
  register: UseFormRegister<Valores>;
  tipo?: "text" | "date";
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={nombre}>{etiqueta}</Label>
      <Input id={nombre} type={tipo} {...register(nombre)} />
    </div>
  );
}

const FIRMAS = [
  { prefijo: "elaborado", titulo: "Elaborado por" },
  { prefijo: "revisado", titulo: "Revisado por" },
  { prefijo: "aprobado", titulo: "Aprobado por" },
] as const;

export function FormularioConfiguracion({ configuracion }: Props) {
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const valorInicial = (clave: keyof Valores) => configuracion?.[clave] ?? "";
  const { register, handleSubmit } = useForm<Valores>({
    defaultValues: {
      codigoFormato: valorInicial("codigoFormato"),
      versionFormato: valorInicial("versionFormato"),
      fechaEmision: valorInicial("fechaEmision"),
      elaboradoNombre: valorInicial("elaboradoNombre"),
      elaboradoCargo: valorInicial("elaboradoCargo"),
      revisadoNombre: valorInicial("revisadoNombre"),
      revisadoCargo: valorInicial("revisadoCargo"),
      aprobadoNombre: valorInicial("aprobadoNombre"),
      aprobadoCargo: valorInicial("aprobadoCargo"),
    },
  });

  const alEnviar = handleSubmit((valores) => {
    iniciarEnvio(async () => {
      const resultado = await guardarConfiguracion(valores);
      setMensaje(
        resultado.ok
          ? { ok: true, texto: "Configuración guardada." }
          : { ok: false, texto: resultado.error },
      );
    });
  });

  return (
    <form onSubmit={alEnviar} className="max-w-3xl space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Encabezado del formato</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Campo nombre="codigoFormato" etiqueta="Código" register={register} />
          <Campo nombre="versionFormato" etiqueta="Versión" register={register} />
          <Campo nombre="fechaEmision" etiqueta="Fecha de emisión" register={register} tipo="date" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Firmas</h2>
        {FIRMAS.map(({ prefijo, titulo }) => (
          <div key={prefijo} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo nombre={`${prefijo}Nombre`} etiqueta={`${titulo}: nombre`} register={register} />
            <Campo nombre={`${prefijo}Cargo`} etiqueta={`${titulo}: cargo`} register={register} />
          </div>
        ))}
      </section>

      {mensaje && (
        <p className={mensaje.ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>
          {mensaje.texto}
        </p>
      )}

      <Button type="submit" disabled={enviando}>
        {enviando ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
