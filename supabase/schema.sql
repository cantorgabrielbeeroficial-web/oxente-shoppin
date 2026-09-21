-- Oxente Shoppin - Supabase schema snapshot
-- Apply in a fresh Supabase project after the managed auth schema exists.
-- This file is a consolidated reference. Existing migrations remain the source of history.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin', 'seller', 'buyer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('pendente', 'confirmado', 'paid', 'enviado', 'entregue', 'cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payout_status AS ENUM ('pendente', 'processando', 'repassado', 'cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.hat_tier AS ENUM ('bronze', 'prata', 'ouro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Compatibility for databases created before the paid status was introduced.
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'paid';

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Casa',
  recipient_name text NOT NULL DEFAULT '',
  street text NOT NULL,
  number text NOT NULL,
  complement text,
  district text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status public.application_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  logo_url text,
  banner_url text,
  active boolean NOT NULL DEFAULT true,
  store_kind text NOT NULL DEFAULT 'interligada' CHECK (store_kind IN ('bodega', 'interligada')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS store_kind text NOT NULL DEFAULT 'interligada';

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text,
  images text[] NOT NULL DEFAULT ARRAY[]::text[],
  active boolean NOT NULL DEFAULT true,
  variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  weight_kg numeric(10,3) NOT NULL DEFAULT 0,
  height_cm numeric(10,2) NOT NULL DEFAULT 0,
  width_cm numeric(10,2) NOT NULL DEFAULT 0,
  length_cm numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variations jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_kg numeric(10,3) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS height_cm numeric(10,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS width_cm numeric(10,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS length_cm numeric(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pendente',
  total numeric(10,2) NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  seller_net numeric NOT NULL DEFAULT 0,
  credits_applied numeric NOT NULL DEFAULT 0,
  payout_status public.payout_status NOT NULL DEFAULT 'pendente',
  shipping_recipient text NOT NULL DEFAULT '',
  shipping_address text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee numeric NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_net numeric NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS credits_applied numeric NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payout_status public.payout_status NOT NULL DEFAULT 'pendente';

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  gross_amount numeric NOT NULL,
  platform_fee numeric NOT NULL,
  net_amount numeric NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'pendente',
  provider_transfer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  tier public.hat_tier NOT NULL DEFAULT 'bronze',
  last_checkin_date date,
  checkin_streak integer NOT NULL DEFAULT 0,
  referral_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  reason text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_likes (
  content_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.live_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_followers (
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_enabled boolean NOT NULL DEFAULT false,
  phone_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.checkout_idempotency (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key uuid NOT NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS products_store_id_idx ON public.products(store_id);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS orders_buyer_id_idx ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS orders_store_id_idx ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS payouts_store_id_idx ON public.payouts(store_id);
CREATE INDEX IF NOT EXISTS payouts_order_id_idx ON public.payouts(order_id);
CREATE INDEX IF NOT EXISTS loyalty_transactions_user_idx ON public.loyalty_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS video_shares_content_id_idx ON public.video_shares(content_id);
CREATE INDEX IF NOT EXISTS store_followers_user_id_idx ON public.store_followers(user_id);
CREATE INDEX IF NOT EXISTS stores_store_kind_active_idx ON public.stores(store_kind, active);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.owns_store(_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.decrement_stock(_product_id uuid, _quantity integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _quantity IS NULL OR _quantity < 1 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
  UPDATE public.products SET stock = stock - _quantity
  WHERE id = _product_id AND stock >= _quantity;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_payouts_updated_at ON public.payouts;
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_loyalty_accounts_updated_at ON public.loyalty_accounts;
CREATE TRIGGER update_loyalty_accounts_updated_at BEFORE UPDATE ON public.loyalty_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.loyalty_apply_credits(_user_id uuid, _amount numeric, _reason text, _order_id uuid)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_balance numeric;
BEGIN
  INSERT INTO public.loyalty_accounts(user_id) VALUES (_user_id) ON CONFLICT DO NOTHING;
  SELECT balance INTO v_balance FROM public.loyalty_accounts WHERE user_id = _user_id FOR UPDATE;
  IF _amount < 0 AND v_balance + _amount < 0 THEN RAISE EXCEPTION 'Insufficient credits'; END IF;
  UPDATE public.loyalty_accounts SET balance = balance + _amount WHERE user_id = _user_id RETURNING balance INTO v_balance;
  INSERT INTO public.loyalty_transactions(user_id, amount, reason, order_id) VALUES (_user_id, _amount, _reason, _order_id);
  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.loyalty_register_spend(_user_id uuid, _amount numeric)
RETURNS public.hat_tier LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_total numeric; v_tier public.hat_tier;
BEGIN
  INSERT INTO public.loyalty_accounts(user_id) VALUES (_user_id) ON CONFLICT DO NOTHING;
  UPDATE public.loyalty_accounts SET total_spent = total_spent + _amount WHERE user_id = _user_id RETURNING total_spent INTO v_total;
  v_tier := CASE WHEN v_total >= 2000 THEN 'ouro'::public.hat_tier WHEN v_total >= 500 THEN 'prata'::public.hat_tier ELSE 'bronze'::public.hat_tier END;
  UPDATE public.loyalty_accounts SET tier = v_tier WHERE user_id = _user_id;
  RETURN v_tier;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_my_store(_name text, _description text)
RETURNS public.stores LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_slug text; v_base text; v_n integer := 0; v_store public.stores;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_store FROM public.stores WHERE owner_id = v_uid LIMIT 1;
  IF v_store.id IS NOT NULL THEN RETURN v_store; END IF;
  v_base := trim(both '-' from regexp_replace(lower(trim(coalesce(_name, ''))), '[^a-z0-9]+', '-', 'g'));
  IF v_base = '' THEN v_base := 'loja'; END IF;
  v_slug := v_base;
  WHILE EXISTS (SELECT 1 FROM public.stores WHERE slug = v_slug) LOOP v_n := v_n + 1; v_slug := v_base || '-' || v_n; END LOOP;
  INSERT INTO public.stores(owner_id, name, slug, description) VALUES (v_uid, trim(_name), v_slug, coalesce(_description, '')) RETURNING * INTO v_store;
  INSERT INTO public.user_roles(user_id, role) VALUES (v_uid, 'seller') ON CONFLICT DO NOTHING;
  RETURN v_store;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, avatar_url)
  VALUES (NEW.id, coalesce(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.raw_user_meta_data ->> 'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, 'buyer') ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.place_order_transactional(
  p_items jsonb,
  p_shipping_address jsonb,
  p_idempotency_key uuid,
  p_credits_to_use numeric DEFAULT 0
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing jsonb;
  v_total numeric;
  v_balance numeric;
  v_spent numeric;
  v_credits numeric;
  v_paid numeric;
  v_cashback numeric;
  v_fee numeric := 0;
  v_net numeric := 0;
  v_first_order uuid;
  v_order_id uuid;
  v_order_ids jsonb := '[]'::jsonb;
  v_item record;
  v_store record;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Cart is empty'; END IF;

  INSERT INTO public.checkout_idempotency(user_id, idempotency_key)
  VALUES (v_user_id, p_idempotency_key) ON CONFLICT DO NOTHING;
  SELECT result INTO v_existing FROM public.checkout_idempotency
  WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key FOR UPDATE;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  FOR v_item IN SELECT r.product_id, sum(r.quantity)::integer quantity
    FROM jsonb_to_recordset(p_items) r(product_id uuid, quantity integer) GROUP BY r.product_id
  LOOP
    IF v_item.quantity < 1 OR v_item.quantity > 99 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    PERFORM 1 FROM public.products p JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = v_item.product_id AND p.active AND s.active AND p.stock >= v_item.quantity FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product unavailable or insufficient stock'; END IF;
  END LOOP;

  SELECT round(sum(p.price * r.quantity), 2) INTO v_total
  FROM jsonb_to_recordset(p_items) r(product_id uuid, quantity integer) JOIN public.products p ON p.id = r.product_id;
  IF v_total IS NULL OR v_total <= 0 THEN RAISE EXCEPTION 'Invalid order total'; END IF;
  INSERT INTO public.loyalty_accounts(user_id) VALUES (v_user_id) ON CONFLICT DO NOTHING;
  SELECT balance, total_spent INTO v_balance, v_spent FROM public.loyalty_accounts WHERE user_id = v_user_id FOR UPDATE;
  v_credits := round(least(greatest(coalesce(p_credits_to_use, 0), 0), v_balance, v_total * 0.5), 2);
  v_paid := round(v_total - v_credits, 2);
  v_cashback := round(v_paid * CASE WHEN v_spent + v_paid >= 2000 THEN 0.05 WHEN v_spent + v_paid >= 500 THEN 0.03 ELSE 0.01 END, 2);

  FOR v_store IN SELECT p.store_id, round(sum(p.price * r.quantity), 2) total
    FROM jsonb_to_recordset(p_items) r(product_id uuid, quantity integer) JOIN public.products p ON p.id = r.product_id GROUP BY p.store_id
  LOOP
    v_fee := v_fee + round(v_store.total * 0.12, 2); v_net := v_net + round(v_store.total * 0.88, 2);
    INSERT INTO public.orders(buyer_id, store_id, total, platform_fee, seller_net, credits_applied, shipping_recipient, shipping_address)
    VALUES (v_user_id, v_store.store_id, v_store.total, round(v_store.total * 0.12, 2), round(v_store.total * 0.88, 2), round(v_credits * v_store.total / v_total, 2), p_shipping_address->>'recipient_name',
      concat_ws(' | ', concat_ws(', ', p_shipping_address->>'street', p_shipping_address->>'number'), concat_ws(' - ', p_shipping_address->>'district', p_shipping_address->>'city'), concat_ws('/', p_shipping_address->>'state', p_shipping_address->>'zip_code')))
    RETURNING id INTO v_order_id;
    IF v_first_order IS NULL THEN v_first_order := v_order_id; END IF;
    v_order_ids := v_order_ids || to_jsonb(v_order_id);
    INSERT INTO public.payouts(order_id, store_id, gross_amount, platform_fee, net_amount)
    VALUES (v_order_id, v_store.store_id, v_store.total, round(v_store.total * 0.12, 2), round(v_store.total * 0.88, 2));
    INSERT INTO public.order_items(order_id, product_id, product_name, quantity, unit_price)
    SELECT v_order_id, p.id, p.name, r.quantity, p.price FROM jsonb_to_recordset(p_items) r(product_id uuid, quantity integer) JOIN public.products p ON p.id = r.product_id WHERE p.store_id = v_store.store_id;
    UPDATE public.products p SET stock = p.stock - r.quantity FROM jsonb_to_recordset(p_items) r(product_id uuid, quantity integer) WHERE p.id = r.product_id AND p.store_id = v_store.store_id;
  END LOOP;
  DELETE FROM public.cart_items WHERE user_id = v_user_id AND product_id IN (SELECT r.product_id FROM jsonb_to_recordset(p_items) r(product_id uuid, quantity integer));
  IF v_credits > 0 THEN PERFORM public.loyalty_apply_credits(v_user_id, -v_credits, 'Credits used in order', v_first_order); END IF;
  PERFORM public.loyalty_register_spend(v_user_id, v_paid);
  IF v_cashback > 0 THEN PERFORM public.loyalty_apply_credits(v_user_id, v_cashback, 'Order cashback', v_first_order); END IF;
  v_result := jsonb_build_object('orderIds', v_order_ids, 'creditsUsed', v_credits, 'cashbackEarned', v_cashback, 'platformFee', v_fee, 'sellerNet', v_net);
  UPDATE public.checkout_idempotency SET result = v_result WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;
  RETURN v_result;
END;
$$;

-- RLS and policies. Policies are recreated so this section is rerunnable.
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN
    ('user_roles','profiles','addresses','seller_applications','stores','categories','products','cart_items','orders','order_items','payouts','loyalty_accounts','loyalty_transactions','video_likes','live_comments','video_shares','store_followers','notification_preferences','checkout_idempotency')
  LOOP EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename); END LOOP;
END $$;

DROP POLICY IF EXISTS "public_read_active_stores" ON public.stores;
CREATE POLICY "public_read_active_stores" ON public.stores FOR SELECT TO anon, authenticated USING (active OR owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "owners_update_stores" ON public.stores;
CREATE POLICY "owners_update_stores" ON public.stores FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "users_read_roles" ON public.user_roles;
CREATE POLICY "users_read_roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "users_manage_seller_applications" ON public.seller_applications;
CREATE POLICY "users_manage_seller_applications" ON public.seller_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users_read_seller_applications" ON public.seller_applications;
CREATE POLICY "users_read_seller_applications" ON public.seller_applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "admins_update_seller_applications" ON public.seller_applications;
CREATE POLICY "admins_update_seller_applications" ON public.seller_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_read_active_products" ON public.products;
CREATE POLICY "public_read_active_products" ON public.products FOR SELECT TO anon, authenticated USING (active AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.active));
DROP POLICY IF EXISTS "owners_manage_products" ON public.products;
CREATE POLICY "owners_manage_products" ON public.products FOR ALL TO authenticated USING (public.owns_store(store_id) OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.owns_store(store_id) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "users_manage_cart" ON public.cart_items;
CREATE POLICY "users_manage_cart" ON public.cart_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users_read_own_orders" ON public.orders;
CREATE POLICY "users_read_own_orders" ON public.orders FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR public.owns_store(store_id) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "users_read_payouts" ON public.payouts;
CREATE POLICY "users_read_payouts" ON public.payouts FOR SELECT TO authenticated USING (public.owns_store(store_id) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "users_read_order_items" ON public.order_items;
CREATE POLICY "users_read_order_items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR public.owns_store(o.store_id) OR public.has_role(auth.uid(), 'admin'))));
DROP POLICY IF EXISTS "users_manage_addresses" ON public.addresses;
CREATE POLICY "users_manage_addresses" ON public.addresses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users_read_profile" ON public.profiles;
CREATE POLICY "users_read_profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "users_update_profile" ON public.profiles;
CREATE POLICY "users_update_profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "users_read_loyalty" ON public.loyalty_accounts;
CREATE POLICY "users_read_loyalty" ON public.loyalty_accounts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "users_create_loyalty" ON public.loyalty_accounts;
CREATE POLICY "users_create_loyalty" ON public.loyalty_accounts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users_read_loyalty_transactions" ON public.loyalty_transactions;
CREATE POLICY "users_read_loyalty_transactions" ON public.loyalty_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "public_read_likes" ON public.video_likes;
CREATE POLICY "public_read_likes" ON public.video_likes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "users_create_likes" ON public.video_likes;
CREATE POLICY "users_create_likes" ON public.video_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users_delete_likes" ON public.video_likes;
CREATE POLICY "users_delete_likes" ON public.video_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "public_read_comments" ON public.live_comments;
CREATE POLICY "public_read_comments" ON public.live_comments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "users_create_comments" ON public.live_comments;
CREATE POLICY "users_create_comments" ON public.live_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users_delete_comments" ON public.live_comments;
CREATE POLICY "users_delete_comments" ON public.live_comments FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "public_read_shares" ON public.video_shares;
CREATE POLICY "public_read_shares" ON public.video_shares FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anyone_create_shares" ON public.video_shares;
CREATE POLICY "anyone_create_shares" ON public.video_shares FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
DROP POLICY IF EXISTS "public_read_followers" ON public.store_followers;
CREATE POLICY "public_read_followers" ON public.store_followers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "users_manage_followers" ON public.store_followers;
CREATE POLICY "users_manage_followers" ON public.store_followers FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users_manage_notification_preferences" ON public.notification_preferences;
CREATE POLICY "users_manage_notification_preferences" ON public.notification_preferences FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT SELECT ON public.categories, public.stores, public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
REVOKE ALL ON public.checkout_idempotency FROM anon, authenticated;
GRANT ALL ON public.checkout_idempotency TO service_role;
REVOKE ALL ON FUNCTION public.loyalty_apply_credits(uuid, numeric, text, uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.loyalty_register_spend(uuid, numeric) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.place_order_transactional(jsonb, jsonb, uuid, numeric) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.loyalty_apply_credits(uuid, numeric, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.loyalty_register_spend(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.place_order_transactional(jsonb, jsonb, uuid, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_my_store(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO authenticated, service_role;

-- Storage buckets expected by the application.
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880, allowed_mime_types = EXCLUDED.allowed_mime_types;
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('store-assets', 'store-assets', false, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime','video/x-m4v'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 52428800, allowed_mime_types = EXCLUDED.allowed_mime_types;
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "oxente_public_product_images" ON storage.objects;
CREATE POLICY "oxente_public_product_images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "oxente_own_product_images_insert" ON storage.objects;
CREATE POLICY "oxente_own_product_images_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "oxente_own_product_images_delete" ON storage.objects;
CREATE POLICY "oxente_own_product_images_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "oxente_public_avatars" ON storage.objects;
CREATE POLICY "oxente_public_avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "oxente_own_avatars_insert" ON storage.objects;
CREATE POLICY "oxente_own_avatars_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND name LIKE auth.uid()::text || '/%');
DROP POLICY IF EXISTS "oxente_public_store_assets" ON storage.objects;
CREATE POLICY "oxente_public_store_assets" ON storage.objects FOR SELECT USING (bucket_id = 'store-assets');

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.video_likes, public.live_comments;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
