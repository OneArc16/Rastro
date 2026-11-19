"use client";

import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "cn";
import { coincideConBusqueda } from "@/lib/busqueda-texto";
import type { Opcion } from "./selector";

type Item = { value: string; label: string };

type Props = {
  opciones: Opcion[];
  valor: string;
  alCambiar: (valor: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
};

/**
 * Selector con búsqueda: se escribe para filtrar (sin importar mayúsculas ni
 * tildes), se recorre con las flechas y Enter elige. Mismas props que Selector.
 */
export function SelectorBuscable({
  opciones,
  valor,
  alCambiar,
  placeholder = "Escriba para buscar...",
  id,
  className = "w-full",
}: Props) {
  const items: Item[] = opciones.map((o) => ({ value: o.valor, label: o.etiqueta }));
  const seleccionado = items.find((i) => i.value === valor) ?? null;

  return (
    <Combobox.Root
      items={items}
      value={seleccionado}
      onValueChange={(nuevo) => alCambiar((nuevo as Item | null)?.value ?? "")}
      isItemEqualToValue={(a: Item, b: Item) => a.value === b.value}
      filter={(item: Item, busqueda: string) => coincideConBusqueda(item.label, busqueda)}
      autoHighlight
    >
      <Combobox.InputGroup
        className={cn(
          "relative flex h-8 items-center rounded-lg border border-input bg-transparent text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          className,
        )}
      >
        <Combobox.Input
          id={id}
          placeholder={placeholder}
          className="h-full w-full min-w-0 rounded-lg bg-transparent pr-8 pl-2.5 outline-none placeholder:text-muted-foreground"
        />
        <Combobox.Trigger
          aria-label="Ver opciones"
          className="absolute right-1 flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <ChevronDownIcon className="size-4" />
        </Combobox.Trigger>
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="isolate z-50">
          <Combobox.Popup className="max-h-[min(var(--available-height),18rem)] w-(--anchor-width) min-w-36 overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
            <Combobox.Empty className="px-2 py-1.5 text-sm text-muted-foreground empty:hidden">
              Sin resultados
            </Combobox.Empty>
            <Combobox.List>
              {(item: Item) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  className="relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {item.label}
                  <Combobox.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
