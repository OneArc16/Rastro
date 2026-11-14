import type {
  Specs,
  SpecsImpresora,
  SpecsMonitor,
  SpecsPC,
  TIPOS_ACTIVO,
} from "@/db/schema";
import { esTipoPc } from "@/lib/validacion/activos";

type TipoActivo = (typeof TIPOS_ACTIVO)[number];

function siNo(valor: boolean | undefined): string {
  if (valor === undefined) return "—";
  return valor ? "Sí" : "No";
}

/** Pares [etiqueta, valor] de las especificaciones, según el tipo de activo. */
export function paresDeSpecs(
  tipo: TipoActivo,
  specs: Specs | null | undefined,
): Array<[string, string]> {
  if (!specs) return [];

  if (esTipoPc(tipo)) {
    const pc = specs as SpecsPC;
    const pares: Array<[string, string | undefined]> = [
      ["Unidad de disco", pc.unidadDisco],
      ["Capacidad de disco", pc.capacidadDisco],
      ["Cantidad de RAM", pc.ram],
      ["Tipo de RAM", pc.tipoRam],
      ["Procesador", pc.procesador],
      ["Velocidad", pc.velocidad],
      ["Puertos USB", pc.puertosUsb != null ? String(pc.puertosUsb) : undefined],
      [
        "Tarjeta gráfica",
        pc.tarjetaGrafica
          ? [pc.tarjetaGrafica.modelo, pc.tarjetaGrafica.capacidad]
              .filter(Boolean)
              .join(" — ")
          : undefined,
      ],
      ["Tarjeta wifi", pc.tarjetaWifi ?? undefined],
      ["Puerto de red", pc.puertoRed !== undefined ? siNo(pc.puertoRed) : undefined],
      ["Tarjeta de sonido", pc.tarjetaSonido ?? undefined],
      ["Board", pc.board],
      ["Sistema operativo", pc.sistemaOperativo],
      ["Herramientas ofimáticas", pc.ofimatica],
      ["Antivirus", pc.antivirus],
    ];
    if (tipo === "portatil") {
      pares.push(
        ["Batería (serial)", pc.bateria?.serial],
        ["Batería (estado)", pc.bateria?.estado],
      );
    }
    return pares.filter((par): par is [string, string] => Boolean(par[1]));
  }

  if (tipo === "monitor") {
    const monitor = specs as SpecsMonitor;
    return (
      [
        ["Tamaño", monitor.tamano],
        ["Tipo", monitor.tipo],
      ] as Array<[string, string | undefined]>
    ).filter((par): par is [string, string] => Boolean(par[1]));
  }

  if (tipo === "impresora") {
    const impresora = specs as SpecsImpresora;
    return [
      ["Cable de conexión", siNo(impresora.cableConexion)],
      ["Cable de energía", siNo(impresora.cableEnergia)],
    ];
  }

  return [];
}

export function DetalleSpecs({
  tipo,
  specs,
}: {
  tipo: TipoActivo;
  specs: Specs | null | undefined;
}) {
  const pares = paresDeSpecs(tipo, specs);
  if (pares.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sin especificaciones registradas.</p>
    );
  }

  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
      {pares.map(([etiqueta, valor]) => (
        <div key={etiqueta} className="flex justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">{etiqueta}</dt>
          <dd className="text-right font-medium">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
