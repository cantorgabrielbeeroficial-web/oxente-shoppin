import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  ChevronRight,
  Crown,
  Percent,
  Store as StoreIcon,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { listCategories, listProducts } from "@/lib/catalog.functions";
import { hasSupabaseConfig } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { isVideoUrl } from "@/lib/media";
import { AdBanners } from "@/components/ad-banners";
import { MobileSearchBar } from "@/components/mobile-search-bar";
import { Button } from "@/components/ui/button";
import type { ProductListItem } from "@/lib/types";

const officialQuery = queryOptions({
  queryKey: ["products", "oficiais"],
  queryFn: () =>
    hasSupabaseConfig()
      ? listProducts({ data: { storeKind: "interligada", sort: "recentes", limit: 30 } })
      : Promise.resolve([]),
});

export const Route = createFileRoute("/oficiais")({
  head: () => ({
    meta: [
      { title: "Lojas Oficiais — Oxente" },
      {
        name: "description",
        content: "Lojas interligadas à Oxente, direto do sertão para todo o Brasil.",
      },
      { property: "og:title", content: "Lojas Oficiais — Oxente" },
      {
        property: "og:description",
        content: "Lojas interligadas com entrega e garantia arretadas.",
      },
    ],
  }),
  component: OficiaisPage,
});

const SHORTCUTS = [
  { label: "Melhores Ofertas", icon: Percent, to: "/buscar" },
  { label: "Frete Grátis SEM VALOR MÍNIMO", icon: Truck, to: "/buscar" },
  { label: "Ver todas as Lojas", icon: StoreIcon, to: "/buscar" },
  { label: "Oxente Premium", icon: Crown, to: "/eu" },
] as const;

const EXCLUSIVE_COUPONS = [
  { title: "20% DE CASHBACK", note: "Limitado a R$20" },
  { title: "20% OFF", note: "Compras acima de R$0 · Limitado a R$20" },
  { title: "R$100 OFF", note: "Compras acima de R$739" },
] as const;

const STORE_COUPONS = [
  { title: "2% OFF", note: "Compras acima de R$100 · Limitado a R$5" },
  { title: "2% OFF", note: "Compras acima de R$1,5mil · Limitado a R$20" },
  { title: "5% OFF", note: "Compras acima de R$99,9" },
] as const;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="px-1 text-lg font-bold text-foreground">{children}</h2>;
}

function PillHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-full bg-primary px-4 py-2 text-center text-sm font-extrabold uppercase tracking-wide text-primary-foreground shadow-sm">
      {children}
    </div>
  );
}

