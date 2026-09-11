import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
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
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const SHORTCUTS = [
  { to: "/pedidos", label: "Meus pedidos", icon: Package },
  { to: "/carrinho", label: "Meu carrinho", icon: ShoppingCart },
  { to: "/painel", label: "Minha loja", icon: Store },
  { to: "/conversas", label: "Conversas", icon: MessageCircle },
] as const;

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
    <div className="mx-auto max-w-2xl px-4 py-5 pb-24 md:pb-8">
      <div className="flex items-center gap-3 rounded-2xl bg-[#fff1ed] p-4 text-[#8f321f]">
        <button
          type="button"
          className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ffe9e3] text-[#b8442d] text-lg font-bold"
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
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {loading ? "Carregando..." : user ? user.email : "Oxente, entra aí!"}
          </p>
          <p className="text-xs opacity-80">
            {user
              ? "Bem-vindo de volta, meu painho/minha fia."
              : "Faça login pra ver pedidos e moedas."}
          </p>
        </div>
      </div>

      {!user && !loading && (
        <Link
          to="/entrar"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
        >
          <LogIn className="h-4 w-4" /> Entrar na Oxente
        </Link>
      )}

      <Link
        to="/filiacao"
        className="mt-4 flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-800 transition-colors hover:bg-orange-100"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white">
          <Megaphone className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">Quero ser afiliado</span>
          <span className="mt-0.5 block text-xs text-orange-700/80">
            Comece como pessoa física ou empresa e divulgue na sua rede.
          </span>
        </span>
      </Link>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Coins className="h-6 w-6 text-brand-gold" />
        <div>
          <p className="text-sm font-bold text-card-foreground">Moedas da Oxente</p>
          <p className="text-xs text-muted-foreground">Junte cashback e troque em descontos.</p>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {SHORTCUTS.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="flex items-center gap-3 p-4 text-sm text-card-foreground">
              <item.icon className="h-5 w-5 text-primary" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      {user && (
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair da conta
        </Button>
      )}
    </div>
  );
}
