"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ResultadoAccion } from "@/acciones/resultado";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type VarianteBoton = "default" | "outline" | "destructive" | "secondary";

type Props = {
  textoDisparador: string;
  varianteDisparador?: VarianteBoton;
  titulo: string;
  descripcion?: string;
  textoConfirmar: string;
  /** Aviso que se muestra cuando la acción se guarda. */
  mensajeExito: string;
  varianteConfirmar?: VarianteBoton;
  /** Ejecuta la server action; si devuelve ok, el diálogo se cierra y la página se refresca. */
  alConfirmar: () => Promise<ResultadoAccion>;
  /** Se llama al abrir, para reiniciar los campos del formulario. */
  alAbrir?: () => void;
  children: ReactNode;
};

/** Diálogo de confirmación para las acciones sobre activos y funcionarios. */
export function DialogoAccion({
  textoDisparador,
  varianteDisparador = "outline",
  titulo,
  descripcion,
  textoConfirmar,
  mensajeExito,
  varianteConfirmar = "default",
  alConfirmar,
  alAbrir,
  children,
}: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  function alCambiarApertura(nuevo: boolean) {
    if (nuevo) {
      setError(null);
      alAbrir?.();
    }
    setAbierto(nuevo);
  }

  function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    iniciarEnvio(async () => {
      const resultado = await alConfirmar();
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setAbierto(false);
      toast.success(mensajeExito);
      router.refresh();
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiarApertura}>
      <DialogTrigger
        render={<Button variant={varianteDisparador}>{textoDisparador}</Button>}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          {descripcion && <DialogDescription>{descripcion}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={alEnviar} className="space-y-4">
          {children}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" variant={varianteConfirmar} disabled={enviando}>
              {enviando ? "Guardando..." : textoConfirmar}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
