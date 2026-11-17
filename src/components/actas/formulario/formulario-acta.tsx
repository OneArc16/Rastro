"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  MAXIMO_FOTOS,
  type DatosBaja,
  type DatosEgreso,
  type DatosEntrega,
  type FormatoImpreso,
} from "@/lib/validacion/actas";
import { AdjuntoFotos, type FotoAdjunta } from "./adjunto-fotos";
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
  /** Fotos ya guardadas del acta (al editar una baja). */
  fotosGuardadas?: { id: number; url: string }[];
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
  fotosGuardadas = [],
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
  const [fotos, setFotos] = useState<FotoAdjunta[]>(() =>
    fotosGuardadas.map((f) => ({ clave: `g${f.id}`, url: f.url, guardadaId: f.id })),
  );
  const [procesandoFoto, setProcesandoFoto] = useState(false);

  // Vistas previas locales creadas con createObjectURL: se liberan al salir
  const urlsLocales = useRef(new Set<string>());
  useEffect(() => {
    const urls = urlsLocales.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const elegidos = equipos.filter((e) => activoIds.includes(e.id));
  const disponibles = equipos.filter((e) => !activoIds.includes(e.id));
  const datos = watch("datos");

  async function alElegirFotos(archivos: File[]) {
    const lugares = MAXIMO_FOTOS - fotos.length;
    const elegidas = archivos.slice(0, Math.max(0, lugares));
    if (elegidas.length === 0) return;
    setProcesandoFoto(true);
    setError(null);
    try {
      const nuevas: FotoAdjunta[] = [];
      for (const archivo of elegidas) {
        const blob = await reducirFoto(archivo);
        const url = URL.createObjectURL(blob);
        urlsLocales.current.add(url);
        nuevas.push({ clave: url, url, blob });
      }
      setFotos((actuales) => [...actuales, ...nuevas]);
      if (archivos.length > elegidas.length) {
        setError(`Se agregaron ${elegidas.length}: el acta admite como máximo ${MAXIMO_FOTOS} fotos.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar la foto");
    } finally {
      setProcesandoFoto(false);
    }
  }

  function quitarFoto(clave: string) {
    setFotos((actuales) => actuales.filter((f) => f.clave !== clave));
    if (urlsLocales.current.delete(clave)) URL.revokeObjectURL(clave);
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
      fotosConservadas:
        modo === "editar" && tipo === "baja"
          ? fotos.flatMap((f) => (f.guardadaId ? [f.guardadaId] : []))
          : undefined,
    });
    if (!envio.success) {
      setError(primerErrorZod(envio.error));
      return;
    }

    const formulario = new FormData();
    formulario.set("envio", JSON.stringify(envio.data));
    fotos.forEach((f, i) => {
      if (f.blob) formulario.append("fotos", f.blob, `foto-${i + 1}.jpg`);
    });

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
          <Seccion titulo="Fotos del equipo">
            <AdjuntoFotos
              fotos={fotos}
              maximo={MAXIMO_FOTOS}
              procesando={procesandoFoto}
              alElegir={alElegirFotos}
              alQuitar={quitarFoto}
            />
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
