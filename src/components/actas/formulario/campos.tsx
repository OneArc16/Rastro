"use client";

import type { ReactNode } from "react";
import type { FieldValues, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Campos del formulario de actas. El contenido de cada acta es un objeto
 * anidado (datos.responsable.nombre…): los campos reciben la ruta como texto
 * y la validación completa la hace el esquema Zod al guardar.
 */
export type Registro = UseFormRegister<FieldValues>;

const idDe = (ruta: string) => `campo-${ruta.replaceAll(".", "-")}`;

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export function Rejilla({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function CampoTexto({
  ruta,
  etiqueta,
  register,
  tipo = "text",
}: {
  ruta: string;
  etiqueta: string;
  register: Registro;
  tipo?: "text" | "date" | "email";
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={idDe(ruta)}>{etiqueta}</Label>
      <Input id={idDe(ruta)} type={tipo} {...register(ruta)} />
    </div>
  );
}

export function CampoArea({
  ruta,
  etiqueta,
  register,
}: {
  ruta: string;
  etiqueta: string;
  register: Registro;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={idDe(ruta)}>{etiqueta}</Label>
      <Textarea id={idDe(ruta)} rows={3} {...register(ruta)} />
    </div>
  );
}

/** Responsable del equipo (entrega y baja usan los mismos seis datos). */
export function CamposResponsable({ register }: { register: Registro }) {
  return (
    <Rejilla>
      <CampoTexto ruta="datos.responsable.nombre" etiqueta="Nombre completo" register={register} />
      <CampoTexto ruta="datos.responsable.cargo" etiqueta="Cargo" register={register} />
      <CampoTexto ruta="datos.responsable.celular" etiqueta="N° celular" register={register} />
      <CampoTexto
        ruta="datos.responsable.correo"
        etiqueta="Correo electrónico"
        register={register}
      />
      <CampoTexto ruta="datos.responsable.area" etiqueta="Área" register={register} />
      <CampoTexto ruta="datos.responsable.municipio" etiqueta="Municipio" register={register} />
    </Rejilla>
  );
}

/** Nombre y cargo de una persona que firma. */
export function CamposPersona({
  ruta,
  titulo,
  register,
}: {
  ruta: string;
  titulo: string;
  register: Registro;
}) {
  return (
    <>
      <CampoTexto ruta={`${ruta}.nombre`} etiqueta={`${titulo}: nombre`} register={register} />
      <CampoTexto ruta={`${ruta}.cargo`} etiqueta={`${titulo}: cargo`} register={register} />
    </>
  );
}
