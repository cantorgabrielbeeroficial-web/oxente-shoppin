CREATE OR REPLACE FUNCTION public.create_my_store(_name text, _description text)
RETURNS public.stores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _base text;
  _slug text;
  _n integer := 0;
  _store public.stores;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT s.* INTO _store
  FROM public.stores s
  WHERE s.owner_id = _uid
  LIMIT 1;

  IF _store.id IS NOT NULL THEN
    RETURN _store;
  END IF;

  _base := regexp_replace(lower(trim(coalesce(_name, ''))), '[^a-z0-9]+', '-', 'g');
  _base := trim(both '-' from _base);
  IF _base = '' THEN _base := 'loja'; END IF;
  _slug := _base;

  WHILE EXISTS (SELECT 1 FROM public.stores WHERE slug = _slug) LOOP
    _n := _n + 1;
    _slug := _base || '-' || _n::text;
  END LOOP;

  INSERT INTO public.stores (owner_id, name, slug, description, active, store_kind)
  VALUES (_uid, trim(_name), _slug, coalesce(_description, ''), true, 'interligada')
  RETURNING * INTO _store;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'seller')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN _store;
END;
$$;

REVOKE ALL ON FUNCTION public.create_my_store(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_my_store(text, text) TO authenticated, service_role;