function ProductImage({ product, className }: { product: ProductListItem; className?: string }) {
  if (!product.image_url) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className ?? ""}`}>
        <StoreIcon className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }
  return isVideoUrl(product.image_url) ? (
    <video
      src={product.image_url}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      className={`object-cover ${className ?? ""}`}
    />
  ) : (
    <img
      src={product.image_url}
      alt={product.name}
      loading="lazy"
      className={`object-cover ${className ?? ""}`}
    />
  );
}

function OfficialBadge() {
  return (
    <span className="rounded-sm bg-primary px-1 py-px text-[9px] font-bold leading-none text-primary-foreground">
      Oficial
    </span>
  );
}

function ProductTile({ product, className = "" }: { product: ProductListItem; className?: string }) {
  return (
    <Link
      to="/produto/$id"
      params={{ id: product.id }}
      className={`flex flex-col overflow-hidden rounded-lg border border-border bg-card ${className}`}
    >
      <ProductImage product={product} className="aspect-square w-full" />
      <div className="flex flex-1 flex-col gap-1 p-2">
        <p className="line-clamp-2 text-xs leading-tight text-card-foreground">
          <OfficialBadge /> {product.name}
        </p>
        <p className="mt-auto text-sm font-bold text-primary">{formatBRL(product.price)}</p>
        <p className="text-[10px] text-muted-foreground">
          {product.stock > 0 ? `${product.stock} no estoque` : "Esgotado"}
        </p>
      </div>
    </Link>
  );
}

function CouponCard({
  tag,
  title,
  note,
  action,
}: {
  tag?: string;
  title: string;
  note: string;
  action: string;
}) {
  return (
    <div className="flex w-44 shrink-0 flex-col justify-between rounded-lg border border-border bg-card p-3">
      <div>
        {tag && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-card-foreground">
            <BadgeCheck className="h-4 w-4 text-primary" />
            {tag}
          </div>
        )}
        <p className="mt-1.5 text-sm font-extrabold text-card-foreground">{title}</p>
        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{note}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[10px] text-primary">Condições</span>
        <button
          type="button"
          onClick={() => toast.success("Cupom guardado! Arrocha o nó na hora de pagar.")}
          className="rounded-sm bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
        >
          Eu quero
        </button>
      </div>
    </div>
  );
}

function OficiaisPage() {
  const { data: products = [] } = useQuery({
    ...officialQuery,
    enabled: hasSupabaseConfig(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
    enabled: typeof window !== "undefined",
  });

  const stores = Array.from(new Map(products.map((p) => [p.store.id, p.store])).values());
  const featured = products[0];
  const justArrived = products.slice(0, 10);
  const bestOffers = products.slice(0, 9);
  const recommended = products.slice(0, 20);

  return (
    <div className="mx-auto max-w-3xl pb-24 md:pb-8">
      <section className="relative overflow-hidden sm:hidden">
        <AdBanners />
        <MobileSearchBar className="absolute inset-x-3 top-2 z-30" />
      </section>

      <div className="space-y-4 bg-muted/40 pb-4">
        <section className="bg-card px-3 pb-3 pt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-primary">Categorias</h2>
            <Link to="/buscar" className="flex items-center text-xs text-muted-foreground">
              Ver Mais <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Link
                key={category.id}
                to="/categoria/$slug"
                params={{ slug: category.slug }}
                search={{ canal: "interligada" }}
                className="flex w-16 shrink-0 flex-col items-center gap-1 text-center"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange-soft text-lg font-bold text-primary">
                  {category.name.slice(0, 1)}
                </span>
                <span className="line-clamp-2 text-[10px] leading-tight text-card-foreground">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <AdBanners />

        <section className="grid grid-cols-4 gap-1 bg-card px-2 py-3">
          {SHORTCUTS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange-soft text-primary">
                <item.icon className="h-6 w-6" />
              </span>
              <span className="text-[10px] font-medium leading-tight text-card-foreground">
                {item.label}
              </span>
            </Link>
          ))}
        </section>

        <section className="space-y-3 bg-card px-3 py-4">
          <SectionTitle>Cupons Arretados</SectionTitle>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {EXCLUSIVE_COUPONS.map((coupon) => (
              <CouponCard key={coupon.title} tag="LOJAS OFICIAIS" {...coupon} action="Eu quero" />
            ))}
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => toast.success("Cupons guardados! Bora às compras.")}
          >
            Pegar todos (3)
          </Button>
        </section>

        <section className="space-y-3 bg-card px-3 py-4">
          <SectionTitle>Cupons das Lojas Oficiais</SectionTitle>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STORE_COUPONS.map((coupon, index) => (
              <CouponCard key={index} {...coupon} action="Eu quero" />
            ))}
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => toast.success("Cupons guardados! Bora às compras.")}
          >
            Pegar todos (3)
          </Button>
        </section>

        {justArrived.length > 0 && (
          <section className="space-y-3 bg-card px-3 py-4">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-primary px-1.5 py-0.5 text-[10px] font-bold text-primary">
                Full
              </span>
              <h2 className="text-base font-bold text-foreground">
                Estocado e entregue pela Oxente
              </h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {justArrived.slice(0, 6).map((product) => (
                <ProductTile key={product.id} product={product} className="w-32 shrink-0" />
              ))}
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link to="/buscar">
                Ver Tudo <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </section>
        )}

        {featured && (
          <section className="space-y-3 bg-card px-3 py-4">
            <PillHeader>Descontão do Sertão</PillHeader>
            <Link
              to="/produto/$id"
              params={{ id: featured.id }}
              className="relative block overflow-hidden rounded-lg border border-border"
            >
              <ProductImage product={featured} className="aspect-[4/3] w-full" />
              <div className="absolute bottom-3 right-3 rounded-lg bg-card/95 p-3 text-right shadow">
                <p className="line-clamp-1 max-w-[10rem] text-xs text-muted-foreground">
                  {featured.name}
                </p>
                <p className="text-xl font-extrabold text-primary">{formatBRL(featured.price)}</p>
                <span className="mt-1 inline-block rounded-sm bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  Compre Agora
                </span>
              </div>
            </Link>
            <p className="text-center text-[10px] text-muted-foreground">
              Oferta disponível enquanto durar o estoque
            </p>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary">
                <Percent className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-card-foreground">
                  {featured.name}
                </p>
                <p className="text-sm font-extrabold text-primary">R$5 de desconto</p>
                <p className="text-[10px] text-muted-foreground">Termina em: 7 horas</p>
              </div>
              <button
                type="button"
                onClick={() => toast.success("Cupom guardado! Arrocha o nó na hora de pagar.")}
                className="rounded-sm bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
              >
                Eu quero
              </button>
            </div>
          </section>
        )}

        <section className="space-y-3 bg-card px-3 py-4">
          <PillHeader>Lojas Oficiais em Destaque</PillHeader>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {stores.length === 0 && (
              <p className="w-full py-4 text-center text-sm text-muted-foreground">
                Nenhuma loja interligada por aqui ainda.
              </p>
            )}
            {stores.map((store) => (
              <Link
                key={store.id}
                to="/loja/$slug"
                params={{ slug: store.slug }}
                className="flex w-28 shrink-0 flex-col items-center gap-2 rounded-lg border border-border p-3 text-center"
              >
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-brand-orange-soft text-primary">
                  {store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <StoreIcon className="h-6 w-6" />
                  )}
                </span>
                <span className="line-clamp-2 text-[11px] font-medium text-card-foreground">
                  {store.name}
                </span>
              </Link>
            ))}
          </div>
          <Button asChild variant="outline" size="sm" className="mx-auto flex w-32">
            <Link to="/buscar">Ver tudo</Link>
          </Button>
        </section>

        {categories.length > 0 && (
          <section className="space-y-3 bg-card px-3 py-4">
            <PillHeader>Categorias em Destaque</PillHeader>
            <div className="grid grid-cols-2 gap-2">
              {categories.slice(0, 6).map((category, index) => (
                <Link
                  key={category.id}
                  to="/categoria/$slug"
                  params={{ slug: category.slug }}
                  search={{ canal: "interligada" }}
                  className={`flex aspect-[1.3] flex-col items-center justify-center rounded-lg p-3 text-center text-white ${
                    index % 2 === 0 ? "bg-primary" : "bg-primary/85"
                  }`}
                >
                  <span className="text-base font-extrabold">{category.name}</span>
                  <span className="mt-1 text-xs">Ofertas arretadas</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {justArrived.length > 0 && (
          <section className="space-y-3 bg-card px-3 py-4">
            <PillHeader>Acabaram de Chegar</PillHeader>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {justArrived.map((product) => (
                <ProductTile key={product.id} product={product} className="w-36 shrink-0" />
              ))}
            </div>
          </section>
        )}

        {bestOffers.length > 0 && (
          <section className="space-y-3 bg-card px-3 py-4">
            <SectionTitle>Melhores Ofertas</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {bestOffers.map((product) => (
                <ProductTile key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3 bg-card px-3 py-4">
          <div className="flex items-end justify-between">
            <h2 className="text-sm font-bold uppercase text-primary">Lojas Oficiais</h2>
            <Link to="/buscar" className="flex items-center text-xs text-muted-foreground">
              Ver Tudo <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {stores.slice(0, 6).map((store) => (
              <Link
                key={store.id}
                to="/loja/$slug"
                params={{ slug: store.slug }}
                className="flex aspect-[1.4] items-center justify-center overflow-hidden rounded-lg border border-border bg-card p-2"
              >
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className="h-full object-contain" />
                ) : (
                  <span className="line-clamp-2 text-center text-xs font-semibold text-card-foreground">
                    {store.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
          <div className="rounded-lg bg-primary p-4 text-center text-primary-foreground">
            <p className="text-base font-extrabold">Lojas Oficiais</p>
            <p className="mt-1 text-sm">Saiba como é fácil encontrar</p>
          </div>
        </section>

        <section className="space-y-3 bg-card px-3 py-4">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-primary/40" />
            <h2 className="text-sm font-bold text-primary">Recomendações pra você, visse?</h2>
            <span className="h-px flex-1 bg-primary/40" />
          </div>
          <h3 className="text-xs font-bold uppercase text-card-foreground">
            Recomendações oficiais
          </h3>
          {recommended.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nenhuma loja interligada por aqui ainda.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {recommended.map((product) => (
                <ProductTile key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
