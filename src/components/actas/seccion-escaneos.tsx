"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Eye, FileText, FileUp, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "cn";
import { eliminarEscaneoAccion, subirEscaneoAccion } from "@/acciones/escaneos";
import { DialogoAccion } from "@/components/acciones/dialogo-accion";
import { buttonVariants } from "@/components/ui/button";

type Escaneo = { id: number; nombre: string; tipo: string; tamano: number; subidoEn: Date };

const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" });

function tamano(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Acta firmada escaneada: subir (clic o arrastrar), ver, descargar y eliminar. */
export function SeccionEscaneos({ actaId, escaneos }: { actaId: number; escaneos: Escaneo[] }) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, iniciarSubida] = useTransition();
  const [progreso, setProgreso] = useState("");

  function subir(lista: FileList | null | undefined) {
    const archivos = Array.from(lista ?? []);
    if (entrada.current) entrada.current.value = "";
    if (archivos.length === 0) return;

    iniciarSubida(async () => {
      let subidos = 0;
      // Uno por envío: cada archivo puede pesar hasta 10 MB
      for (const [i, archivo] of archivos.entries()) {
        setProgreso(archivos.length > 1 ? `Subiendo ${i + 1} de ${archivos.length}…` : "Subiendo…");
        const formulario = new FormData();
        formulario.set("archivo", archivo);
        const resultado = await subirEscaneoAccion(actaId, formulario);
        if (resultado.ok) subidos++;
        else toast.error(`${archivo.name}: ${resultado.error}`);
      }
      if (subidos > 0) {
        toast.success(subidos === 1 ? "Se adjuntó el acta escaneada" : `Se adjuntaron ${subidos} archivos`);
        router.refresh();
      }
    });
  }

  function alSoltar(e: DragEvent) {
    e.preventDefault();
    setArrastrando(false);
    if (!subiendo) subir(e.dataTransfer.files);
  }

  return (
    <section className="space-y-3 rounded-lg border p-4" aria-labelledby="titulo-escaneos">
      <div>
        <h2 id="titulo-escaneos" className="font-semibold">
          Acta firmada (escaneada)
        </h2>
        <p className="text-sm text-muted-foreground">
          {escaneos.length === 0
            ? "Todavía no se adjuntó la copia firmada de esta acta."
            : "Copia firmada guardada en el sistema; se incluye en los respaldos."}
        </p>
      </div>

      {escaneos.length > 0 && (
        <ul className="divide-y rounded-md border">
          {escaneos.map((e) => {
            const Icono = e.tipo === "application/pdf" ? FileText : ImageIcon;
            const url = `/actas/${actaId}/escaneos/${e.id}`;
            return (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Icono className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {tamano(e.tamano)} · subido el {formatoFecha.format(e.subidoEn)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Enlaces comunes: son archivos, no páginas que Next deba precargar */}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Eye /> Ver
                  </a>
                  <a href={`${url}?descargar=1`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    <Download /> Descargar
                  </a>
                  <DialogoAccion
                    textoDisparador="Eliminar"
                    tamanoDisparador="sm"
                    titulo="Eliminar archivo escaneado"
                    descripcion={e.nombre}
                    textoConfirmar="Eliminar"
                    varianteConfirmar="destructive"
                    mensajeExito="Se eliminó el archivo"
                    alConfirmar={() => eliminarEscaneoAccion(actaId, e.id)}
                  >
                    <p className="text-sm">
                      El archivo se borra del sistema y no se puede recuperar, salvo desde un respaldo.
                    </p>
                  </DialogoAccion>
                </div>
              </li>
            );
          })}
        </ul>
      )}

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
          subiendo && "pointer-events-none opacity-70",
        )}
      >
        <input
          ref={entrada}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          multiple
          className="sr-only"
          disabled={subiendo}
          onChange={(e) => subir(e.target.files)}
        />
        {subiendo ? (
          <>
            <Loader2 className="size-7 animate-spin text-muted-foreground" />
            <span className="text-sm font-medium">{progreso}</span>
          </>
        ) : (
          <>
            <FileUp className="size-7 text-muted-foreground" />
            <span className="text-sm font-medium">
              {escaneos.length === 0 ? "Adjuntar el acta firmada" : "Adjuntar otro archivo"}
            </span>
            <span className="text-xs text-muted-foreground">
              Haga clic para elegir o arrastre aquí el escaneo. PDF, JPG o PNG, hasta 10 MB cada uno.
            </span>
          </>
        )}
      </label>
    </section>
  );
}
