"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type TooltipContentProps,
} from "recharts";
import type { MesResumen } from "@/dominio/estadisticas";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MESES_LARGOS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const SERIES = [
  { clave: "preventivos", nombre: "Preventivos", color: "var(--serie-preventivo)" },
  { clave: "correctivos", nombre: "Correctivos", color: "var(--serie-correctivo)" },
] as const;

type Punto = MesResumen & { etiqueta: string };

function Leyenda() {
  return (
    <ul className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      {SERIES.map((s) => (
        <li key={s.clave} className="flex items-center gap-2">
          <span className="size-3 rounded-sm" style={{ background: s.color }} aria-hidden />
          {s.nombre}
        </li>
      ))}
    </ul>
  );
}

function Detalle({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const punto = payload[0].payload as Punto;
  return (
    <div className="min-w-40 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{MESES_LARGOS[punto.mes - 1]}</p>
      {SERIES.map((s) => (
        <p key={s.clave} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
            {s.nombre}
          </span>
          <span className="tabular-nums">{punto[s.clave]}</span>
        </p>
      ))}
      <p className="mt-1 flex justify-between gap-4 border-t pt-1 font-medium">
        <span>Total</span>
        <span className="tabular-nums">{punto.preventivos + punto.correctivos}</span>
      </p>
    </div>
  );
}

/** Correctivos van arriba en la pila: siempre redondeados arriba. */
function SegmentoSuperior(props: BarShapeProps) {
  return <Rectangle {...props} radius={[4, 4, 0, 0]} />;
}

/** Preventivos van abajo: se redondean solo si el mes no tiene correctivos encima. */
function SegmentoInferior(props: BarShapeProps) {
  const sinNadaEncima = (props.payload as Punto).correctivos === 0;
  return <Rectangle {...props} radius={sinNadaEncima ? [4, 4, 0, 0] : 0} />;
}

/** Preventivos y correctivos por mes, apilados (la altura total es el total del mes). */
export function GraficaMensual({ porMes }: { porMes: MesResumen[] }) {
  const datos: Punto[] = porMes.map((m) => ({ ...m, etiqueta: MESES[m.mes - 1] }));

  return (
    <div className="space-y-3">
      <Leyenda />
      <div className="h-72 w-full" role="img" aria-label="Mantenimientos preventivos y correctivos por mes">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="etiqueta"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              // En pantallas angostas salta meses en vez de encimar etiquetas
              interval="preserveStartEnd"
              minTickGap={6}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip content={Detalle} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />
            {SERIES.map((s) => (
              <Bar
                key={s.clave}
                dataKey={s.clave}
                name={s.nombre}
                stackId="mes"
                fill={s.color}
                // Separación de 2 px entre segmentos con el color de la tarjeta
                stroke="var(--card)"
                strokeWidth={2}
                maxBarSize={36}
                shape={s.clave === "correctivos" ? SegmentoSuperior : SegmentoInferior}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
