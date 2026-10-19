import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  ShoppingCart,
  Store,
  MessageCircle,
  Coins,
  LogIn,
  LogOut,
  ImagePlus,
  Loader2,
  Megaphone,
  Wallet,
  Truck,
  Star,
  ChevronRight,
  HelpCircle,
  Info,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { listProducts } from "@/lib/catalog.functions";
import { cartCount } from "@/lib/shop.functions";
import { ProductGrid } from "@/components/product-card";
import { Button } from "@/components/ui/button";

const ORDER_STEPS: { label: string; icon: LucideIcon }[] = [
  { label: "A pagar", icon: Wallet },
  { label: "Preparando", icon: Package },
  { label: "A caminho", icon: Truck },
  { label: "Avaliar", icon: Star },
];

const ACTIVITIES: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/filiacao", label: "Afiliados e criadores", icon: Megaphone },
  { to: "/vender", label: "Minha loja", icon: Store },
  { to: "/conversas", label: "Conversas", icon: MessageCircle },
  { to: "/carrinho", label: "Meu carrinho", icon: ShoppingCart },
];

const SUPPORT: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/vender", label: "Venda na Oxente", icon: Store },
  { to: "/conversas", label: "Central de ajuda", icon: HelpCircle },
  { to: "/", label: "Sobre a Oxente", icon: Info },
];

function prepareAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const size = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceX = (image.naturalWidth - size) / 2;
      const sourceY = (image.naturalHeight - size) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível preparar a imagem."));
        return;
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, sourceX, sourceY, size, size, 0, 0, 512, 512);
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      } catch {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível preparar a imagem."));
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível ler a imagem."));
    };
    image.src = objectUrl;
  });
}

export const Route = createFileRoute("/eu")({
  head: () => ({
    meta: [
      { title: "Minha conta — Oxente" },
      {
        name: "description",
        content: "Acesse seus pedidos, carrinho, loja e Moedas da Oxente em um só lugar.",
      },
      { property: "og:title", content: "Minha conta — Oxente" },
      { property: "og:description", content: "Pedidos, carrinho, loja e recompensas da Oxente." },
    ],
  }),
  component: EuPage,
});

function EuPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuthUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  const { data: count = 0 } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: () => cartCount(),
    enabled: Boolean(user),
  });
  const { data: suggestions = [] } = useQuery({
    queryKey: ["eu-suggestions"],
    queryFn: () => listProducts({ data: { limit: 8 } }),
  });

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      return;
    }

    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setAvatarUrl(data?.avatar_url ?? null));
  }, [user]);

  async function handleAvatarUpload(file: File | undefined) {
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }

    setUploading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        throw new Error("Sua sessão expirou. Entre novamente para enviar a foto.");
      }

      const avatar = await prepareAvatar(file);
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatar })
        .eq("id", user.id);
      if (profileError) throw profileError;

      setAvatarUrl(avatar);
      toast.success("Foto de perfil atualizada!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      const statusCode =
        typeof error === "object" && error !== null && "statusCode" in error
          ? String(error.statusCode)
          : "";
      const message = errorMessage.toLowerCase();
      if (message.includes("bucket") || message.includes("row-level security")) {
        toast.error(
          `O Supabase recusou o upload${statusCode ? ` (${statusCode})` : ""}: ${errorMessage}`,
        );
      } else if (message.includes("preparar") || message.includes("ler a imagem")) {
        toast.error("Não foi possível ler essa foto. Escolha uma imagem JPG ou PNG.");
      } else {
        toast.error(
          `Não foi possível atualizar sua foto${statusCode ? ` (${statusCode})` : ""}: ${errorMessage}`,
        );
      }
    } finally {
      setUploading(false);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Não foi possível sair da conta.");
      return;
    }
    toast.success("Você saiu da sua conta.");
    navigate({ to: "/" });
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-muted/40 pb-24 md:pb-8">
      <div className="bg-primary px-4 pb-4 pt-5 text-primary-foreground">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary-foreground/60 bg-primary-foreground/20 text-lg font-bold"
            aria-label="Alterar foto de perfil"
            disabled={!user || uploading}
            onClick={() => avatarInput.current?.click()}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
            ) : (
              (user?.email?.[0]?.toUpperCase() ?? "O")
            )}
            {user && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity hover:opacity-100">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
              </span>
            )}
          </button>
          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleAvatarUpload(event.target.files?.[0])}
          />
          {user && (
            <span className="sr-only">
              A foto será ajustada automaticamente para o formato quadrado.
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold">
              {loading ? "Carregando..." : user ? user.email : "Oxente, entra aí!"}
            </p>
            <p className="text-xs opacity-90">
              {user
                ? "Bem-vindo de volta, meu painho/minha fia."
                : "Faça login pra ver pedidos e moedas."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              to="/notificacoes"
              aria-label="Notificações"
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-primary-foreground/15"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <Link
              to="/carrinho"
              aria-label="Carrinho"
              className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-primary-foreground/15"
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 rounded-full bg-white px-1.5 text-[10px] font-bold text-primary">
                  {count}
                </span>
              )}
            </Link>
            <Link
              to="/conversas"
              aria-label="Conversas"
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-primary-foreground/15"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <Link
          to="/filiacao"
          className="mt-3 flex items-center gap-2 rounded-lg bg-[#fff6d6] px-3 py-2 text-xs font-semibold text-[#7a4a00]"
        >
          <Megaphone className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            Quero ser afiliado: divulgue na sua rede e ganhe comissão, visse?
          </span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </Link>
      </div>

      <div className="space-y-2 px-2 pt-2">
        {!user && !loading && (
          <Link
            to="/entrar"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
          >
            <LogIn className="h-4 w-4" /> Entrar na Oxente
          </Link>
        )}

        <section className="rounded-xl bg-card p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-card-foreground">Minhas compras</h2>
            <Link to="/pedidos" className="flex items-center text-xs text-muted-foreground">
              Ver histórico <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1 text-center">
            {ORDER_STEPS.map((step) => (
              <Link
                key={step.label}
                to="/pedidos"
                className="flex flex-col items-center gap-1.5 text-[11px] text-card-foreground"
              >
                <step.icon className="h-6 w-6 text-primary" strokeWidth={1.6} />
                {step.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-card p-3">
          <h2 className="text-sm font-bold text-card-foreground">Minha carteira</h2>
          <Link to="/" className="mt-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold/20 text-brand-gold">
              <Coins className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-card-foreground">
                Moedas da Oxente
              </span>
              <span className="block text-xs text-muted-foreground">
                Junte cashback e troque em descontos.
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>

        <section className="rounded-xl bg-card p-3">
          <h2 className="text-sm font-bold text-card-foreground">Mais atividades</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {ACTIVITIES.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-2 rounded-md border border-border p-3 text-sm font-medium text-card-foreground"
              >
                <item.icon className="h-5 w-5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 leading-tight">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-card px-3 py-1">
          <h2 className="pb-1 pt-2 text-sm font-bold text-card-foreground">Suporte Oxente</h2>
          <ul className="divide-y divide-border">
            {SUPPORT.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 py-3 text-sm text-card-foreground"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {user && (
          <Button
            type="button"
            variant="outline"
            className="w-full bg-card text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
        )}

        {suggestions.length > 0 && (
          <section className="pb-2 pt-3">
            <h2 className="mb-3 flex items-center gap-3 text-center text-sm font-bold text-foreground">
              <span className="h-px flex-1 bg-border" />
              Você também pode gostar
              <span className="h-px flex-1 bg-border" />
            </h2>
            <ProductGrid products={suggestions} />
          </section>
        )}
      </div>
    </div>
  );
}
