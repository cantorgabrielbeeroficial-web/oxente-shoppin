import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Minus, Plus, ShoppingBag, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listCart, updateCartItem } from "@/lib/shop.functions";
import { formatBRL } from "@/lib/format";
import { isVideoUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CartItem } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/carrinho")({
  head: () => ({
    meta: [
      { title: "Meu carrinho — Oxente" },
      {
        name: "description",
        content: "Revise os produtos do seu carrinho e finalize o pedido no Oxente.",
      },
      { property: "og:title", content: "Meu carrinho — Oxente" },
      { property: "og:description", content: "Itens agrupados por loja, prontos para finalizar." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const update = useServerFn(updateCartItem);

  const { data: items, isPending } = useQuery({
    queryKey: ["cart"],
    queryFn: () => listCart(),
  });

  const mutation = useMutation({
    mutationFn: (input: { itemId: string; quantity: number }) => update({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    },
    onError: () => toast.error("Não foi possível atualizar o carrinho."),
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-5xl space-y-3 px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const cart = items ?? [];

  if (cart.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <ShoppingBag className="h-12 w-12 text-primary" />
        </div>
        <h1 className="mt-6 text-xl font-bold text-foreground">
          Oxente, seu carrinho está vazio!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vixe, tá só o bagaço! Bora dar uma espiada nas ofertas e achar algo arretado.
        </p>
        <Button asChild size="lg" className="mt-6 h-12 w-full max-w-xs">
          <Link to="/">Bora voltar às compras</Link>
        </Button>
      </div>
    );
  }

  const groups = new Map<string, { storeName: string; storeSlug: string; items: CartItem[] }>();
  for (const item of cart) {
    const key = item.product.store.id;
    const group = groups.get(key) ?? {
      storeName: item.product.store.name,
      storeSlug: item.product.store.slug,
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  }

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-60 md:py-8 md:pb-8">
      <h1 className="text-xl font-bold text-foreground">Meu carrinho</h1>

      <div className="mt-4 space-y-4">
        {[...groups.values()].map((group) => (
          <section key={group.storeSlug} className="rounded-lg border border-border bg-card">
            <header className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Store className="h-4 w-4 text-primary" />
              <Link
                to="/loja/$slug"
                params={{ slug: group.storeSlug }}
                className="text-sm font-semibold text-card-foreground hover:underline"
              >
                {group.storeName}
              </Link>
            </header>
            <ul className="divide-y divide-border">
              {group.items.map((item) => (
                <li key={item.id} className="flex gap-3 p-4">
                  <Link to="/produto/$id" params={{ id: item.product.id }} className="shrink-0">
                    {isVideoUrl(item.product.image_url) ? (
                      <video
                        src={item.product.image_url ?? undefined}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-20 w-20 rounded-md object-cover"
                      />
                    ) : (
                      <img
                        src={item.product.image_url ?? ""}
                        alt={item.product.name}
                        className="h-20 w-20 rounded-md object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link
                      to="/produto/$id"
                      params={{ id: item.product.id }}
                      className="line-clamp-2 text-sm text-card-foreground hover:text-primary"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-1 font-bold text-primary">{formatBRL(item.product.price)}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center rounded-md border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11"
                          aria-label="Diminuir"
                          disabled={mutation.isPending}
                          onClick={() =>
                            mutation.mutate({
                              itemId: item.id,
                              quantity: Math.max(0, item.quantity - 1),
                            })
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11"
                          aria-label="Aumentar"
                          disabled={mutation.isPending || item.quantity >= item.product.stock}
                          onClick={() =>
                            mutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-11 min-w-11 text-destructive"
                        aria-label="Remover item"
                        onClick={() => mutation.mutate({ itemId: item.id, quantity: 0 })}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  </div>
                  <p className="hidden text-sm font-semibold text-card-foreground sm:block">
                    {formatBRL(item.product.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-[3.25rem] z-30 border-t border-border bg-card/95 p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur md:static md:mt-6 md:rounded-lg md:border md:p-4 md:shadow-none">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
          <dl className="space-y-0.5 text-sm">
            <div className="flex justify-between gap-6 text-muted-foreground">
              <dt>Subtotal</dt>
              <dd>{formatBRL(total)}</dd>
            </div>
            <div className="flex justify-between gap-6 text-muted-foreground">
              <dt>Frete</dt>
              <dd>A gente calcula no checkout</dd>
            </div>
            <div className="flex items-baseline justify-between gap-6">
              <dt className="font-medium text-card-foreground">Total</dt>
              <dd className="text-xl font-extrabold text-primary">{formatBRL(total)}</dd>
            </div>
          </dl>
          <Button
            size="lg"
            className="h-auto min-h-12 w-full flex-col gap-0 py-2 leading-tight md:w-auto"
            onClick={() => navigate({ to: "/checkout" })}
          >
            <span className="text-base font-bold">Arrocha o nó cuida</span>
            <span className="text-xs font-normal opacity-90">Concluir compra</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
