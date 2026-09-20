CREATE TABLE public.checkout_idempotency (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key uuid NOT NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, idempotency_key)
);

ALTER TABLE public.checkout_idempotency ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.checkout_idempotency FROM anon, authenticated;
GRANT ALL ON public.checkout_idempotency TO service_role;

CREATE OR REPLACE FUNCTION public.place_order_transactional(
  p_items jsonb,
  p_shipping_address jsonb,
  p_idempotency_key uuid,
  p_credits_to_use numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing jsonb;
  v_address_line text;
  v_recipient text;
  v_grand_total numeric := 0;
  v_balance numeric := 0;
  v_total_spent numeric := 0;
  v_credits_used numeric := 0;
  v_paid_amount numeric := 0;
  v_cashback numeric := 0;
  v_platform_fee numeric := 0;
  v_seller_net numeric := 0;
  v_tier public.hat_tier;
  v_first_order_id uuid;
  v_order_id uuid;
  v_order_ids jsonb := '[]'::jsonb;
  v_store record;
  v_item record;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'O carrinho está vazio';
  END IF;

  INSERT INTO public.checkout_idempotency (user_id, idempotency_key)
  VALUES (v_user_id, p_idempotency_key)
  ON CONFLICT (user_id, idempotency_key) DO NOTHING;

  SELECT result INTO v_existing
  FROM public.checkout_idempotency
  WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key
  FOR UPDATE;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  v_recipient := coalesce(nullif(p_shipping_address->>'recipient_name', ''), '');
  v_address_line := concat_ws(
    ' | ',
    concat_ws(', ', nullif(p_shipping_address->>'street', ''), nullif(p_shipping_address->>'number', '')),
    concat_ws(' - ', nullif(p_shipping_address->>'district', ''), nullif(p_shipping_address->>'city', '')),
    concat_ws('/', nullif(p_shipping_address->>'state', ''), nullif(p_shipping_address->>'zip_code', ''))
  );

  IF v_recipient = '' OR v_address_line = '' THEN
    RAISE EXCEPTION 'Endereço de entrega inválido';
  END IF;

  -- Lock all requested products before calculating totals or creating orders.
  FOR v_item IN
    SELECT r.product_id, sum(r.quantity)::integer AS quantity
    FROM jsonb_to_recordset(p_items) AS r(product_id uuid, quantity integer)
    GROUP BY r.product_id
  LOOP
    IF v_item.quantity IS NULL OR v_item.quantity < 1 OR v_item.quantity > 99 THEN
      RAISE EXCEPTION 'Quantidade de produto inválida';
    END IF;

    PERFORM 1
    FROM public.products p
    JOIN public.stores s ON s.id = p.store_id AND s.active = true
    WHERE p.id = v_item.product_id
      AND p.active = true
      AND p.stock >= v_item.quantity
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto indisponível ou estoque insuficiente';
    END IF;
  END LOOP;

  SELECT round(sum(p.price * r.quantity), 2)
  INTO v_grand_total
  FROM jsonb_to_recordset(p_items) AS r(product_id uuid, quantity integer)
  JOIN public.products p ON p.id = r.product_id;

  IF v_grand_total IS NULL OR v_grand_total <= 0 THEN
    RAISE EXCEPTION 'Total do pedido inválido';
  END IF;

  INSERT INTO public.loyalty_accounts (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance, total_spent
  INTO v_balance, v_total_spent
  FROM public.loyalty_accounts
  WHERE user_id = v_user_id
  FOR UPDATE;

  v_credits_used := round(least(greatest(coalesce(p_credits_to_use, 0), 0), v_balance, v_grand_total * 0.5), 2);
  v_paid_amount := round(v_grand_total - v_credits_used, 2);
  v_tier := CASE
    WHEN v_total_spent + v_paid_amount >= 2000 THEN 'ouro'::public.hat_tier
    WHEN v_total_spent + v_paid_amount >= 500 THEN 'prata'::public.hat_tier
    ELSE 'bronze'::public.hat_tier
  END;
  v_cashback := round(v_paid_amount * CASE v_tier WHEN 'ouro' THEN 0.05 WHEN 'prata' THEN 0.03 ELSE 0.01 END, 2);

  FOR v_store IN
    SELECT p.store_id, round(sum(p.price * r.quantity), 2) AS total
    FROM jsonb_to_recordset(p_items) AS r(product_id uuid, quantity integer)
    JOIN public.products p ON p.id = r.product_id
    GROUP BY p.store_id
  LOOP
    v_platform_fee := v_platform_fee + round(v_store.total * 0.12, 2);
    v_seller_net := v_seller_net + round(v_store.total * 0.88, 2);

    INSERT INTO public.orders (
      buyer_id, store_id, total, platform_fee, seller_net, credits_applied,
      shipping_recipient, shipping_address
    )
    VALUES (
      v_user_id,
      v_store.store_id,
      v_store.total,
      round(v_store.total * 0.12, 2),
      round(v_store.total * 0.88, 2),
      CASE WHEN v_grand_total > 0 THEN round(v_credits_used * v_store.total / v_grand_total, 2) ELSE 0 END,
      v_recipient,
      v_address_line
    )
    RETURNING id INTO v_order_id;

    IF v_first_order_id IS NULL THEN
      v_first_order_id := v_order_id;
    END IF;
    v_order_ids := v_order_ids || to_jsonb(v_order_id);

    INSERT INTO public.payouts (order_id, store_id, gross_amount, platform_fee, net_amount)
    VALUES (v_order_id, v_store.store_id, v_store.total, round(v_store.total * 0.12, 2), round(v_store.total * 0.88, 2));

    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price)
    SELECT v_order_id, p.id, p.name, r.quantity, p.price
    FROM jsonb_to_recordset(p_items) AS r(product_id uuid, quantity integer)
    JOIN public.products p ON p.id = r.product_id
    WHERE p.store_id = v_store.store_id;

    UPDATE public.products p
    SET stock = p.stock - r.quantity
    FROM jsonb_to_recordset(p_items) AS r(product_id uuid, quantity integer)
    WHERE p.id = r.product_id AND p.store_id = v_store.store_id;
  END LOOP;

  DELETE FROM public.cart_items c
  WHERE c.user_id = v_user_id
    AND c.product_id IN (
      SELECT r.product_id FROM jsonb_to_recordset(p_items) AS r(product_id uuid, quantity integer)
    );

  IF v_credits_used > 0 THEN
    PERFORM public.loyalty_apply_credits(v_user_id, -v_credits_used, 'Créditos usados na compra', v_first_order_id);
  END IF;

  PERFORM public.loyalty_register_spend(v_user_id, v_paid_amount);

  IF v_cashback > 0 THEN
    PERFORM public.loyalty_apply_credits(v_user_id, v_cashback, 'Cashback da compra', v_first_order_id);
  END IF;

  v_result := jsonb_build_object(
    'orderIds', v_order_ids,
    'creditsUsed', v_credits_used,
    'cashbackEarned', v_cashback,
    'platformFee', round(v_platform_fee, 2),
    'sellerNet', round(v_seller_net, 2)
  );

  UPDATE public.checkout_idempotency
  SET result = v_result
  WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order_transactional(jsonb, jsonb, uuid, numeric) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.place_order_transactional(jsonb, jsonb, uuid, numeric) TO authenticated, service_role;
