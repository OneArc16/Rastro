"use client";

/* eslint-disable @next/next/no-img-element -- vista previa local de la foto elegida */
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { X } from "lucide-react";
import { crearActaAccion, editarActaAccion } from "@/acciones/actas";
import { Selector } from "@/components/selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { TipoActa, TIPOS_ACTIVO } from "@/db/schema";
import { precargarEgreso } from "@/dominio/precarga-actas";
import { NOMBRES_ACTA } from "@/lib/actas";
import { reducirFoto } from "@/lib/foto";
import { primerErrorZod } from "@/lib/validacion/comunes";
import {
  esquemaEnvioActa,
  type DatosBaja,
  type DatosEgreso,
  type DatosEntrega,
  type FormatoImpreso,
} from "@/lib/validacion/actas";
import { Seccion } from "./campos";
import { SeccionesBaja, SeccionesEgreso, SeccionesEntrega } from "./secciones";

export type EquipoElegible = {
  id: number;
  codigo: string;
  tipo: (typeof TIPOS_ACTIVO)[number];
  marca: string | null;
  modelo?: string | null;
};

type Props = {
  modo: "crear" | "editar";
  actaId?: number;
  tipo: TipoActa;
  inicial: {
    funcionarioId?: number;
    ubicacionId?: number;
    activoIds: number[];
    datos: Record<string, unknown>;
  };
  /** Equipos que se pueden mostrar o elegir (en egreso se pueden agregar y quitar). */
  equipos: EquipoElegible[];
  ubicaciones?: { id: number; nombre: string }[];
  fotoActualUrl?: string;
};

/** Fecha principal del acta: la que trae su formato. */
function fechaDelActa(tipo: TipoActa, datos: Record<string, unknown>): string {
  switch (tipo) {
    case "entrega":
      return (datos as DatosEntrega).fechaEntrega;
    case "egreso":
      return (datos as DatosEgreso).fechaSalida;
    case "baja":
      return (datos as DatosBaja).equipo.fechaBaja;
  }
}

const NOMBRE_FECHA: Record<TipoActa, string> = {
  entrega: "La fecha de entrega",
  egreso: "La fecha de salida",
  baja: "La fecha de baja del equipo",
};

