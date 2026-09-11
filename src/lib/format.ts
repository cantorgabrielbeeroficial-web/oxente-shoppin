import type { OrderStatus } from "./types";

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatDateBR(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendente: "Aguardando confirmação",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const ORDER_STATUS_VARIANTS: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pendente: "secondary",
  confirmado: "default",
  enviado: "default",
  entregue: "outline",
  cancelado: "destructive",
};

export const NEXT_ORDER_STATUSES: Record<OrderStatus, { value: OrderStatus; label: string }[]> = {
  pendente: [
    { value: "confirmado", label: "Confirmar pedido" },
    { value: "cancelado", label: "Cancelar pedido" },
  ],
  confirmado: [
    { value: "enviado", label: "Marcar como enviado" },
    { value: "cancelado", label: "Cancelar pedido" },
  ],
  enviado: [{ value: "entregue", label: "Marcar como entregue" }],
  entregue: [],
  cancelado: [],
};
