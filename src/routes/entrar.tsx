import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Oxente" },
      {
        name: "description",
        content: "Acesse sua conta Oxente para comprar e vender no marketplace.",
      },
      { property: "og:title", content: "Entrar ou criar conta — Oxente" },
      { property: "og:description", content: "Entre com e-mail e senha ou com o Google." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [signupGoal, setSignupGoal] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationPhone, setVerificationPhone] = useState("");
  const [verificationPending, setVerificationPending] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session && window.location.hash.includes("type=recovery")) {
        setRecoveryMode(true);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  function formatWhatsapp(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("E-mail ou senha inválidos.");
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/" });
  }

  async function handleForgotPassword(event: React.FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Informe seu e-mail para receber o link.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/entrar`,
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o link de recuperação.");
      return;
    }
    toast.success("Enviamos um link para criar uma nova senha.");
    setForgotPassword(false);
  }

  async function handleUpdatePassword(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível cadastrar a nova senha.");
      return;
    }
    setRecoveryMode(false);
    setNewPassword("");
    toast.success("Senha atualizada com sucesso!");
    navigate({ to: "/" });
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const whatsappDigits = whatsapp.replace(/\D/g, "");
    if (whatsappDigits.length < 10) {
      toast.error("Informe um WhatsApp válido.");
      return;
    }
    if (!normalizedEmail && whatsappDigits.length < 11) {
      toast.error("Informe um e-mail ou um celular com DDD válido.");
      return;
    }
    if (!signupGoal) {
      toast.error("Escolha como você quer usar a Oxente Shoppin.");
      return;
    }

    setLoading(true);
    const phone = `+55${whatsappDigits}`;
    const { data, error } = normalizedEmail
      ? await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, whatsapp: whatsappDigits, signup_goal: signupGoal },
          },
        })
      : await supabase.auth.signUp({
          phone,
          password,
          options: {
            data: { full_name: fullName, whatsapp: whatsappDigits, signup_goal: signupGoal },
          },
        });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Conta criada!");
      navigate({ to: "/" });
    } else if (!normalizedEmail) {
      setVerificationPhone(phone);
      setVerificationPending(true);
      toast.success("Enviamos um código de validação para seu celular.");
    } else {
      toast.success("Confirme seu e-mail para ativar a conta.");
    }
  }

  async function handleVerifyPhone(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: verificationPhone,
      token: verificationCode.trim(),
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast.error("Código inválido ou expirado.");
      return;
    }
    toast.success("Celular validado! Conta criada.");
    navigate({ to: "/" });
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (!result.redirected) navigate({ to: "/" });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10">
      <Link to="/" className="mx-auto flex items-center gap-2">
        <img
          src="/logo-oxente-sem-fundo.png"
          alt="Oxente Shoppin"
          className="h-28 max-w-[90vw] object-contain"
        />
      </Link>

      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <Tabs defaultValue="entrar">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entrar">Entrar</TabsTrigger>
            <TabsTrigger value="criar">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="entrar">
            {recoveryMode ? (
              <form className="mt-4 space-y-4" onSubmit={handleUpdatePassword}>
                <div>
                  <h2 className="text-base font-bold text-foreground">Cadastre uma nova senha</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use uma senha com pelo menos 6 caracteres.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    minLength={6}
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  Salvar nova senha
                </Button>
              </form>
            ) : forgotPassword ? (
              <form className="mt-4 space-y-4" onSubmit={handleForgotPassword}>
                <div>
                  <h2 className="text-base font-bold text-foreground">Vixi, esqueci a senha</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enviaremos um link para seu e-mail criar uma nova senha.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recovery-email">E-mail</Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  Enviar link por e-mail
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setForgotPassword(false)}
                >
                  Voltar para entrar
                </Button>
              </form>
            ) : (
              <form className="mt-4 space-y-4" onSubmit={handleSignIn}>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setForgotPassword(true)}
                >
                  Vixi, esqueci a senha
                </button>
                <Button type="submit" className="w-full" disabled={loading}>
                  Entrar
                </Button>
              </form>
            )}
          </TabsContent>

          <TabsContent value="criar">
            <form className="mt-4 space-y-4" onSubmit={handleSignUp}>
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-signup">E-mail</Label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="Opcional se usar celular"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp ou celular</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  inputMode="numeric"
                  required
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(formatWhatsapp(event.target.value))}
                />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">
                  Você quer usar a Oxente Shoppin para:
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm">
                    <input
                      type="radio"
                      name="signup-goal"
                      value="buyer"
                      required
                      checked={signupGoal === "buyer"}
                      onChange={(event) => setSignupGoal(event.target.value)}
                    />
                    Quero Comprar
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 text-sm">
                    <input
                      type="radio"
                      name="signup-goal"
                      value="seller"
                      checked={signupGoal === "seller"}
                      onChange={(event) => setSignupGoal(event.target.value)}
                    />
                    Quero Vender
                  </label>
                </div>
              </fieldset>
              <div className="space-y-2">
                <Label htmlFor="password-signup">Senha</Label>
                <Input
                  id="password-signup"
                  type="password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Criar conta
              </Button>
            </form>
            {verificationPending && (
              <form
                className="mt-4 space-y-3 rounded-md border border-primary/30 bg-primary/5 p-4"
                onSubmit={handleVerifyPhone}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">Valide seu celular</p>
                  <p className="text-xs text-muted-foreground">
                    Digite o código enviado para {verificationPhone}.
                  </p>
                </div>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Código de 6 dígitos"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  Validar celular
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogle}>
          Entrar com Google
        </Button>
      </div>
    </div>
  );
}
