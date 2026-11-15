"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  flexRender,
  globalFilteringFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import type { FilaInventario } from "@/db/consultas";
import { ETIQUETAS_ESTADO, ETIQUETAS_TIPO, VARIANTE_ESTADO } from "@/lib/etiquetas";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { opcionesDesde, Selector, type Opcion } from "@/components/selector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TODOS = "todos";

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    equalsString: filterFn_equalsString,
  },
});

const columna = createColumnHelper<typeof features, FilaInventario>();

const columnas = columna.columns([
  columna.accessor("codigo", {
    header: "Código",
    cell: (info) => (
      <Link
        href={`/activos/${info.getValue()}`}
        className="font-mono font-medium underline-offset-4 hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columna.accessor("tipo", {
    header: "Tipo",
    filterFn: "equalsString",
    cell: (info) => ETIQUETAS_TIPO[info.getValue()],
  }),
  columna.accessor((fila) => [fila.marca, fila.modelo].filter(Boolean).join(" "), {
    id: "marcaModelo",
    header: "Marca / Modelo",
    cell: (info) => info.getValue() || "—",
  }),
  columna.accessor("estado", {
    header: "Estado",
    filterFn: "equalsString",
    cell: (info) => (
      <Badge variant={VARIANTE_ESTADO[info.getValue()]}>
        {ETIQUETAS_ESTADO[info.getValue()]}
      </Badge>
    ),
  }),
  columna.accessor((fila) => fila.responsable ?? fila.ubicacionAsignada ?? "", {
    id: "asignadoA",
    header: "Asignado a",
    filterFn: "equalsString",
    cell: (info) =>
      info.getValue() || <span className="text-muted-foreground">Disponible</span>,
  }),
  columna.accessor((fila) => fila.ubicacion ?? "", {
    id: "ubicacion",
    header: "Ubicación",
    filterFn: "equalsString",
    cell: (info) => info.getValue() || "—",
  }),
  columna.accessor((fila) => (fila.disponible ? "disponible" : "asignado"), {
    id: "disponibilidad",
    header: "Disponibilidad",
    filterFn: "equalsString",
    cell: (info) =>
      info.getValue() === "disponible" ? (
        <Badge variant="success">Disponible</Badge>
      ) : (
        <Badge variant="secondary">Asignado</Badge>
      ),
  }),
]);

function FiltroSelect({
  etiqueta,
  valor,
  alCambiar,
  opciones,
}: {
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  opciones: Opcion[];
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{etiqueta}</Label>
      <Selector
        tamano="sm"
        className="w-full min-w-36"
        opciones={[{ valor: TODOS, etiqueta: "Todos" }, ...opciones]}
        valor={valor}
        alCambiar={(v) => alCambiar(v || TODOS)}
      />
    </div>
  );
}

export function TablaInventario({ datos }: { datos: FilaInventario[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState(TODOS);
  const [filtroEstado, setFiltroEstado] = useState(TODOS);
  const [filtroUbicacion, setFiltroUbicacion] = useState(TODOS);
  const [filtroResponsable, setFiltroResponsable] = useState(TODOS);
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState(TODOS);

  const ubicacionesUnicas = useMemo(
    () =>
      [...new Set(datos.map((f) => f.ubicacion).filter((u): u is string => !!u))].sort(),
    [datos],
  );
  const responsablesUnicos = useMemo(
    () =>
      [
        ...new Set(datos.map((f) => f.responsable).filter((r): r is string => !!r)),
      ].sort(),
    [datos],
  );

  const columnFilters = useMemo(() => {
    const filtros: Array<{ id: string; value: string }> = [];
    if (filtroTipo !== TODOS) filtros.push({ id: "tipo", value: filtroTipo });
    if (filtroEstado !== TODOS) filtros.push({ id: "estado", value: filtroEstado });
    if (filtroUbicacion !== TODOS)
      filtros.push({ id: "ubicacion", value: filtroUbicacion });
    if (filtroResponsable !== TODOS)
      filtros.push({ id: "asignadoA", value: filtroResponsable });
    if (filtroDisponibilidad !== TODOS)
      filtros.push({ id: "disponibilidad", value: filtroDisponibilidad });
    return filtros;
  }, [filtroTipo, filtroEstado, filtroUbicacion, filtroResponsable, filtroDisponibilidad]);

  const tabla = useTable({
    features,
    columns: columnas,
    data: datos,
    globalFilterFn: "includesString",
    state: { columnFilters, globalFilter: busqueda },
  });

  const filas = tabla.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1 space-y-1">
          <Label htmlFor="busqueda" className="text-xs text-muted-foreground">
            Buscar
          </Label>
          <Input
            id="busqueda"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Código, marca, serial..."
          />
        </div>
        <FiltroSelect
          etiqueta="Tipo"
          valor={filtroTipo}
          alCambiar={setFiltroTipo}
          opciones={opcionesDesde(ETIQUETAS_TIPO)}
        />
        <FiltroSelect
          etiqueta="Estado"
          valor={filtroEstado}
          alCambiar={setFiltroEstado}
          opciones={opcionesDesde(ETIQUETAS_ESTADO)}
        />
        <FiltroSelect
          etiqueta="Ubicación"
          valor={filtroUbicacion}
          alCambiar={setFiltroUbicacion}
          opciones={ubicacionesUnicas.map((u) => ({ valor: u, etiqueta: u }))}
        />
        <FiltroSelect
          etiqueta="Responsable"
          valor={filtroResponsable}
          alCambiar={setFiltroResponsable}
          opciones={responsablesUnicos.map((r) => ({ valor: r, etiqueta: r }))}
        />
        <FiltroSelect
          etiqueta="Disponibilidad"
          valor={filtroDisponibilidad}
          alCambiar={setFiltroDisponibilidad}
          opciones={[
            { valor: "disponible", etiqueta: "Disponible" },
            { valor: "asignado", etiqueta: "Asignado" },
          ]}
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {tabla.getHeaderGroups().map((grupo) => (
              <TableRow key={grupo.id}>
                {grupo.headers.map((encabezado) => (
                  <TableHead key={encabezado.id}>
                    {encabezado.isPlaceholder
                      ? null
                      : flexRender(
                          encabezado.column.columnDef.header,
                          encabezado.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnas.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Sin resultados con los filtros actuales.
                </TableCell>
              </TableRow>
            ) : (
              filas.map((fila) => (
                <TableRow key={fila.id}>
                  {fila.getAllCells().map((celda) => (
                    <TableCell key={celda.id}>
                      {flexRender(celda.column.columnDef.cell, celda.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        {filas.length} de {datos.length} activos
      </p>
    </div>
  );
}
