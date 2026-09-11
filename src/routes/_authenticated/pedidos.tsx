import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listMyOrders } from "@/lib/shop.functions";
import { formatBRL, formatDateBR, ORDER_STATUS_LABELS, ORDER_STATUS_VARIANTS } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus pedidos — Oxente" },
      {
        name: "description",
        content: "Acompanhe o status dos seus pedidos feitos no marketplace Oxente.",
      },
      { property: "og:title", content: "Meus pedidos — Oxente" },
      { property: "og:description", content: "Histórico e status de cada pedido." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { data: orders, isPending } = useQuery({
    queryKey: ["orders"],
    queryFn: () => listMyOrders(),
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-4xl space-y-3 px-4 py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-foreground">Você ainda não tem pedidos</h1>
        <Button asChild className="mt-6">
          <Link to="/">Começar a comprar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-bold text-foreground">Meus pedidos</h1>
      <ul className="mt-4 space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  {order.store?.name ?? "Loja"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pedido de {formatDateBR(order.created_at)}
                </p>
              </div>
              <Badge variant={ORDER_STATUS_VARIANTS[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>

            <ul className="mt-3 space-y-1 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.product_name}
                  </span>
                  <span className="text-card-foreground">
                    {formatBRL(item.unit_price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                Entrega: {order.shipping_recipient} — {order.shipping_address}
              </p>
              <p className="font-bold text-primary">{formatBRL(order.total)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
