DO $$
DECLARE
  v_official_store_id uuid;
BEGIN
  SELECT id INTO v_official_store_id
  FROM public.stores
  WHERE slug = 'oxente-oficial'
  LIMIT 1;

  IF v_official_store_id IS NULL THEN
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
      'Loja oficial da Oxente Shoppin.',
      true,
      'interligada'
    )
    RETURNING id INTO v_official_store_id;
  ELSE
    UPDATE public.stores
    SET active = true, store_kind = 'interligada'
    WHERE id = v_official_store_id;
  END IF;

  UPDATE public.products
  SET store_id = v_official_store_id, active = true
  WHERE name = 'Fone de Ouvido Bluetooth Sem Fio';
END $$;
