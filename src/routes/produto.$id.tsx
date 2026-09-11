import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Minus, Plus, ShoppingCart, Store } from "lucide-react";
import { toast } from "sonner";
import { getProduct } from "@/lib/catalog.functions";
import { addToCart } from "@/lib/shop.functions";
import { formatBRL } from "@/lib/format";
import { isVideoUrl } from "@/lib/media";
import { useAuthUser } from "@/hooks/use-auth";
import { ProductGrid } from "@/components/product-card";
import { Button } from "@/components/ui/button";

const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["product", id],
    queryFn: () => getProduct({ data: { id } }),
  });

export const Route = createFileRoute("/produto/$id")({
  loader: async ({ params, context }) => {
    const result = await context.queryClient.ensureQueryData(productQuery(params.id));
    if (!result) throw notFound();
    return { name: result.product.name, description: result.product.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Produto indisponível — Oxente" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name} — Oxente`;
    const description =
      loaderData.description.slice(0, 150) || "Produto disponível no marketplace Oxente.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">Produto não encontrado</h1>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">
        Voltar para a home
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
      Não foi possível carregar este produto agora.
    </div>
  ),
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(productQuery(id));
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const add = useServerFn(addToCart);

  const mutation = useMutation({
    mutationFn: () => add({ data: { productId: id, quantity } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Produto adicionado ao carrinho!");
    },
    onError: () => toast.error("Não foi possível adicionar ao carrinho."),
  });

  if (!data) return null;
  const { product, related } = data;
  const soldOut = product.stock <= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 rounded-lg border border-border bg-card p-4 md:grid-cols-2 md:p-6">
        <div className="overflow-hidden rounded-lg bg-muted">
          {product.image_url ? (
            isVideoUrl(product.image_url) ? (
              <video
                src={product.image_url}
                controls
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <div className="flex aspect-square items-center justify-center text-muted-foreground">
              <Store className="h-10 w-10" />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          {product.category && (
            <Link
              to="/categoria/$slug"
              params={{ slug: product.category.slug }}
              className="text-xs font-medium uppercase tracking-wide text-primary hover:underline"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-bold text-card-foreground">{product.name}</h1>
          <p className="mt-3 text-3xl font-extrabold text-primary">{formatBRL(product.price)}</p>

          <Link
            to="/loja/$slug"
            params={{ slug: product.store.slug }}
            className="mt-4 flex items-center gap-2 rounded-md border border-border p-3 text-sm hover:border-primary"
          >
            <Store className="h-4 w-4 text-primary" />
            <span className="font-medium text-card-foreground">{product.store.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">Ver loja</span>
          </Link>

          <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">
            {product.description}
          </p>

          <p className="mt-4 text-sm text-muted-foreground">
            {soldOut ? "Produto esgotado" : `${product.stock} unidades disponíveis`}
          </p>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center rounded-md border border-border">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Diminuir quantidade"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Aumentar quantidade"
                onClick={() => setQuantity((value) => Math.min(product.stock || 1, value + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              size="lg"
              className="flex-1"
              disabled={soldOut || mutation.isPending}
              onClick={() => {
                if (!user) {
                  toast.info("Entre na sua conta para comprar.");
                  navigate({ to: "/entrar" });
                  return;
                }
                mutation.mutate();
              }}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {soldOut ? "Esgotado" : "Adicionar ao carrinho"}
            </Button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-foreground">Você também pode gostar</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
