"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { crearFuncionario, actualizarFuncionario } from "@/acciones/funcionarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Ubicacion = { id: number; nombre: string };

type Valores = {
  nombre: string;
  cargo: string;
  telefono: string;
  ubicacionId: string; // "" = sin ubicación; el esquema Zod lo convierte a null
};

type Props = {
  ubicaciones: Ubicacion[];
  funcionario?: {
    id: number;
    nombre: string;
    cargo: string | null;
    telefono: string | null;
    ubicacionId: number | null;
  };
};

export function FormularioFuncionario({ ubicaciones, funcionario }: Props) {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Valores>({
    defaultValues: {
      nombre: funcionario?.nombre ?? "",
      cargo: funcionario?.cargo ?? "",
      telefono: funcionario?.telefono ?? "",
      ubicacionId: funcionario?.ubicacionId ? String(funcionario.ubicacionId) : "",
    },
  });

  const ubicacionSeleccionada = watch("ubicacionId");

  const alEnviar = handleSubmit((valores) => {
    iniciarEnvio(async () => {
      const resultado = funcionario
        ? await actualizarFuncionario(funcionario.id, valores)
        : await crearFuncionario(valores);

      if (!resultado.ok) {
        setErrorGeneral(resultado.error);
        return;
      }
      router.push("/funcionarios");
      router.refresh();
    });
  });

  return (
    <form onSubmit={alEnviar} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input
          id="nombre"
          {...register("nombre", { required: "El nombre es obligatorio" })}
          placeholder="MARIA FERNANDA LOPEZ"
        />
        {errors.nombre && (
          <p className="text-sm text-destructive">{errors.nombre.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cargo">Cargo</Label>
        <Input id="cargo" {...register("cargo")} placeholder="AUXILIAR CONTABLE" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" {...register("telefono")} placeholder="3104567890" />
      </div>

      <div className="space-y-2">
        <Label>Ubicación</Label>
        <Select
          value={ubicacionSeleccionada}
          onValueChange={(valor) => setValue("ubicacionId", (valor as string) ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sin ubicación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sin ubicación</SelectItem>
            {ubicaciones.map((ubicacion) => (
              <SelectItem key={ubicacion.id} value={String(ubicacion.id)}>
                {ubicacion.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {errorGeneral && <p className="text-sm text-destructive">{errorGeneral}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/funcionarios")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
