import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Store, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getStore } from "@/lib/catalog.functions";
import { ProductGrid } from "@/components/product-card";
import { useAuthUser } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const storeQuery = (slug: string) =>
  queryOptions({
    queryKey: ["store", slug],
    queryFn: () => getStore({ data: { slug } }),
  });

export const Route = createFileRoute("/loja/$slug")({
  loader: async ({ params, context }) => {
    const result = await context.queryClient.ensureQueryData(storeQuery(params.slug));
    if (!result) throw notFound();
    return { name: result.store.name, description: result.store.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Loja indisponível — Oxente" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name} — Loja no Oxente`;
    const description =
      loaderData.description.slice(0, 150) || `Produtos da loja ${loaderData.name} no Oxente.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: StorePage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">Loja não encontrada</h1>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">
        Voltar para a home
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
      Não foi possível carregar esta loja agora.
    </div>
  ),
});

function StorePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(storeQuery(slug));
  const { user } = useAuthUser();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followPending, setFollowPending] = useState(false);
  const storeId = data?.store.id;

  useEffect(() => {
    let active = true;
    if (!storeId) return;
    Promise.all([
      supabase
        .from("store_followers")
        .select("user_id", { count: "exact", head: true })
        .eq("store_id", storeId),
      user
        ? supabase
            .from("store_followers")
            .select("store_id")
            .eq("store_id", storeId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]).then(([countResult, followedResult]) => {
      if (!active) return;
      setFollowerCount(countResult.count ?? 0);
      setFollowing(Boolean(followedResult.data));
    });
    return () => {
      active = false;
    };
  }, [storeId, user]);

  if (!data) return null;
  const { store, products } = data;

  async function toggleFollow() {
    if (!user) {
      toast.info("Entre na sua conta para seguir esta loja.");
      return;
    }
    setFollowPending(true);
    const result = following
      ? await supabase
          .from("store_followers")
          .delete()
          .eq("store_id", store.id)
          .eq("user_id", user.id)
      : await supabase.from("store_followers").insert({ store_id: store.id, user_id: user.id });
    setFollowPending(false);
    if (result.error) {
      toast.error("Não foi possível atualizar o seguimento da loja.");
      return;
    }
    setFollowing(!following);
    setFollowerCount((count) => count + (following ? -1 : 1));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {store.banner_url && (
        <div className="mb-6 h-48 w-full overflow-hidden rounded-xl border border-border sm:h-64">
          <img src={store.banner_url} alt={store.name} className="h-full w-full object-cover" />
        </div>
      )}

      <header className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
        {store.logo_url ? (
          <img
            src={store.logo_url}
            alt={store.name}
            className="h-16 w-16 rounded-full border border-border object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange-soft text-primary">
            <Store className="h-7 w-7" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-card-foreground">{store.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{store.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Button
            type="button"
            variant={following ? "secondary" : "default"}
            size="sm"
            disabled={followPending}
            onClick={toggleFollow}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {following ? "Seguindo" : "Seguir"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {followerCount} {followerCount === 1 ? "seguidor" : "seguidores"}
          </span>
        </div>
      </header>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-foreground">Produtos da loja</h2>
        <ProductGrid products={products} emptyMessage="Esta loja ainda não publicou produtos." />
      </div>
    </div>
  );
}
