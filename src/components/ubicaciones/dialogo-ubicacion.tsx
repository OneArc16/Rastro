"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearUbicacion, actualizarUbicacion } from "@/acciones/ubicaciones";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  /** Si se pasa, el diálogo edita esa ubicación; si no, crea una nueva. */
  ubicacion?: { id: number; nombre: string };
};

export function DialogoUbicacion({ ubicacion }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState(ubicacion?.nombre ?? "");
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciarEnvio] = useTransition();

  function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    iniciarEnvio(async () => {
      const resultado = ubicacion
        ? await actualizarUbicacion(ubicacion.id, { nombre })
        : await crearUbicacion({ nombre });

      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setAbierto(false);
      setError(null);
      if (!ubicacion) setNombre("");
      router.refresh();
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger
        render={
          ubicacion ? (
            <Button variant="outline" size="sm">
              Editar
            </Button>
          ) : (
            <Button>Nueva ubicación</Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {ubicacion ? "Editar ubicación" : "Nueva ubicación"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={alEnviar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre-ubicacion">Nombre</Label>
            <Input
              id="nombre-ubicacion"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="LINEA DE FRENTE 2do PISO"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
