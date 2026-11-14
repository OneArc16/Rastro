"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegister } from "react-hook-form";
import { crearActivo, actualizarActivo } from "@/acciones/activos";
import type { Activo, TIPOS_ACTIVO } from "@/db/schema";
import { ETIQUETAS_TIPO } from "@/lib/etiquetas";
import { esTipoPc, specsAFormulario } from "@/lib/validacion/activos";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { opcionesDesde, Selector } from "@/components/selector";

const OPCIONES_TIPO = opcionesDesde(ETIQUETAS_TIPO);
const OPCIONES_ESTADO_EDITABLE = [
  { valor: "operativo", etiqueta: "Operativo" },
  { valor: "en_reparacion", etiqueta: "En reparación" },
];

type TipoActivo = (typeof TIPOS_ACTIVO)[number];

type ValoresSpecs = {
  unidadDisco: string;
  capacidadDisco: string;
  ram: string;
  tipoRam: string;
  procesador: string;
  velocidad: string;
  puertosUsb: string;
  tarjetaGraficaModelo: string;
  tarjetaGraficaCapacidad: string;
  tarjetaWifi: string;
  puertoRed: boolean;
  tarjetaSonido: string;
  board: string;
  sistemaOperativo: string;
  ofimatica: string;
  antivirus: string;
  bateriaSerial: string;
  bateriaEstado: string;
  tamano: string;
  tipo: string;
  cableConexion: boolean;
  cableEnergia: boolean;
};

type Valores = {
  codigo: string;
  tipo: TipoActivo;
  marca: string;
  modelo: string;
  serial: string;
  color: string;
  estado: "operativo" | "en_reparacion";
  valor: string;
  fechaCompra: string;
  garantiaHasta: string;
  observaciones: string;
  specs: ValoresSpecs;
};

const SPECS_VACIOS: ValoresSpecs = {
  unidadDisco: "",
  capacidadDisco: "",
  ram: "",
  tipoRam: "",
  procesador: "",
  velocidad: "",
  puertosUsb: "",
  tarjetaGraficaModelo: "",
  tarjetaGraficaCapacidad: "",
  tarjetaWifi: "",
  puertoRed: false,
  tarjetaSonido: "",
  board: "",
  sistemaOperativo: "",
  ofimatica: "",
  antivirus: "",
  bateriaSerial: "",
  bateriaEstado: "",
  tamano: "",
  tipo: "",
  cableConexion: false,
  cableEnergia: false,
};

function valoresIniciales(
  propuestas: Record<TipoActivo, string>,
  activo?: Activo,
): Valores {
  if (!activo) {
    return {
      codigo: propuestas.pc_mesa,
      tipo: "pc_mesa",
      marca: "",
      modelo: "",
      serial: "",
      color: "",
      estado: "operativo",
      valor: "",
      fechaCompra: "",
      garantiaHasta: "",
      observaciones: "",
      specs: SPECS_VACIOS,
    };
  }

  const specs = specsAFormulario(activo.tipo, activo.specs);
  return {
    codigo: activo.codigo,
    tipo: activo.tipo,
    marca: activo.marca ?? "",
    modelo: activo.modelo ?? "",
    serial: activo.serial ?? "",
    color: activo.color ?? "",
    estado: activo.estado === "en_reparacion" ? "en_reparacion" : "operativo",
    valor: activo.valor != null ? String(activo.valor) : "",
    fechaCompra: activo.fechaCompra ?? "",
    garantiaHasta: activo.garantiaHasta ?? "",
    observaciones: activo.observaciones ?? "",
    specs: {
      ...SPECS_VACIOS,
      ...Object.fromEntries(
        Object.entries(specs).map(([clave, valor]) => [
          clave,
          typeof valor === "number" ? String(valor) : valor,
        ]),
      ),
    },
  };
}

function CampoTexto({
  nombre,
  etiqueta,
  register,
  placeholder,
}: {
  nombre: `specs.${keyof ValoresSpecs & string}` | keyof Valores;
  etiqueta: string;
  register: UseFormRegister<Valores>;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={nombre}>{etiqueta}</Label>
      <Input id={nombre} {...register(nombre as never)} placeholder={placeholder} />
    </div>
  );
}

type Props = {
  propuestas: Record<TipoActivo, string>;
  activo?: Activo;
};

