-- Garantindo que novos usuários tenham e-mail confirmado automaticamente via trigger para evitar barreira de acesso
CREATE OR REPLACE FUNCTION public.handle_auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Se o trigger já existir, removemos antes de recriar
DROP TRIGGER IF EXISTS tr_auto_confirm_email ON auth.users;

-- Tenta criar o trigger na tabela auth.users se as permissões permitirem (normalmente requer superuser ou permissão específica)
-- Em ambientes gerenciados, isso pode falhar se não houver acesso ao schema auth.
-- Como alternativa, focamos em garantir que o fluxo de login no Oxente use auto-confirmação via provedores sociais ou configurações de projeto.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        CREATE TRIGGER tr_auto_confirm_email
        BEFORE INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_auto_confirm_email();
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Não foi possível criar trigger em auth.users. Certifique-se de desativar "Confirm email" no dashboard do provedor de Auth.';
END $$;
