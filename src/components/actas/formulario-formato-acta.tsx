"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { guardarFormatoActaAccion } from "@/acciones/actas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TipoActa } from "@/db/schema";
import { ETIQUETAS_PIE, NOMBRES_ACTA } from "@/lib/actas";
import type { FormatoImpreso } from "@/lib/validacion/actas";

const FIRMANTES = ["elaborado", "revisado", "aprobado"] as const;

export function FormularioFormatoActa({
  tipo,
  formato,
}: {
  tipo: TipoActa;
  formato: FormatoImpreso;
}) {
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciarEnvio] = useTransition();
  const { register, handleSubmit } = useForm<FormatoImpreso>({ defaultValues: formato });
  const id = (campo: string) => `${tipo}-${campo}`;

  const alEnviar = handleSubmit((valores) => {
    iniciarEnvio(async () => {
      const resultado = await guardarFormatoActaAccion({ tipo, formato: valores });
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setError(null);
      toast.success("Formato guardado", { description: NOMBRES_ACTA[tipo] });
    });
  });

  return (
    <form onSubmit={alEnviar} className="space-y-4 rounded-xl border p-4">
      <h3 className="font-semibold">{NOMBRES_ACTA[tipo]}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={id("codigo")}>Código</Label>
          <Input id={id("codigo")} {...register("codigo")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("version")}>Versión</Label>
          <Input id={id("version")} {...register("version")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("fecha")}>Fecha de emisión</Label>
          <Input id={id("fecha")} type="date" {...register("fechaEmision")} />
        </div>
      </div>
      {FIRMANTES.map((firmante, i) => (
        <div key={firmante} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={id(`${firmante}-nombre`)}>{ETIQUETAS_PIE[tipo][i]}: nombre</Label>
            <Input id={id(`${firmante}-nombre`)} {...register(`${firmante}.nombre`)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={id(`${firmante}-cargo`)}>{ETIQUETAS_PIE[tipo][i]}: cargo</Label>
            <Input id={id(`${firmante}-cargo`)} {...register(`${firmante}.cargo`)} />
          </div>
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={enviando}>
        {enviando ? "Guardando..." : "Guardar formato"}
      </Button>
    </form>
  );
}
