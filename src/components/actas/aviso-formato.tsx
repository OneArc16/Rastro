"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { aplicarFormatoVigenteAccion } from "@/acciones/actas";
import { Button } from "@/components/ui/button";

/**
 * Aviso cuando el encabezado y pie guardados en el acta no coinciden con la
 * configuración actual, con el botón para aplicarla.
 */
export function AvisoFormato({ actaId }: { actaId: number }) {
  const router = useRouter();
  const [aplicando, iniciar] = useTransition();

  function aplicar() {
    iniciar(async () => {
      const resultado = await aplicarFormatoVigenteAccion(actaId);
      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }
      toast.success("Se aplicó la configuración actual al acta");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
      <p>
        El encabezado y pie de esta acta (código, versión, elaborado, revisado, aprobado) no
        coinciden con la{" "}
        <Link href="/configuracion" className="underline underline-offset-4">
          configuración actual
        </Link>
        . La versión actual quedará en el historial.
      </p>
      <Button type="button" size="sm" onClick={aplicar} disabled={aplicando}>
        <RefreshCw className={aplicando ? "animate-spin" : undefined} />
        Aplicar la configuración actual
      </Button>
    </div>
  );
}