export function FormularioActa({
  modo,
  actaId,
  tipo,
  inicial,
  equipos,
  ubicaciones = [],
  fotoActualUrl,
}: Props) {
  const router = useRouter();
  const [enviando, iniciarEnvio] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, getValues } = useForm<FieldValues>({
    defaultValues: { datos: inicial.datos },
  });

  const [activoIds, setActivoIds] = useState(inicial.activoIds);
  const [ubicacionId, setUbicacionId] = useState(
    inicial.ubicacionId ? String(inicial.ubicacionId) : "",
  );
  const [trasladar, setTrasladar] = useState(false);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [quitarFoto, setQuitarFoto] = useState(false);
  const [procesandoFoto, setProcesandoFoto] = useState(false);

  const vistaPrevia = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto]);
  useEffect(() => {
    return () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    };
  }, [vistaPrevia]);

  const elegidos = equipos.filter((e) => activoIds.includes(e.id));
  const disponibles = equipos.filter((e) => !activoIds.includes(e.id));
  const datos = watch("datos");

  async function alElegirFoto(archivo: File | undefined) {
    if (!archivo) return;
    setProcesandoFoto(true);
    try {
      setFoto(await reducirFoto(archivo));
      setQuitarFoto(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar la foto");
    } finally {
      setProcesandoFoto(false);
    }
  }

  /** Rehace la tabla de dispositivos del egreso con los equipos elegidos. */
  function rellenarDispositivos() {
    const equiposPrecarga = elegidos.map((e) => ({
      ...e,
      modelo: e.modelo ?? null,
      serial: null,
      specs: null,
      fechaCompra: null,
    }));
    const formato = (getValues("datos") as DatosEgreso).formato as FormatoImpreso;
    const { datos: precarga } = precargarEgreso({ formato, equipos: equiposPrecarga, hoy: "" });
    setValue("datos.dispositivos", precarga.dispositivos);
  }

  const alEnviar = handleSubmit((valores) => {
    const contenido = valores.datos as Record<string, unknown>;
    const fecha = fechaDelActa(tipo, contenido);
    if (!fecha) {
      setError(`${NOMBRE_FECHA[tipo]} es obligatoria`);
      return;
    }

    const envio = esquemaEnvioActa.safeParse({
      acta: {
        tipo,
        fecha,
        funcionarioId: inicial.funcionarioId,
        ubicacionId: tipo === "egreso" ? ubicacionId : inicial.ubicacionId,
        activoIds,
        datos: contenido,
      },
      trasladar: modo === "crear" && tipo === "egreso" && trasladar,
      quitarFoto,
    });
    if (!envio.success) {
      setError(primerErrorZod(envio.error));
      return;
    }

    const formulario = new FormData();
    formulario.set("envio", JSON.stringify(envio.data));
    if (foto) formulario.set("foto", foto, "foto.jpg");

    iniciarEnvio(async () => {
      const resultado =
        modo === "crear"
          ? await crearActaAccion(formulario)
          : await editarActaAccion(actaId as number, formulario);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setError(null);
      toast.success(modo === "crear" ? "Acta guardada" : "Acta actualizada", {
        description: resultado.codigo ?? NOMBRES_ACTA[tipo],
      });
      router.push(`/actas/${resultado.id}`);
    });
  });

  return (
    <form onSubmit={alEnviar} className="max-w-4xl space-y-4">
      <Seccion titulo="Equipos del acta">
        {elegidos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin equipos.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {elegidos.map((e) => (
              <li key={e.id}>
                <Badge variant="secondary" className="gap-1">
                  {e.codigo}
                  {e.marca ? ` · ${e.marca}` : ""}
                  {tipo === "egreso" && (
                    <button
                      type="button"
                      aria-label={`Quitar ${e.codigo}`}
                      onClick={() => setActivoIds(activoIds.filter((id) => id !== e.id))}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        {tipo === "egreso" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="agregar-equipo">Agregar equipo</Label>
              <Selector
                id="agregar-equipo"
                opciones={disponibles.map((e) => ({
                  valor: String(e.id),
                  etiqueta: `${e.codigo}${e.marca ? ` · ${e.marca}` : ""}`,
                }))}
                valor=""
                placeholder="Elegir equipo"
                alCambiar={(valor) => valor && setActivoIds([...activoIds, Number(valor)])}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ubicacion-destino">Ubicación de destino</Label>
              <Selector
                id="ubicacion-destino"
                opciones={[
                  { valor: "", etiqueta: "Sin ubicación" },
                  ...ubicaciones.map((u) => ({ valor: String(u.id), etiqueta: u.nombre })),
                ]}
                valor={ubicacionId}
                alCambiar={setUbicacionId}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <Button type="button" variant="outline" size="sm" onClick={rellenarDispositivos}>
                Rellenar dispositivos con estos equipos
              </Button>
              {modo === "crear" && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={trasladar}
                    onChange={(e) => setTrasladar(e.target.checked)}
                  />
                  Trasladar los equipos a la ubicación de destino
                </label>
              )}
            </div>
          </div>
        )}

        {tipo === "baja" && modo === "crear" && (
          <p className="text-sm text-muted-foreground">
            Al guardar, el equipo queda dado de baja y se cierra su asignación.
          </p>
        )}
      </Seccion>

      {tipo === "entrega" && (
        <SeccionesEntrega register={register} datos={datos as DatosEntrega} />
      )}
      {tipo === "egreso" && <SeccionesEgreso register={register} datos={datos as DatosEgreso} />}
      {tipo === "baja" && (
        <>
          <SeccionesBaja register={register} watch={watch} />
          <Seccion titulo="Foto del equipo">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="block text-sm"
              disabled={procesandoFoto}
              onChange={(e) => alElegirFoto(e.target.files?.[0])}
            />
            {procesandoFoto && <p className="text-sm text-muted-foreground">Reduciendo foto…</p>}
            {vistaPrevia ? (
              <img src={vistaPrevia} alt="Foto elegida" className="max-h-56 rounded-lg border" />
            ) : (
              fotoActualUrl &&
              !quitarFoto && (
                <img src={fotoActualUrl} alt="Foto guardada" className="max-h-56 rounded-lg border" />
              )
            )}
            {(foto || (fotoActualUrl && !quitarFoto)) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFoto(null);
                  if (fotoActualUrl) setQuitarFoto(true);
                }}
              >
                Quitar foto
              </Button>
            )}
          </Seccion>
        </>
      )}

      {modo === "editar" && (
        <p className="text-sm text-muted-foreground">
          Al guardar se conserva la versión anterior en el historial del acta.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={enviando || procesandoFoto}>
        {enviando ? "Guardando..." : modo === "crear" ? "Guardar acta" : "Guardar cambios"}
      </Button>
    </form>
  );
}
