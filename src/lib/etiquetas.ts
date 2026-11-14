import type { ESTADOS_ACTIVO, TIPOS_ACTIVO, TIPOS_MANTENIMIENTO } from "@/db/schema";

type TipoActivo = (typeof TIPOS_ACTIVO)[number];
type EstadoActivo = (typeof ESTADOS_ACTIVO)[number];
type TipoMantenimiento = (typeof TIPOS_MANTENIMIENTO)[number];

export const ETIQUETAS_TIPO: Record<TipoActivo, string> = {
  pc_mesa: "PC de mesa",
  portatil: "Portátil",
  todo_en_uno: "Todo en uno",
  monitor: "Monitor",
  teclado: "Teclado",
  mouse: "Mouse",
  impresora: "Impresora",
  parlantes: "Parlantes",
  audifonos: "Audífonos",
  otro: "Otro",
};

export const ETIQUETAS_ESTADO: Record<EstadoActivo, string> = {
  operativo: "Operativo",
  en_reparacion: "En reparación",
  dado_de_baja: "Dado de baja",
};

export const ETIQUETAS_MANTENIMIENTO: Record<TipoMantenimiento, string> = {
  preventivo: "Preventivo",
  correctivo: "Correctivo",
};
