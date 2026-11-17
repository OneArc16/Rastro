"use client";

/* eslint-disable @next/next/no-img-element -- vistas previas locales y fotos guardadas en la base */
import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "cn";

/** Foto en el formulario: ya guardada (guardadaId) o recién elegida (blob). */
export type FotoAdjunta = {
  clave: string;
  url: string;
  guardadaId?: number;
  blob?: Blob;
};

type Props = {
  fotos: FotoAdjunta[];
  maximo: number;
  procesando: boolean;
  alElegir: (archivos: File[]) => void;
  alQuitar: (clave: string) => void;
};

function tamano(blob: Blob) {
  return `${Math.max(1, Math.round(blob.size / 1024))} KB`;
}

/** Fotos del equipo: miniaturas con su botón para quitar y una zona para agregar más. */
export function AdjuntoFotos({ fotos, maximo, procesando, alElegir, alQuitar }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const lleno = fotos.length >= maximo;

  function elegir(lista: FileList | null | undefined) {
    const archivos = Array.from(lista ?? []);
    if (archivos.length > 0) alElegir(archivos);
    // Permite volver a elegir el mismo archivo después de quitarlo
    if (entrada.current) entrada.current.value = "";
  }

  function alSoltar(e: DragEvent) {
    e.preventDefault();
    setArrastrando(false);
    if (!procesando && !lleno) elegir(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {fotos.length} de {maximo} fotos
      </p>

      {fotos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {fotos.map((foto, i) => (
            <li key={foto.clave} className="group relative overflow-hidden rounded-lg border bg-muted/40">
              <img
                src={foto.url}
                alt={`Foto ${i + 1} del equipo`}
                className="aspect-square w-full object-cover"
              />
              <span className="absolute bottom-1 left-1 rounded bg-background/85 px-1.5 py-0.5 text-[11px] font-medium">
                {foto.blob ? `Nueva · ${tamano(foto.blob)}` : "Guardada"}
              </span>
              <button
                type="button"
                onClick={() => alQuitar(foto.clave)}
                aria-label={`Quitar la foto ${i + 1}`}
                className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-white focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!lleno && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={alSoltar}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-6 text-center transition-colors",
            "hover:border-primary/60 hover:bg-muted/40 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
            arrastrando && "border-primary bg-primary/5",
            procesando && "pointer-events-none opacity-70",
          )}
        >
          <input
            ref={entrada}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={procesando}
            onChange={(e) => elegir(e.target.files)}
          />
          {procesando ? (
            <>
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <span className="text-sm font-medium">Reduciendo fotos…</span>
            </>
          ) : (
            <>
              <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <ImagePlus className="size-6 text-muted-foreground" />
              </span>
              <span className="text-sm font-medium">
                {fotos.length === 0 ? "Agregar fotos del equipo" : "Agregar otra foto"}
              </span>
              <span className="text-xs text-muted-foreground">
                Haga clic para elegir o tomar fotos, o arrastre las imágenes aquí.
                <br />
                Hasta {maximo} fotos; se reducen automáticamente antes de guardarlas.
              </span>
            </>
          )}
        </label>
      )}
    </div>
  );
}
