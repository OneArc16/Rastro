import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Clock, TriangleAlert, type LucideIcon } from "lucide-react";
import { filasDeEstadistica, mantenimientosConActivo } from "@/db/consultas";
import {
  anioPorDefecto,
  aniosConDatos,
  estadoActual,
  porSede,
  resumenDelAnio,
} from "@/dominio/estadisticas";
import { DIAS_AVISO_MANTENIMIENTO } from "@/dominio/mantenimientos";
import { GraficaMensual } from "@/components/graficas/grafica-mensual";
import { GraficaSedes } from "@/components/graficas/grafica-sedes";
import { BotonEnlace } from "@/components/boton-enlace";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hoyIso } from "@/lib/fechas";

export const metadata: Metadata = { title: "Gráficas" };
export const dynamic = "force-dynamic";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const porcentaje = (parte: number, total: number) =>
  total === 0 ? "—" : `${Math.round((parte / total) * 100)} %`;

function Indicador({ titulo, valor, detalle }: { titulo: string; valor: number; detalle?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardDescription>{titulo}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{valor}</p>
        {detalle && <p className="text-sm text-muted-foreground">{detalle}</p>}
      </CardContent>
    </Card>
  );
}

function Estado({
  icono: Icono,
  color,
  titulo,
  valor,
  detalle,
}: {
  icono: LucideIcon;
  color: string;
  titulo: string;
  valor: number;
  detalle: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Icono className="size-6 shrink-0" style={{ color }} aria-hidden />
      <div>
        <p className="text-sm font-medium">
          {titulo}: <span className="tabular-nums">{valor}</span>
        </p>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </div>
    </div>
  );
}

function VerTabla({ children }: { children: React.ReactNode }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        Ver los datos en tabla
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

export default async function PaginaGraficas({ searchParams }: PageProps<"/graficas">) {
  const hoy = hoyIso();
  const filas = filasDeEstadistica();
  const anios = aniosConDatos(filas);
  const pedido = Number((await searchParams).anio);
  const anio = anios.includes(pedido) ? pedido : anioPorDefecto(anios, hoy);

  const resumen = resumenDelAnio(filas, anio);
  const sedes = porSede(filas, anio);
  const estado = estadoActual(mantenimientosConActivo(), hoy);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Gráficas de mantenimientos</h1>
        {anios.length > 0 && (
          <nav aria-label="Año de análisis" className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Año:</span>
            {anios.map((a) => (
              <BotonEnlace
                key={a}
                href={`/graficas?anio=${a}`}
                size="sm"
                variant={a === anio ? "default" : "outline"}
                aria-current={a === anio ? "page" : undefined}
              >
                {a}
              </BotonEnlace>
            ))}
          </nav>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Indicador titulo={`Mantenimientos ${anio}`} valor={resumen.total} />
        <Indicador
          titulo="Preventivos"
          valor={resumen.preventivos}
          detalle={porcentaje(resumen.preventivos, resumen.total)}
        />
        <Indicador
          titulo="Correctivos"
          valor={resumen.correctivos}
          detalle={porcentaje(resumen.correctivos, resumen.total)}
        />
        <Indicador titulo="Equipos atendidos" valor={resumen.equipos} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos mantenimientos (hoy)</CardTitle>
          <CardDescription>
            Cada equipo según la próxima fecha de su último mantenimiento.{" "}
            <Link href="/mantenimientos" className="underline underline-offset-4">
              Ver mantenimientos
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Estado
            icono={TriangleAlert}
            color="var(--estado-critico)"
            titulo="Vencidos"
            valor={estado.vencidos}
            detalle="La próxima fecha ya pasó"
          />
          <Estado
            icono={Clock}
            color="var(--estado-aviso)"
            titulo="Próximos"
            valor={estado.proximos}
            detalle={`En los próximos ${DIAS_AVISO_MANTENIMIENTO} días`}
          />
          <Estado
            icono={CircleCheck}
            color="var(--estado-bueno)"
            titulo="Al día"
            valor={estado.alDia}
            detalle={`Después de ${DIAS_AVISO_MANTENIMIENTO} días`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mantenimientos por mes · {anio}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resumen.total === 0 ? (
            <p className="text-sm text-muted-foreground">No hay mantenimientos registrados en {anio}.</p>
          ) : (
            <>
              <GraficaMensual porMes={resumen.porMes} />
              <VerTabla>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead className="text-right">Preventivos</TableHead>
                      <TableHead className="text-right">Correctivos</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumen.porMes.map((m) => (
                      <TableRow key={m.mes}>
                        <TableCell>{MESES[m.mes - 1]}</TableCell>
                        <TableCell className="text-right tabular-nums">{m.preventivos}</TableCell>
                        <TableCell className="text-right tabular-nums">{m.correctivos}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {m.preventivos + m.correctivos}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </VerTabla>
            </>
          )}
        </CardContent>
      </Card>

      {sedes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mantenimientos por sede · {anio}</CardTitle>
            <CardDescription>Según la ubicación actual de cada equipo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GraficaSedes filas={sedes} />
            <VerTabla>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sede</TableHead>
                    <TableHead className="text-right">Mantenimientos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sedes.map((s) => (
                    <TableRow key={s.sede}>
                      <TableCell className="whitespace-normal">{s.sede}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </VerTabla>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
