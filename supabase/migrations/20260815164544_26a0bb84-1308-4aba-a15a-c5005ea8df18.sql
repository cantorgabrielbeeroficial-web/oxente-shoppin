-- Revoke execute from public and anon for security definer functions
REVOKE EXECUTE ON FUNCTION public.create_my_store FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.has_role FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.loyalty_apply_credits FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.loyalty_register_spend FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.handle_auto_confirm_email FROM public, anon;

-- Explicitly grant to authenticated/service_role where needed
GRANT EXECUTE ON FUNCTION public.create_my_store TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrement_stock TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.loyalty_apply_credits TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.loyalty_register_spend TO authenticated, service_role;