export function FormularioActivo({ propuestas, activo }: Props) {
  const router = useRouter();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<Valores>({ defaultValues: valoresIniciales(propuestas, activo) });

  const tipoSeleccionado = watch("tipo");
  const estadoSeleccionado = watch("estado");
  const specsBool = {
    puertoRed: watch("specs.puertoRed"),
    cableConexion: watch("specs.cableConexion"),
    cableEnergia: watch("specs.cableEnergia"),
  };

  /** Al cambiar el tipo, actualiza el código propuesto si el usuario no lo tocó. */
  function alCambiarTipo(nuevoTipo: TipoActivo) {
    const codigoActual = getValues("codigo");
    const sigueSiendoPropuesta =
      codigoActual === "" || Object.values(propuestas).includes(codigoActual);
    setValue("tipo", nuevoTipo);
    if (!activo && sigueSiendoPropuesta) {
      setValue("codigo", propuestas[nuevoTipo]);
    }
  }

  const alEnviar = handleSubmit((valores) => {
    iniciarEnvio(async () => {
      const resultado = activo
        ? await actualizarActivo(activo.id, valores)
        : await crearActivo(valores);

      if (!resultado.ok) {
        setErrorGeneral(resultado.error);
        return;
      }
      router.push(`/activos/${valores.codigo}`);
      router.refresh();
    });
  });

  return (
    <form onSubmit={alEnviar} className="max-w-3xl space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Datos generales</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Selector
              id="tipo"
              opciones={OPCIONES_TIPO}
              valor={tipoSeleccionado}
              alCambiar={(valor) => alCambiarTipo(valor as TipoActivo)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              {...register("codigo", { required: "El código es obligatorio" })}
            />
            {errors.codigo && (
              <p className="text-sm text-destructive">{errors.codigo.message}</p>
            )}
          </div>

          <CampoTexto nombre="marca" etiqueta="Marca" register={register} placeholder="ASUS" />
          <CampoTexto nombre="modelo" etiqueta="Modelo" register={register} placeholder="EXPERTCENTER D500MD" />
          <CampoTexto nombre="serial" etiqueta="Serial" register={register} />
          <CampoTexto nombre="color" etiqueta="Color" register={register} placeholder="NEGRO" />

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Selector
              id="estado"
              opciones={OPCIONES_ESTADO_EDITABLE}
              valor={estadoSeleccionado}
              alCambiar={(valor) =>
                setValue("estado", valor as "operativo" | "en_reparacion")
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor (pesos)</Label>
            <Input id="valor" type="number" min="0" {...register("valor")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fechaCompra">Fecha de compra</Label>
            <Input id="fechaCompra" type="date" {...register("fechaCompra")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="garantiaHasta">Garantía hasta</Label>
            <Input id="garantiaHasta" type="date" {...register("garantiaHasta")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea id="observaciones" rows={3} {...register("observaciones")} />
        </div>
      </section>

      {esTipoPc(tipoSeleccionado) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Especificaciones del equipo</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CampoTexto nombre="specs.unidadDisco" etiqueta="Unidad de disco" register={register} placeholder="SSD" />
            <CampoTexto nombre="specs.capacidadDisco" etiqueta="Capacidad de disco" register={register} placeholder="512 GB" />
            <CampoTexto nombre="specs.ram" etiqueta="Cantidad de RAM" register={register} placeholder="16 GB" />
            <CampoTexto nombre="specs.tipoRam" etiqueta="Tipo de RAM" register={register} placeholder="DDR4" />
            <CampoTexto nombre="specs.procesador" etiqueta="Procesador" register={register} placeholder="INTEL CORE I5 12400" />
            <CampoTexto nombre="specs.velocidad" etiqueta="Velocidad" register={register} placeholder="2.50 GHz" />
            <div className="space-y-2">
              <Label htmlFor="specs.puertosUsb">Puertos USB</Label>
              <Input id="specs.puertosUsb" type="number" min="0" {...register("specs.puertosUsb")} />
            </div>
            <CampoTexto nombre="specs.tarjetaGraficaModelo" etiqueta="Tarjeta gráfica (modelo)" register={register} />
            <CampoTexto nombre="specs.tarjetaGraficaCapacidad" etiqueta="Tarjeta gráfica (capacidad)" register={register} />
            <CampoTexto nombre="specs.tarjetaWifi" etiqueta="Tarjeta wifi" register={register} />
            <CampoTexto nombre="specs.tarjetaSonido" etiqueta="Tarjeta de sonido" register={register} />
            <CampoTexto nombre="specs.board" etiqueta="Board" register={register} placeholder="ASUS PRIME H610M-K" />
            <CampoTexto nombre="specs.sistemaOperativo" etiqueta="Sistema operativo" register={register} placeholder="WINDOWS 11 PRO" />
            <CampoTexto nombre="specs.ofimatica" etiqueta="Herramientas ofimáticas" register={register} placeholder="OFFICE - ADOBE" />
            <CampoTexto nombre="specs.antivirus" etiqueta="Antivirus" register={register} placeholder="DEFENDER" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="specs.puertoRed"
              checked={specsBool.puertoRed}
              onCheckedChange={(marcado) =>
                setValue("specs.puertoRed", marcado === true)
              }
            />
            <Label htmlFor="specs.puertoRed">Puerto de red</Label>
          </div>

          {tipoSeleccionado === "portatil" && (
            <div className="space-y-4">
              <h3 className="font-medium">Batería</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CampoTexto nombre="specs.bateriaSerial" etiqueta="Serial de la batería" register={register} />
                <CampoTexto nombre="specs.bateriaEstado" etiqueta="Estado de la batería" register={register} placeholder="BUENO" />
              </div>
            </div>
          )}
        </section>
      )}

      {tipoSeleccionado === "monitor" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Especificaciones del monitor</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CampoTexto nombre="specs.tamano" etiqueta="Tamaño" register={register} placeholder='22"' />
            <CampoTexto nombre="specs.tipo" etiqueta="Tipo" register={register} placeholder="LED" />
          </div>
        </section>
      )}

      {tipoSeleccionado === "impresora" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Especificaciones de la impresora</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="specs.cableConexion"
                checked={specsBool.cableConexion}
                onCheckedChange={(marcado) =>
                  setValue("specs.cableConexion", marcado === true)
                }
              />
              <Label htmlFor="specs.cableConexion">Cable de conexión</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="specs.cableEnergia"
                checked={specsBool.cableEnergia}
                onCheckedChange={(marcado) =>
                  setValue("specs.cableEnergia", marcado === true)
                }
              />
              <Label htmlFor="specs.cableEnergia">Cable de energía</Label>
            </div>
          </div>
        </section>
      )}

      {errorGeneral && <p className="text-sm text-destructive">{errorGeneral}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
