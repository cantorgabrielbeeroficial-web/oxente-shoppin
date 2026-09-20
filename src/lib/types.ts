export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type StoreKind = "bodega" | "interligada";

export type StoreSummary = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  store_kind: StoreKind;
};

export type ProductListItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  created_at: string;
  category_id: string | null;
  store: StoreSummary;
};

export type ProductDetail = ProductListItem & {
  description: string;
  category: { id: string; name: string; slug: string } | null;
};

export type Store = StoreSummary & {
  description: string;
  banner_url: string | null;
  active: boolean;
  created_at: string;
  store_kind: StoreKind;
};

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

export type Address = {
  id: string;
  label: string;
  recipient_name: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
};

export type CartItem = {
  id: string;
  quantity: number;
  product: ProductListItem;
};

export type OrderStatus = "pendente" | "confirmado" | "paid" | "enviado" | "entregue" | "cancelado";

export type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
};

export type PayoutStatus = "pendente" | "processando" | "repassado" | "cancelado";

export type Order = {
  id: string;
  store_id: string;
  buyer_id: string;
  status: OrderStatus;
  total: number;
  platform_fee: number;
  seller_net: number;
  credits_applied: number;
  payout_status: PayoutStatus;
  shipping_recipient: string;
  shipping_address: string;
  created_at: string;
  store: StoreSummary | null;
  items: OrderItem[];
};

export type SessionInfo = {
  userId: string;
  profile: Profile | null;
  isAdmin: boolean;
  isSeller: boolean;
  storeSlug: string | null;
};

export type SellerStore = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  active: boolean;
  created_at: string;
};

export type SellerProduct = {
  id: string;
  store_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  images: string[];
  active: boolean;
  category_id: string | null;
  weight_kg: number;
  height_cm: number;
  width_cm: number;
  length_cm: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variations: any[];
  created_at: string;
};
