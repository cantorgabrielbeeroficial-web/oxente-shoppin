import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { Category, ProductDetail, ProductListItem, Store, StoreKind } from "./types";

const PRODUCT_SELECT =
  "id, name, price, stock, image_url, created_at, category_id, store:stores!inner(id, name, slug, logo_url, active, store_kind)";

function publicClient() {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase público não está configurado.");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

type RawProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  created_at: string;
  category_id: string | null;
  store: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    store_kind: StoreKind;
  } | null;
};

function mapProduct(row: RawProduct): ProductListItem {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    stock: row.stock,
    image_url: row.image_url,
    created_at: row.created_at,
    category_id: row.category_id,
    store: row.store
      ? {
          id: row.store.id,
          name: row.store.name,
          slug: row.store.slug,
          logo_url: row.store.logo_url,
          store_kind: row.store.store_kind,
        }
      : { id: "", name: "Loja", slug: "", logo_url: null, store_kind: "bodega" },
  };
}

export const listCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<Category[]> => {
    const { data, error } = await publicClient()
      .from("categories")
      .select("id, name, slug, sort_order")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

const listProductsInput = z.object({
  search: z.string().trim().max(120).optional(),
  categorySlug: z.string().trim().max(80).optional(),
  storeSlug: z.string().trim().max(80).optional(),
  storeKind: z.enum(["bodega", "interligada"]).optional(),
  sort: z.enum(["recentes", "menor-preco", "maior-preco"]).default("recentes"),
  limit: z.number().int().min(1).max(60).default(24),
});

export const listProducts = createServerFn({ method: "GET" })
  .validator((input: unknown) => listProductsInput.parse(input ?? {}))
  .handler(async ({ data }): Promise<ProductListItem[]> => {
    const supabase = publicClient();

    let categoryId: string | null = null;
    if (data.categorySlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (!cat) return [];
      categoryId = cat.id;
    }

    let query = supabase.from("products").select(PRODUCT_SELECT).eq("active", true);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (data.storeSlug) query = query.eq("stores.slug", data.storeSlug);
    if (data.storeKind) query = query.eq("stores.store_kind", data.storeKind);
    if (data.search) query = query.ilike("name", `%${data.search}%`);

    if (data.sort === "menor-preco") query = query.order("price", { ascending: true });
    else if (data.sort === "maior-preco") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data: rows, error } = await query.limit(data.limit);
    if (error) throw new Error(error.message);
    return ((rows ?? []) as unknown as RawProduct[]).map(mapProduct);
  });

export const getProduct = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(
    async ({ data }): Promise<{ product: ProductDetail; related: ProductListItem[] } | null> => {
      const supabase = publicClient();
      const { data: row, error } = await supabase
        .from("products")
        .select(`${PRODUCT_SELECT}, description, category:categories(id, name, slug)`)
        .eq("id", data.id)
        .eq("active", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return null;

      const raw = row as unknown as RawProduct & {
        description: string;
        category: { id: string; name: string; slug: string } | null;
      };
      const product: ProductDetail = {
        ...mapProduct(raw),
        description: raw.description,
        category: raw.category,
      };

      let related: ProductListItem[] = [];
      if (product.category_id) {
        const { data: rel } = await supabase
          .from("products")
          .select(PRODUCT_SELECT)
          .eq("active", true)
          .eq("category_id", product.category_id)
          .neq("id", product.id)
          .limit(6);
        related = ((rel ?? []) as unknown as RawProduct[]).map(mapProduct);
      }

      return { product, related };
    },
  );

export const getStore = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ slug: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data }): Promise<{ store: Store; products: ProductListItem[] } | null> => {
    const supabase = publicClient();
    const { data: store, error } = await supabase
      .from("stores")
      .select("id, name, slug, logo_url, banner_url, description, active, created_at, store_kind")
      .eq("slug", data.slug)
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!store) return null;

    const { data: rows } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("active", true)
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(48);

    return {
      store: store as Store,
      products: ((rows ?? []) as unknown as RawProduct[]).map(mapProduct),
    };
  });
