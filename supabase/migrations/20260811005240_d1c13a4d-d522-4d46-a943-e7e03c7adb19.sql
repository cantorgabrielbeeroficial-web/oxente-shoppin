-- 1. Split columns on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS platform_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_net numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_applied numeric NOT NULL DEFAULT 0;

CREATE TYPE public.payout_status AS ENUM ('pendente', 'processando', 'repassado', 'cancelado');

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payout_status public.payout_status NOT NULL DEFAULT 'pendente';

-- 2. Payouts (seller subaccount ledger)
CREATE TABLE public.payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  gross_amount numeric NOT NULL,
  platform_fee numeric NOT NULL,
  net_amount numeric NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'pendente',
  provider_transfer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers read own store payouts" ON public.payouts
  FOR SELECT TO authenticated USING (public.owns_store(store_id));
CREATE POLICY "Buyers create payouts for own orders" ON public.payouts
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = payouts.order_id AND o.buyer_id = auth.uid()
  ));
CREATE POLICY "Admins manage all payouts" ON public.payouts
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX payouts_store_id_idx ON public.payouts(store_id);
CREATE INDEX payouts_order_id_idx ON public.payouts(order_id);

-- 3. Loyalty accounts
CREATE TYPE public.hat_tier AS ENUM ('bronze', 'prata', 'ouro');

CREATE TABLE public.loyalty_accounts (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  tier public.hat_tier NOT NULL DEFAULT 'bronze',
  last_checkin_date date,
  checkin_streak integer NOT NULL DEFAULT 0,
  referral_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.loyalty_accounts TO authenticated;
GRANT ALL ON public.loyalty_accounts TO service_role;
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own loyalty account" ON public.loyalty_accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own loyalty account" ON public.loyalty_accounts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all loyalty accounts" ON public.loyalty_accounts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. Loyalty transactions
CREATE TABLE public.loyalty_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  reason text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.loyalty_transactions TO authenticated;
GRANT ALL ON public.loyalty_transactions TO service_role;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own loyalty transactions" ON public.loyalty_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all loyalty transactions" ON public.loyalty_transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX loyalty_transactions_user_idx ON public.loyalty_transactions(user_id, created_at DESC);

-- 5. updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM public, anon, authenticated;

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loyalty_accounts_updated_at BEFORE UPDATE ON public.loyalty_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Server-side credit helpers (security definer, service/admin only execution)
CREATE OR REPLACE FUNCTION public.loyalty_apply_credits(_user_id uuid, _amount numeric, _reason text, _order_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _balance numeric;
BEGIN
  INSERT INTO public.loyalty_accounts (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO _balance FROM public.loyalty_accounts WHERE user_id = _user_id FOR UPDATE;

  IF _amount < 0 AND _balance + _amount < 0 THEN
    RAISE EXCEPTION 'Saldo de créditos insuficiente';
  END IF;

  UPDATE public.loyalty_accounts
    SET balance = balance + _amount
    WHERE user_id = _user_id
    RETURNING balance INTO _balance;

  INSERT INTO public.loyalty_transactions (user_id, amount, reason, order_id)
  VALUES (_user_id, _amount, _reason, _order_id);

  RETURN _balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.loyalty_apply_credits(uuid, numeric, text, uuid) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.loyalty_register_spend(_user_id uuid, _amount numeric)
RETURNS public.hat_tier
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total numeric;
  _tier public.hat_tier;
BEGIN
  INSERT INTO public.loyalty_accounts (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.loyalty_accounts
    SET total_spent = total_spent + _amount
    WHERE user_id = _user_id
    RETURNING total_spent INTO _total;

  _tier := CASE
    WHEN _total >= 2000 THEN 'ouro'::public.hat_tier
    WHEN _total >= 500 THEN 'prata'::public.hat_tier
    ELSE 'bronze'::public.hat_tier
  END;

  UPDATE public.loyalty_accounts SET tier = _tier WHERE user_id = _user_id;
  RETURN _tier;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.loyalty_register_spend(uuid, numeric) FROM public, anon, authenticated;