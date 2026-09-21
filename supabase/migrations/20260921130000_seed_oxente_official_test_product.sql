DO $$
DECLARE
  v_store_id uuid;
  v_category_id uuid;
BEGIN
  SELECT id INTO v_store_id
  FROM public.stores
  WHERE slug = 'oxente-oficial'
  LIMIT 1;

  IF v_store_id IS NULL THEN
    INSERT INTO public.stores (
      name,
      slug,
      description,
      active,
      store_kind
    )
    VALUES (
      'Oxente Shoppin Oficial',
      'oxente-oficial',
      'Loja oficial da Oxente Shoppin para testes de compra e pagamento Pix.',
      true,
      'interligada'
    )
    RETURNING id INTO v_store_id;
  ELSE
    UPDATE public.stores
    SET
      name = 'Oxente Shoppin Oficial',
      active = true,
      store_kind = 'interligada'
    WHERE id = v_store_id;
  END IF;

  SELECT id INTO v_category_id
  FROM public.categories
  WHERE slug = 'eletronicos'
  LIMIT 1;

  IF v_category_id IS NULL THEN
    INSERT INTO public.categories (name, slug, sort_order)
    VALUES ('Eletrônicos', 'eletronicos', 2)
    RETURNING id INTO v_category_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.products
    WHERE store_id = v_store_id
      AND name = 'Fone de Ouvido Bluetooth Sem Fio'
  ) THEN
    UPDATE public.products
    SET
      category_id = v_category_id,
      description = 'Fone Bluetooth para teste do fluxo de carrinho, checkout e pagamento Pix.',
      price = 1.00,
      stock = 120,
      image_url = COALESCE(image_url, '/__l5e/assets-v1/993be3e6-79bd-409f-b2d1-bf0317277e65/oxente-fone-bluetooth.jpg'),
      active = true
    WHERE store_id = v_store_id
      AND name = 'Fone de Ouvido Bluetooth Sem Fio';
  ELSE
    INSERT INTO public.products (
      store_id,
      category_id,
      name,
      description,
      price,
      stock,
      image_url,
      active
    )
    VALUES (
      v_store_id,
      v_category_id,
      'Fone de Ouvido Bluetooth Sem Fio',
      'Fone Bluetooth para teste do fluxo de carrinho, checkout e pagamento Pix.',
      1.00,
      120,
      '/__l5e/assets-v1/993be3e6-79bd-409f-b2d1-bf0317277e65/oxente-fone-bluetooth.jpg',
      true
    );
  END IF;
END $$;
