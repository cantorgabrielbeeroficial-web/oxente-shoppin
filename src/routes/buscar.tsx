import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { listCategories, listProducts } from "@/lib/catalog.functions";
import { ProductGrid } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchParams = z.infer<typeof searchSchema>;

const searchSchema = z.object({
  q: z.string().catch(""),
  categoria: z.string().optional().catch(undefined),
  ordem: z.enum(["recentes", "menor-preco", "maior-preco"]).catch("recentes"),
  canal: z.enum(["bodega", "interligada"]).optional().catch(undefined),
});

export const Route = createFileRoute("/buscar")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Buscar produtos — Oxente" },
      {
        name: "description",
        content: "Encontre produtos de todas as lojas do marketplace Oxente.",
      },
      { property: "og:title", content: "Buscar produtos — Oxente" },
      { property: "og:description", content: "Busque por nome, categoria e preço no Oxente." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, categoria, ordem, canal } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
  });

  const { data: products, isPending } = useQuery({
    queryKey: ["products", "search", q, categoria, ordem, canal],
    queryFn: () =>
      listProducts({
        data: {
          search: q || undefined,
          categorySlug: categoria,
          storeKind: canal,
          sort: ordem,
          limit: 60,
        },
      }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-xl font-bold text-foreground">
        {q ? `Resultados para "${q}"` : "Todos os produtos"}
      </h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <Select
          value={categoria ?? "todas"}
          onValueChange={(value) =>
            navigate({
              search: (prev: SearchParams) => ({
                ...prev,
                categoria: value === "todas" ? undefined : value,
              }),
            })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={ordem}
          onValueChange={(value) =>
            navigate({
              search: (prev: SearchParams) => ({
                ...prev,
                ordem: value as "recentes" | "menor-preco" | "maior-preco",
              }),
            })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recentes">Mais recentes</SelectItem>
            <SelectItem value="menor-preco">Menor preço</SelectItem>
            <SelectItem value="maior-preco">Maior preço</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="h-64 w-full" />
            ))}
          </div>
        ) : (
          <ProductGrid
            products={products ?? []}
            emptyMessage="Nada encontrado. Tente outra busca."
          />
        )}
      </div>
    </div>
  );
}
