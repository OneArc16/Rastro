"use client";

import { motion } from "motion/react";
import { CountingNumber } from "@animate-ui/react/primitives/texts/counting-number";
import { CalendarClock, CheckCircle2, MonitorSmartphone, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONOS = {
  activos: MonitorSmartphone,
  disponibles: CheckCircle2,
  vencidos: Wrench,
  garantias: CalendarClock,
} as const;

/** Colores del chip del ícono; "alerta" solo se usa cuando el valor es mayor que cero. */
const TONOS = {
  marca: "bg-primary/10 text-primary",
  exito: "bg-success/12 text-success",
  alerta: "bg-destructive/10 text-destructive",
  aviso: "bg-warning/15 text-warning-foreground dark:text-warning",
  neutro: "bg-muted text-muted-foreground",
} as const;

type Props = {
  titulo: string;
  valor: number;
  icono: keyof typeof ICONOS;
  tono: keyof typeof TONOS;
  /** Posición en la fila, para que las tarjetas entren escalonadas. */
  orden: number;
};

export function Indicador({ titulo, valor, icono, tono, orden }: Props) {
  const Icono = ICONOS[icono];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: orden * 0.07, duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="rounded-2xl bg-card p-5 shadow-sm shadow-foreground/[0.04] ring-1 ring-border transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
        <span className={cn("flex size-10 items-center justify-center rounded-xl", TONOS[tono])}>
          <Icono className="size-5" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums" aria-label={String(valor)}>
        {/* Resorte firme: el valor real se alcanza en ~1 s (el predeterminado tarda ~6 s) */}
        <CountingNumber number={valor} transition={{ stiffness: 160, damping: 32 }} />
      </p>
    </motion.div>
  );
}
