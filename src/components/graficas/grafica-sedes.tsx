"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
  type TooltipContentProps,
} from "recharts";

type Fila = { sede: string; total: number };

/** Alto de cada fila: el nombre de la sede arriba y la barra debajo. */
const ALTO_FILA = 46;

function Detalle({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const fila = payload[0].payload as Fila;
  return (
    <div className="max-w-64 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="font-medium">{fila.sede}</p>
      <p className="text-muted-foreground">
        <span className="tabular-nums text-foreground">{fila.total}</span>{" "}
        {fila.total === 1 ? "mantenimiento" : "mantenimientos"}
      </p>
    </div>
  );
}

/** Nombre de la sede encima de su barra, alineado al inicio: no le quita ancho a la barra. */
function NombreSede({ x, y, value }: LabelProps) {
  return (
    <text x={Number(x)} y={Number(y) - 6} fill="var(--muted-foreground)" fontSize={12}>
      {value}
    </text>
  );
}

/** Mantenimientos por sede (una sola serie: el título la nombra, sin leyenda). */
export function GraficaSedes({ filas }: { filas: Fila[] }) {
  return (
    <div
      className="w-full"
      style={{ height: filas.length * ALTO_FILA + 28 }}
      role="img"
      aria-label="Mantenimientos por sede"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={filas}
          layout="vertical"
          barCategoryGap={0}
          margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis type="category" dataKey="sede" hide />
          <Tooltip content={Detalle} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />
          <Bar
            dataKey="total"
            fill="var(--serie-preventivo)"
            barSize={14}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            <LabelList dataKey="sede" content={NombreSede} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
