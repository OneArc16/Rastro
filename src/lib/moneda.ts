const formatoPesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatearPesos(valor: number | null | undefined): string {
  if (valor == null) return "—";
  return formatoPesos.format(valor);
}
