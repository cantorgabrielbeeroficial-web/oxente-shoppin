revoke execute on function public.has_role(uuid, public.app_role) from anon, public;
revoke execute on function public.owns_store(uuid) from anon, public;
revoke execute on function public.decrement_stock(uuid, int) from anon, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;