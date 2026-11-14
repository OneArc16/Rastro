const formatoPesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatearPesos(valor: number | null | undefined): string {
  if (valor == null) return "—";
  // Intl separa el símbolo con un espacio no separable; se usa uno normal
  return formatoPesos.format(valor).replace(/ /g, " ");
}
