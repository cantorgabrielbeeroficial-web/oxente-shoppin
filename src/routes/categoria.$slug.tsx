import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { listCategories, listProducts } from "@/lib/catalog.functions";
import { ProductGrid } from "@/components/product-card";

const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategories(),
});

const categorySearchSchema = z.object({
  canal: z.enum(["bodega", "interligada"]).optional().catch(undefined),
});

const productsBySlug = (slug: string, canal?: "bodega" | "interligada") =>
  queryOptions({
    queryKey: ["products", "categoria", slug, canal],
    queryFn: () =>
      listProducts({ data: { categorySlug: slug, storeKind: canal, sort: "recentes", limit: 60 } }),
  });

export const Route = createFileRoute("/categoria/$slug")({
  validateSearch: categorySearchSchema,
  loader: async ({ params, context }) => {
    const categories = await context.queryClient.ensureQueryData(categoriesQuery);
    const category = categories.find((item) => item.slug === params.slug);
    if (!category) throw notFound();
    return { categoryName: category.name };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Categoria indisponível — Oxente" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.categoryName} — Oxente`;
    const description = `Produtos de ${loaderData.categoryName} das lojas do marketplace Oxente.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">Categoria não encontrada</h1>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">
        Voltar para a home
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
      Não foi possível carregar esta categoria agora.
    </div>
  ),
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { canal } = Route.useSearch();
  const { categoryName } = Route.useLoaderData();
  const { data: products } = useSuspenseQuery(productsBySlug(slug, canal));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-xl font-bold text-foreground">{categoryName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{products.length} produto(s) disponíveis</p>
      <div className="mt-6">
        <ProductGrid products={products} emptyMessage="Ainda não há produtos nesta categoria." />
      </div>
    </div>
  );
}
