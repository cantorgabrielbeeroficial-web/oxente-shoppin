import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Address, CartItem, Order, SessionInfo } from "./types";
const PRODUCT_SELECT =
  "id, name, price, stock, image_url, created_at, category_id, store:stores(id, name, slug, logo_url, store_kind)";

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
    store_kind: "bodega" | "interligada";
  } | null;
};

function mapProduct(row: RawProduct) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    stock: row.stock,
    image_url: row.image_url,
    created_at: row.created_at,
    category_id: row.category_id,
    store: row.store ?? { id: "", name: "Loja", slug: "", logo_url: null, store_kind: "bodega" },
  };
}

export const getSessionInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SessionInfo> => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }, { data: store }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("stores").select("slug").eq("owner_id", userId).maybeSingle(),
    ]);
    const roleList = (roles ?? []).map((r) => r.role);
    return {
      userId,
      profile: profile ?? null,
      isAdmin: roleList.includes("admin"),
      isSeller: roleList.includes("seller"),
      storeSlug: store?.slug ?? null,
    };
  });

export const listCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CartItem[]> => {
    const { data, error } = await context.supabase
      .from("cart_items")
      .select(`id, quantity, product:products(${PRODUCT_SELECT})`)
      .eq("user_id", context.userId)
      .order("added_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (
      (data ?? []) as unknown as { id: string; quantity: number; product: RawProduct | null }[]
    )
      .filter((row) => row.product !== null)
      .map((row) => ({
        id: row.id,
        quantity: row.quantity,
        product: mapProduct(row.product as RawProduct),
      }));
  });

export const cartCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<number> => {
    const { data } = await context.supabase
      .from("cart_items")
      .select("quantity")
      .eq("user_id", context.userId);
    return (data ?? []).reduce((sum, row) => sum + row.quantity, 0);
  });

export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", data.productId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: Math.min(existing.quantity + data.quantity, 99) })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("cart_items")
        .insert({ user_id: userId, product_id: data.productId, quantity: data.quantity });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const updateCartItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ itemId: z.string().uuid(), quantity: z.number().int().min(0).max(99) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.quantity === 0) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", data.itemId)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: data.quantity })
      .eq("id", data.itemId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAddresses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Address[]> => {
    const { data, error } = await context.supabase
      .from("addresses")
      .select(
        "id, label, recipient_name, street, number, complement, district, city, state, zip_code, is_default",
      )
      .eq("user_id", context.userId)
      .order("is_default", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const addressInput = z.object({
  label: z.string().trim().min(1).max(40),
  recipient_name: z.string().trim().min(2).max(120),
  street: z.string().trim().min(2).max(160),
  number: z.string().trim().min(1).max(20),
  complement: z.string().trim().max(120).optional(),
  district: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(2),
  zip_code: z.string().trim().min(8).max(9),
  is_default: z.boolean().default(true),
});

export const createAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => addressInput.parse(input))
  .handler(async ({ data, context }): Promise<Address> => {
    const { supabase, userId } = context;
    if (data.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
    }
    const { data: row, error } = await supabase
      .from("addresses")
      .insert({ ...data, complement: data.complement ?? null, user_id: userId })
      .select(
        "id, label, recipient_name, street, number, complement, district, city, state, zip_code, is_default",
      )
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        addressId: z.string().uuid(),
        creditsToUse: z.number().min(0).default(0),
        idempotencyKey: z.string().uuid().optional(),
      })
      .parse(input),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      orderIds: string[];
      creditsUsed: number;
      cashbackEarned: number;
      platformFee: number;
      sellerNet: number;
    }> => {
      const { supabase, userId } = context;

      const { data: address } = await supabase
        .from("addresses")
        .select("*")
        .eq("id", data.addressId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!address) throw new Error("Endereço não encontrado.");

      const { data: cart } = await supabase
        .from("cart_items")
        .select("id, quantity, product:products(id, name, price, stock, store_id)")
        .eq("user_id", userId);

      const items = (
        (cart ?? []) as unknown as {
          id: string;
          quantity: number;
          product: {
            id: string;
            name: string;
            price: number;
            stock: number;
            store_id: string;
          } | null;
        }[]
      ).filter((row) => row.product !== null);

      if (items.length === 0) throw new Error("Seu carrinho está vazio.");
      const { data: result, error } = await supabase.rpc("place_order_transactional", {
        p_items: items.map((item) => ({
          product_id: item.product!.id,
          quantity: item.quantity,
        })),
        p_shipping_address: address,
        p_idempotency_key: data.idempotencyKey ?? crypto.randomUUID(),
        p_credits_to_use: data.creditsToUse,
      });
      if (error) throw new Error(`Falha ao processar o pedido: ${error.message}`);

      return result as {
        orderIds: string[];
        creditsUsed: number;
        cashbackEarned: number;
        platformFee: number;
        sellerNet: number;
      };
    },
  );

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Order[]> => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id, store_id, buyer_id, status, total, platform_fee, seller_net, credits_applied, payout_status, shipping_recipient, shipping_address, created_at, store:stores(id, name, slug, logo_url), items:order_items(id, product_id, product_name, quantity, unit_price)",
      )
      .eq("buyer_id", context.userId)
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
