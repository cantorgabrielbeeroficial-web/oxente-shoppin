import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { BadgeCheck, Store } from "lucide-react";
import { listProducts } from "@/lib/catalog.functions";
import { ProductGrid } from "@/components/product-card";
import { hasSupabaseConfig } from "@/integrations/supabase/client";

const officialQuery = queryOptions({
  queryKey: ["products", "oficiais"],
  queryFn: () =>
    hasSupabaseConfig()
      ? listProducts({ data: { storeKind: "interligada", sort: "recentes", limit: 20 } })
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

function OficiaisPage() {
  const { data: products = [] } = useQuery({
    ...officialQuery,
    enabled: hasSupabaseConfig(),
  });
  const stores = Array.from(new Map(products.map((p) => [p.store.id, p.store])).values()).slice(
    0,
    8,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 pb-24 md:pb-8">
      <header className="flex items-center gap-2">
        <BadgeCheck className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Lojas Interligadas Oxente</h1>
      </header>
      <p className="mt-1 text-sm text-muted-foreground">
        Lojas conectadas ao marketplace Oxente, com produtos e vendedores parceiros.
      </p>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {stores.map((store) => (
          <Link
            key={store.id}
            to="/loja/$slug"
            params={{ slug: store.slug }}
            className="flex w-24 shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-brand-orange-soft text-primary">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
              ) : (
                <Store className="h-5 w-5" />
              )}
            </span>
            <span className="line-clamp-2 text-[10px] font-medium text-card-foreground">
              {store.name}
            </span>
          </Link>
        ))}
      </div>

      <h2 className="mt-6 mb-3 text-base font-bold text-foreground">Destaques das lojas</h2>
      <ProductGrid products={products} emptyMessage="Nenhuma loja interligada por aqui ainda." />
    </div>
  );
}
