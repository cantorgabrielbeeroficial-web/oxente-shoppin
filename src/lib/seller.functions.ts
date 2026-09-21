import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Order, ProductListItem, SellerProduct, SellerStore } from "./types";

const STORE_SELECT = "id, name, slug, description, logo_url, banner_url, active, created_at";
const PRODUCT_SELECT =
  "id, name, description, price, stock, image_url, images, active, category_id, created_at, store_id, weight_kg, height_cm, width_cm, length_cm, variations";

export const getMyStore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SellerStore | null> => {
    const { data, error } = await context.supabase
      .from("stores")
      .select(STORE_SELECT)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as SellerStore | null) ?? null;
  });

export const createMyStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        description: z.string().trim().min(2).max(600),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<SellerStore> => {
    const { data: row, error } = await context.supabase.rpc("create_my_store", {
      _name: data.name,
      _description: data.description,
    });
    if (error) throw new Error(error.message);
    const store = row as unknown as SellerStore;
    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      logo_url: store.logo_url,
      banner_url: store.banner_url,
      active: store.active,
      created_at: store.created_at,
    };
  });

export const updateMyStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(80).optional(),
        description: z.string().trim().max(600).optional(),
        logo_url: z.string().url().max(2000).nullable().optional(),
        banner_url: z.string().url().max(2000).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<SellerStore> => {
    const patch: {
      name?: string;
      description?: string;
      logo_url?: string | null;
      banner_url?: string | null;
    } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.logo_url !== undefined) patch.logo_url = data.logo_url;
    if (data.banner_url !== undefined) patch.banner_url = data.banner_url;
    const { data: row, error } = await context.supabase
      .from("stores")
      .update(patch)
      .eq("owner_id", context.userId)
      .select(STORE_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return row as SellerStore;
  });

export const listMyProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SellerProduct[]> => {
    const { data: store } = await context.supabase
      .from("stores")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!store) return [];
    const { data, error } = await context.supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as SellerProduct[]).map((row) => ({
      ...row,
      price: Number(row.price),
    }));
  });

const productInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().max(2000).default(""),
  price: z.number().min(0.01).max(1000000),
  stock: z.number().int().min(0).max(100000),
  category_id: z.string().uuid().nullable().default(null),
  image_url: z.string().url().max(2000).nullable().default(null),
  images: z.array(z.string().url()).default([]),
  active: z.boolean().default(true),
  weight_kg: z.number().min(0).default(0),
  height_cm: z.number().min(0).default(0),
  width_cm: z.number().min(0).default(0),
  length_cm: z.number().min(0).default(0),
  variations: z.array(z.any()).default([]),
});

export const upsertMyProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => productInput.parse(input))
  .handler(async ({ data, context }): Promise<SellerProduct> => {
    const { supabase, userId } = context;
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (!store) throw new Error("Crie sua loja antes de cadastrar produtos.");

    const payload = {
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      category_id: data.category_id,
      image_url: data.image_url,
      images: data.images,
      active: data.active,
      store_id: store.id,
      weight_kg: data.weight_kg,
      height_cm: data.height_cm,
      width_cm: data.width_cm,
      length_cm: data.length_cm,
      variations: data.variations,
    };

    if (data.id) {
      const { data: row, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", data.id)
        .eq("store_id", store.id)
        .select(PRODUCT_SELECT)
        .single();
      if (error) throw new Error(error.message);
      return { ...(row as unknown as SellerProduct), price: Number(row.price) };
    }

    const { data: row, error } = await supabase
      .from("products")
      .insert(payload)
      .select(PRODUCT_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return { ...(row as unknown as SellerProduct), price: Number(row.price) };
  });

export const toggleMyProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: store } = await context.supabase
      .from("stores")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!store) throw new Error("Loja não encontrada.");
    const { error } = await context.supabase
      .from("products")
      .update({ active: data.active })
      .eq("id", data.id)
      .eq("store_id", store.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyStoreOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Order[]> => {
    const { data: store } = await context.supabase
      .from("stores")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!store) return [];
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id, store_id, buyer_id, status, total, platform_fee, seller_net, credits_applied, payout_status, shipping_recipient, shipping_address, created_at, store:stores(id, name, slug, logo_url), items:order_items(id, product_id, product_name, quantity, unit_price)",
      )
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as Order[]).map((order) => ({
      ...order,
      total: Number(order.total),
      platform_fee: Number(order.platform_fee),
      seller_net: Number(order.seller_net),
      credits_applied: Number(order.credits_applied),
      items: order.items.map((item) => ({ ...item, unit_price: Number(item.unit_price) })),
    }));
  });

export const deleteMyProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: store } = await context.supabase
      .from("stores")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!store) throw new Error("Loja não encontrada.");
    const { error } = await context.supabase
      .from("products")
      .delete()
      .eq("id", data.id)
      .eq("store_id", store.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type { ProductListItem };
