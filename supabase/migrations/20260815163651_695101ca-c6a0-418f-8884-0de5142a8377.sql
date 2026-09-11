-- Corrigindo avisos do linter para as funções com os nomes e argumentos corretos identificados
-- Apenas ajustando search_path e revogando execução pública de funções SECURITY DEFINER

-- handle_auto_confirm_email
REVOKE EXECUTE ON FUNCTION public.handle_auto_confirm_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_auto_confirm_email() TO service_role;
ALTER FUNCTION public.handle_auto_confirm_email() SET search_path = public;

-- create_my_store (agora com argumentos corretos)
REVOKE EXECUTE ON FUNCTION public.create_my_store(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_my_store(text, text) TO authenticated, service_role;
ALTER FUNCTION public.create_my_store(text, text) SET search_path = public;

-- owns_store (argumento único conforme SELECT anterior)
ALTER FUNCTION public.owns_store(uuid) SET search_path = public;

-- decrement_stock
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO authenticated, service_role;
ALTER FUNCTION public.decrement_stock(uuid, integer) SET search_path = public;

-- Outras funções identificadas
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.loyalty_apply_credits(uuid, numeric, text, uuid) SET search_path = public;
ALTER FUNCTION public.loyalty_register_spend(uuid, numeric) SET search_path = public;

-- Revogando execução pública de funções de fidelidade
REVOKE EXECUTE ON FUNCTION public.loyalty_apply_credits(uuid, numeric, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.loyalty_register_spend(uuid, numeric) FROM anon;
