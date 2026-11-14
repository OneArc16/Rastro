import type { ReactNode } from "react";
import Link from "next/link";
import {
  alertasDeGarantia,
  alertasDeMantenimiento,
  resumenInicio,
} from "@/db/consultas";
import { DIAS_AVISO_GARANTIA, DIAS_AVISO_MANTENIMIENTO } from "@/dominio/mantenimientos";
import { ListaPendientes } from "@/components/mantenimientos/lista-pendientes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ETIQUETAS_ESTADO, ETIQUETAS_TIPO } from "@/lib/etiquetas";
import { formatearFecha, hoyIso } from "@/lib/fechas";

export const dynamic = "force-dynamic";

function Tarjeta({ titulo, valor, alerta = false }: { titulo: string; valor: number; alerta?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${alerta && valor > 0 ? "text-destructive" : ""}`}>
          {valor}
        </p>
      </CardContent>
    </Card>
  );
}

function Bloque({
  titulo,
  enlace,
  children,
}: {
  titulo: string;
  enlace?: { href: string; texto: string };
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{titulo}</CardTitle>
        {enlace && (
          <Link href={enlace.href} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            {enlace.texto}
          </Link>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ListaConteos({ filas }: { filas: Array<{ clave: string; etiqueta: string; total: number }> }) {
  return (
    <ul className="space-y-2">
      {filas.map((fila) => (
        <li key={fila.clave} className="flex justify-between text-sm">
          <span>{fila.etiqueta}</span>
          <span className="font-medium">{fila.total}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PaginaInicio() {
  const hoy = hoyIso();
  const resumen = resumenInicio();
  const { vencidos, proximos } = alertasDeMantenimiento(hoy);
  const garantias = alertasDeGarantia(hoy);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Inicio</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tarjeta titulo="Activos registrados" valor={resumen.totalActivos} />
        <Tarjeta titulo="Disponibles" valor={resumen.disponibles.length} />
        <Tarjeta titulo="Mantenimientos vencidos" valor={vencidos.length} alerta />
        <Tarjeta titulo="Garantías por vencer" valor={garantias.length} alerta />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Bloque
          titulo="Mantenimientos vencidos"
          enlace={{ href: "/mantenimientos", texto: "Registrar" }}
        >
          <ListaPendientes pendientes={vencidos} hoy={hoy} vacio="Ninguno vencido." />
        </Bloque>

        <Bloque titulo={`Mantenimientos próximos (${DIAS_AVISO_MANTENIMIENTO} días)`}>
          <ListaPendientes pendientes={proximos} hoy={hoy} vacio="Ninguno en los próximos días." />
        </Bloque>

        <Bloque titulo={`Garantías por vencer (${DIAS_AVISO_GARANTIA} días)`}>
          {garantias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguna por vencer.</p>
          ) : (
            <ul className="divide-y">
              {garantias.map((g) => (
                <li key={g.id} className="flex justify-between py-2 text-sm">
                  <span>
                    <Link href={`/activos/${g.codigo}`} className="font-mono font-medium underline-offset-4 hover:underline">
                      {g.codigo}
                    </Link>{" "}
                    <span className="text-muted-foreground">{ETIQUETAS_TIPO[g.tipo]}</span>
                  </span>
                  <span>{formatearFecha(g.garantiaHasta)}</span>
                </li>
              ))}
            </ul>
          )}
        </Bloque>

        <Bloque
          titulo="Activos disponibles"
          enlace={{ href: "/inventario", texto: "Ver inventario" }}
        >
          {resumen.disponibles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todos los activos operativos están asignados.</p>
          ) : (
            <ul className="divide-y">
              {resumen.disponibles.map((a) => (
                <li key={a.id} className="py-2 text-sm">
                  <Link href={`/activos/${a.codigo}`} className="font-mono font-medium underline-offset-4 hover:underline">
                    {a.codigo}
                  </Link>{" "}
                  <span className="text-muted-foreground">
                    {[ETIQUETAS_TIPO[a.tipo], a.marca, a.modelo].filter(Boolean).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Bloque>

        <Bloque titulo="Activos por tipo">
          <ListaConteos
            filas={resumen.porTipo.map((f) => ({ clave: f.tipo, etiqueta: ETIQUETAS_TIPO[f.tipo], total: f.total }))}
          />
        </Bloque>

        <Bloque titulo="Activos por estado">
          <ListaConteos
            filas={resumen.porEstado.map((f) => ({ clave: f.estado, etiqueta: ETIQUETAS_ESTADO[f.estado], total: f.total }))}
          />
        </Bloque>
      </div>
    </div>
  );
}
