import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  ChevronDown,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { getProduct } from "@/lib/catalog.functions";
import { addToCart } from "@/lib/shop.functions";
import { formatBRL } from "@/lib/format";
import { isVideoUrl } from "@/lib/media";
import { isTestProduct, productImageUrl } from "@/lib/product-media";
import { ProductReviews, type ReviewsSummary } from "@/components/product-reviews";
import { ProductSpecsSheet } from "@/components/product-specs-sheet";
import { useAuthUser } from "@/hooks/use-auth";
import { ProductGrid } from "@/components/product-card";
import { Button } from "@/components/ui/button";

// Avaliações de demonstração (sem backend de avaliações ainda); só aparecem no produto de teste.
const DEMO_REVIEWS: ReviewsSummary = {
  average: 4.9,
  countLabel: "1,1mil",
  highlights: [
    { label: "Som", text: "Graves fortes e áudio bem limpinho, arretado." },
    { label: "Bateria", text: "Dura o dia todo e carrega rapidinho." },
  ],
  media: [
    { url: "/fone-bluetooth.svg", video: true },
    { url: "/fone-bluetooth.svg", video: true },
    { url: "/fone-bluetooth.svg" },
  ],
  extraMedia: 212,
  reviews: [
    {
      id: "demo-1",
      user: "maria.do.sertao",
      rating: 5,
      variation: "Preto",
      text: "Adorei minha compra, chegou rapidinho e o som é massa demais!",
      helpful: 23,
      media: [{ url: "/fone-bluetooth.svg" }, { url: "/fone-bluetooth.svg", video: true }],
    },
  ],
};

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
  const [mediaFailed, setMediaFailed] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [buyNow, setBuyNow] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const add = useServerFn(addToCart);

  const mutation = useMutation({
    mutationFn: () => add({ data: { productId: id, quantity } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setSpecsOpen(false);
      if (buyNow) {
        navigate({ to: "/carrinho" });
        return;
      }
      toast.success("Produto adicionado ao carrinho!");
    },
    onError: () => toast.error("Não foi possível adicionar ao carrinho."),
  });

  useEffect(() => {
    setMediaFailed(false);
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) setMediaFailed(true);
  }, [data?.product.image_url]);

  if (!data) return null;
  const { product, related } = data;
  const soldOut = product.stock <= 0;
  const imageUrl = productImageUrl(product);

  const openSpecs = (now: boolean) => {
    setBuyNow(now);
    setSpecsOpen(true);
  };

  const addProductToCart = () => {
    if (!user) {
      toast.info("Entre na sua conta para comprar.");
      navigate({ to: "/entrar" });
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="mx-auto max-w-7xl pb-24 md:px-4 md:py-6 md:pb-0">
      <header className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-border bg-background px-3 md:hidden">
        <Link
          to="/"
          aria-label="Voltar para a home"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link
          to="/buscar"
          aria-label="Buscar produtos"
          className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-muted px-3 text-sm text-muted-foreground"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">{product.name}</span>
        </Link>
        <Link
          to="/carrinho"
          aria-label="Carrinho"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-muted"
        >
          <ShoppingCart className="h-5 w-5" />
        </Link>
      </header>

      <div className="grid gap-0 bg-card md:grid-cols-2 md:gap-6 md:rounded-lg md:border md:border-border md:p-6">
        <div className="relative aspect-[0.94] max-h-[55svh] overflow-hidden bg-muted md:aspect-square md:max-h-none md:rounded-lg">
          {imageUrl && !mediaFailed ? (
            isVideoUrl(imageUrl) ? (
              <video
                src={imageUrl}
                controls
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-contain"
                onError={() => setMediaFailed(true)}
              />
            ) : (
              <img
                ref={imageRef}
                src={imageUrl}
                alt={product.name}
                className="h-full w-full object-contain"
                onError={() => setMediaFailed(true)}
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Store className="h-10 w-10" />
            </div>
          )}
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
            1 / 1
          </span>
        </div>

        <div className="flex flex-col px-4 pb-5 pt-4 md:px-0 md:py-0">
          {product.category && (
            <Link
              to="/categoria/$slug"
              params={{ slug: product.category.slug }}
              className="text-xs font-medium uppercase tracking-wide text-primary hover:underline"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-1 text-xl font-bold leading-snug text-card-foreground md:text-2xl">
            {product.name}
          </h1>
          <p className="mt-3 text-3xl font-extrabold text-primary">{formatBRL(product.price)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {soldOut ? "Produto esgotado" : `${product.stock} unidades disponíveis`}
          </p>

          <div className="mt-4 flex items-center gap-2 border-y border-border py-3 text-sm text-muted-foreground">
            <Truck className="h-4 w-4 shrink-0 text-primary" />
            <span>Consulte as opções de entrega no carrinho.</span>
          </div>

          <Link
            to="/loja/$slug"
            params={{ slug: product.store.slug }}
            className="mt-4 flex items-center gap-2 rounded-md border border-border p-3 text-sm hover:border-primary"
          >
            <Store className="h-4 w-4 text-primary" />
            <span className="font-medium text-card-foreground">{product.store.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">Ver loja</span>
          </Link>

          <details className="group mt-4 border-b border-border pb-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-card-foreground">
              Descrição do produto
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description || "Sem descrição disponível para este produto."}
            </p>
          </details>

          <ProductReviews summary={isTestProduct(product) ? DEMO_REVIEWS : null} />

          <div className="mt-4 hidden items-center gap-3 md:flex">
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
              onClick={addProductToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {soldOut ? "Esgotado" : "Adicionar ao carrinho"}
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 md:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <Link
            to="/conversas"
            aria-label="Conversar com a loja"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-primary"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
          <Link
            to="/carrinho"
            aria-label="Abrir carrinho"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border text-primary"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>
          <Button
            variant="outline"
            className="h-11 flex-1 border-primary px-2 text-primary hover:text-primary"
            disabled={soldOut}
            onClick={() => openSpecs(false)}
          >
            Adicionar ao carrinho
          </Button>
          <Button
            size="lg"
            className="h-11 flex-1 px-2"
            disabled={soldOut}
            onClick={() => openSpecs(true)}
          >
            {soldOut ? "Esgotado" : "Compre agora"}
          </Button>
        </div>
      </div>

      <ProductSpecsSheet
        open={specsOpen}
        onOpenChange={setSpecsOpen}
        name={product.name}
        price={product.price}
        stock={product.stock}
        imageUrl={imageUrl}
        quantity={quantity}
        onQuantityChange={setQuantity}
        actionLabel={buyNow ? "Compre agora" : "Adicionar ao carrinho"}
        pending={mutation.isPending}
        onConfirm={addProductToCart}
      />

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-foreground">Você também pode gostar</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
