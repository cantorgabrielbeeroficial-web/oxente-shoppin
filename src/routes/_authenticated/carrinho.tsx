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
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold text-foreground">
          Vixe, teu carrinho tá só o bagaço de vazio!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cuida nas ofertas e encontre algo arretado.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Ver produtos</Link>
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
    <div className="mx-auto max-w-5xl px-4 py-8">
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
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-md border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
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
                        className="text-destructive"
                        onClick={() => mutation.mutate({ itemId: item.id, quantity: 0 })}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-card-foreground">
                    {formatBRL(item.product.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
        <div>
          <p className="text-sm text-muted-foreground">Total do pedido</p>
          <p className="text-2xl font-extrabold text-primary">{formatBRL(total)}</p>
        </div>
        <Button size="lg" onClick={() => navigate({ to: "/checkout" })}>
          Arroxa o nó e concluir compra
        </Button>
      </div>
    </div>
  );
}
