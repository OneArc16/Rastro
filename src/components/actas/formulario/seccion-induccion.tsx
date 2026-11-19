"use client";

import { useState } from "react";
import { useFieldArray, type Control, type FieldValues } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { SelectorBuscable } from "@/components/selector-buscable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampoArea, CampoTexto, Rejilla, Seccion, type Registro } from "./campos";

export type FuncionarioAsistente = { id: number; nombre: string; cargo: string | null };

/** Formulario del acta de inducción (acta de reunión F-SGI-001). */
export function SeccionesInduccion({
  register,
  control,
  funcionarios,
}: {
  register: Registro;
  control: Control<FieldValues>;
  funcionarios: FuncionarioAsistente[];
}) {
  const asistentes = useFieldArray({ control, name: "datos.asistentes" });
  // Se vuelve a montar el buscador tras cada elección para dejarlo vacío
  const [buscador, setBuscador] = useState(0);

  function agregarFuncionario(id: string) {
    const funcionario = funcionarios.find((f) => String(f.id) === id);
    if (!funcionario) return;
    asistentes.append({ nombre: funcionario.nombre, cargo: funcionario.cargo ?? "" });
    setBuscador((n) => n + 1);
  }

  return (
    <>
      <Seccion titulo="Datos de la reunión">
        <Rejilla>
          <CampoTexto ruta="datos.fecha" etiqueta="Fecha" tipo="date" register={register} />
          <CampoTexto ruta="datos.hora" etiqueta="Hora" tipo="time" register={register} />
          <CampoTexto ruta="datos.lugar" etiqueta="Lugar" register={register} />
          <CampoTexto ruta="datos.proceso" etiqueta="Proceso responsable" register={register} />
          <CampoTexto
            ruta="datos.responsables"
            etiqueta="Responsables de la reunión"
            register={register}
          />
        </Rejilla>
        <CampoArea ruta="datos.objetivo" etiqueta="Objetivo de la reunión" filas={2} register={register} />
      </Seccion>

      <Seccion titulo="Asistentes">
        {asistentes.fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay asistentes.</p>
        ) : (
          <ul className="space-y-2">
            {asistentes.fields.map((campo, i) => (
              <li key={campo.id} className="grid grid-cols-[1fr_auto] items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-1.5">
                  <Label htmlFor={`asistente-${i}-nombre`} className={i > 0 ? "sm:sr-only" : undefined}>
                    Nombres y apellidos
                  </Label>
                  <Input id={`asistente-${i}-nombre`} {...register(`datos.asistentes.${i}.nombre`)} />
                </div>
                <div className="col-start-1 space-y-1.5 sm:col-start-auto">
                  <Label htmlFor={`asistente-${i}-cargo`} className={i > 0 ? "sm:sr-only" : undefined}>
                    Cargo
                  </Label>
                  <Input id={`asistente-${i}-cargo`} {...register(`datos.asistentes.${i}.cargo`)} />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="row-span-2 self-end sm:row-span-1"
                  aria-label={`Quitar asistente ${i + 1}`}
                  onClick={() => asistentes.remove(i)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="agregar-asistente">Agregar funcionario</Label>
            <SelectorBuscable
              key={buscador}
              id="agregar-asistente"
              opciones={funcionarios.map((f) => ({
                valor: String(f.id),
                etiqueta: f.cargo ? `${f.nombre} · ${f.cargo}` : f.nombre,
              }))}
              valor=""
              alCambiar={agregarFuncionario}
              placeholder="Escriba el nombre..."
            />
          </div>
          <Button type="button" variant="outline" onClick={() => asistentes.append({ nombre: "", cargo: "" })}>
            <Plus /> Agregar a mano
          </Button>
        </div>
      </Seccion>

      <Seccion titulo="Puntos a tratar">
        <CampoArea
          ruta="datos.puntos"
          etiqueta="Puntos"
          filas={4}
          ayuda="Escriba un punto por línea; en el acta salen numerados."
          register={register}
        />
      </Seccion>

      <Seccion titulo="Desarrollo de la reunión">
        <CampoArea ruta="datos.desarrollo" etiqueta="Desarrollo" filas={5} register={register} />
      </Seccion>
    </>
  );
}
