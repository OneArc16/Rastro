import { resumenInicio } from "@/db/consultas";
import { ETIQUETAS_ESTADO, ETIQUETAS_TIPO } from "@/lib/etiquetas";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function PaginaInicio() {
  const resumen = resumenInicio();

  const tarjetas = [
    { titulo: "Activos registrados", valor: resumen.totalActivos },
    { titulo: "Disponibles", valor: resumen.disponibles },
    { titulo: "Funcionarios activos", valor: resumen.totalFuncionarios },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Inicio</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tarjetas.map((t) => (
          <Card key={t.titulo}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{t.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activos por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {resumen.porTipo.map((fila) => (
                <li key={fila.tipo} className="flex justify-between text-sm">
                  <span>{ETIQUETAS_TIPO[fila.tipo]}</span>
                  <span className="font-medium">{fila.total}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activos por estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {resumen.porEstado.map((fila) => (
                <li key={fila.estado} className="flex justify-between text-sm">
                  <span>{ETIQUETAS_ESTADO[fila.estado]}</span>
                  <span className="font-medium">{fila.total}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
