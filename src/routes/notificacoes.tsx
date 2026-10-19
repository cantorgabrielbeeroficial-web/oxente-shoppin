import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BellRing,
  CheckCheck,
  ChevronRight,
  Coins,
  Flame,
  Megaphone,
  MessageCircle,
  PackageCheck,
  Radio,
  ShoppingCart,
  Sparkles,
  Store,
  Ticket,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const FILTERS = [
  { label: "Mais relevantes", icon: Flame },
  { label: "Promoções", icon: Ticket },
  { label: "Lives, vídeos e prêmios", icon: Radio },
  { label: "Finanças", icon: Coins },
  { label: "Novidades Oxente", icon: Store },
] as const;

type NotificationCategory =
  "Promoções" | "Lives, vídeos e prêmios" | "Finanças" | "Novidades Oxente";

const NOTIFICATIONS = [
  {
    id: "coupon",
    category: "Promoções",
    icon: Ticket,
    title: "Cupom arretado pra tu aproveitar!",
    text: "R$ 15 OFF em peças de artesanato acima de R$ 89. Bora garantir o teu?",
    time: "há 12 min",
    unread: true,
  },
  {
    id: "seller",
    category: "Novidades Oxente",
    icon: Store,
    title: "Ateliê do Sertão chegou com novidade",
    text: "Redes de tear feitas à mão acabaram de chegar na loja que tu segue.",
    time: "há 2 h",
    unread: true,
  },
  {
    id: "live",
    category: "Lives, vídeos e prêmios",
    icon: Sparkles,
    title: "A Bodega vai abrir a live daqui a pouco!",
    text: "Cola pra ver as novidades e concorrer a Moedas Oxente, visse?",
    time: "hoje, 14:30",
    unread: false,
  },
  {
    id: "cashback",
    category: "Finanças",
    icon: Wallet,
    title: "Oxente, caiu cashback na tua conta!",
    text: "Tu recebeu 42 Moedas Oxente pelo pedido #10293.",
    time: "ontem",
    unread: false,
  },
  {
    id: "shipping",
    category: "Novidades Oxente",
    icon: PackageCheck,
    title: "Seu pedido já tá a caminho",
    text: "A loja separou teu pedido e ele segue viagem pra tua casa.",
    time: "ontem",
    unread: false,
  },
  {
    id: "festival",
    category: "Promoções",
    icon: Megaphone,
    title: "Semana arretada de ofertas nordestinas",
    text: "Tem desconto nas lojas da região. Dá uma olhadinha nos achadinhos!",
    time: "21 set",
    unread: false,
  },
  {
    id: "video",
    category: "Lives, vídeos e prêmios",
    icon: Radio,
    title: "Tem vídeo novo da Bodega no ar!",
    text: "Dá o play pra conferir os achadinhos da semana e deixar teu like.",
    time: "20 set",
    unread: false,
  },
  {
    id: "shipping-offer",
    category: "Promoções",
    icon: Ticket,
    title: "Frete com desconto pras bandas de cá",
    text: "Aproveita as ofertas das lojas do Nordeste com frete especial.",
    time: "19 set",
    unread: false,
  },
] satisfies {
  id: string;
  category: NotificationCategory;
  icon: typeof Ticket;
  title: string;
  text: string;
  time: string;
  unread: boolean;
}[];

export const Route = createFileRoute("/notificacoes")({
  head: () => ({
    meta: [
      { title: "Notificações — Oxente" },
      {
        name: "description",
        content:
          "Acompanhe cupons, lives, finanças e atualizações das lojas que você segue na Oxente.",
      },
      { property: "og:title", content: "Notificações — Oxente" },
      {
        property: "og:description",
        content: "Cupons, lives, cashback e novidades das lojas nordestinas.",
      },
    ],
  }),
  component: NotificacoesPage,
});

function NotificacoesPage() {
  const [active, setActive] = useState<(typeof FILTERS)[number]["label"]>("Mais relevantes");
  const [notifications, setNotifications] = useState(() =>
    NOTIFICATIONS.map((item) => ({ ...item })),
  );
  const { user } = useAuthUser();
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const [phoneEnabled, setPhoneEnabled] = useState(false);
  const [permissionPending, setPermissionPending] = useState(false);

  const unreadCount = notifications.filter((item) => item.unread).length;
  const sellerUpdates = notifications.filter((item) => item.category === "Novidades Oxente").length;
  const visibleNotifications =
    active === "Mais relevantes"
      ? notifications
      : notifications.filter((item) => item.category === active);

  useEffect(() => {
    if (!user) return;

    let isCurrent = true;
    supabase
      .from("notification_preferences")
      .select("browser_enabled, phone_enabled")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (error) {
          console.error("Could not load notification preferences:", error);
          toast.error("Não foi possível carregar as preferências de notificação.");
          return;
        }

        const browserPermission = "Notification" in window && Notification.permission === "granted";
        setBrowserEnabled(data?.browser_enabled ?? browserPermission);
        setPhoneEnabled(data?.phone_enabled ?? false);
      });

    return () => {
      isCurrent = false;
    };
  }, [user]);

  function markAsRead(id: string) {
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );
  }

  function markAllAsRead() {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  }

  async function enableNotifications() {
    if (!user) {
      window.location.assign("/entrar");
      return;
    }
    if (!("Notification" in window)) {
      toast.error("Este navegador não oferece notificações.");
      return;
    }

    setPermissionPending(true);
    try {
      const permission = await Notification.requestPermission();
      const enabled = permission === "granted";
      const { error } = await supabase.from("notification_preferences").upsert({
        user_id: user.id,
        browser_enabled: enabled,
        phone_enabled: phoneEnabled,
      });
      if (error) {
        console.error("Could not save browser notification preference:", error);
        toast.error("Não foi possível salvar essa preferência.");
        return;
      }

      setBrowserEnabled(enabled);
      if (enabled) toast.success("Notificações ativadas, visse!");
      else toast.error("A permissão não foi liberada no navegador.");
    } catch (error) {
      console.error("Could not enable browser notifications:", error);
      toast.error("Não foi possível ativar as notificações.");
    } finally {
      setPermissionPending(false);
    }
  }

  async function togglePhoneNotifications() {
    if (!user) {
      window.location.assign("/entrar");
      return;
    }

    const enabled = !phoneEnabled;
    const { error } = await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      browser_enabled: browserEnabled,
      phone_enabled: enabled,
    });
    if (error) {
      console.error("Could not save phone notification preference:", error);
      toast.error("Não foi possível salvar essa preferência.");
      return;
    }

    setPhoneEnabled(enabled);
    toast.success(enabled ? "Avisos no celular ativados!" : "Avisos no celular pausados.");
  }

  return (
    <div className="mx-auto max-w-2xl px-3 pb-24 pt-2 sm:px-4 sm:py-4 md:pb-8">
      <header className="relative flex h-11 items-center justify-end border-b border-border">
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-foreground">
          Notificações
        </h1>
        <div className="flex items-center gap-1">
          <Link
            to="/carrinho"
            aria-label="Carrinho"
            className="relative rounded-md p-2 text-primary hover:bg-primary/10"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>
          <Link
            to="/conversas"
            aria-label="Conversas"
            className="rounded-md p-2 text-primary hover:bg-primary/10"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <Link
        to="/oficiais"
        className="flex min-h-12 items-center gap-2 border-b border-border text-sm"
      >
        <span className="font-bold text-foreground">Atualizações de vendedores</span>
        {sellerUpdates > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground">
            {sellerUpdates}
          </span>
        )}
        <span className="ml-auto flex items-center gap-0.5 text-xs text-muted-foreground">
          Ver tudo <ChevronRight className="h-4 w-4" />
        </span>
      </Link>

      <section className="mt-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Últimas novidades</h2>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:cursor-default"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Ler tudo
          </button>
        </div>

        <div className="mt-2 grid grid-cols-5 border-b border-border">
          {FILTERS.map((filter) => {
            const FilterIcon = filter.icon;
            const isActive = active === filter.label;
            const count =
              filter.label === "Mais relevantes"
                ? unreadCount
                : notifications.filter((item) => item.category === filter.label && item.unread)
                    .length;

            return (
              <button
                key={filter.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActive(filter.label)}
                className={cn(
                  "relative flex min-w-0 flex-col items-center gap-1 px-0.5 pb-2 pt-1 text-center text-[10px] leading-tight transition-colors",
                  isActive
                    ? "font-bold text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <FilterIcon className="h-[18px] w-[18px]" />
                  {count > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[8px] font-bold text-primary-foreground">
                      {count}
                    </span>
                  )}
                </span>
                <span>{filter.label}</span>
                {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
              </button>
            );
          })}
        </div>

        {visibleNotifications.length > 0 ? (
          <ul className="divide-y divide-border">
            {visibleNotifications.map((item) => {
              const ItemIcon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => markAsRead(item.id)}
                    aria-label={`${item.unread ? "Marcar como lida: " : ""}${item.title}`}
                    className={cn(
                      "flex w-full items-start gap-3 px-0 py-4 text-left transition-colors hover:bg-accent/40",
                      item.unread && "bg-accent/20",
                    )}
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-orange-soft text-primary">
                      <ItemIcon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold leading-snug text-card-foreground">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-[1.45] text-muted-foreground">
                        {item.text}
                      </span>
                      <span className="mt-1 block text-[10px] text-muted-foreground/80">
                        {item.time}
                      </span>
                    </span>
                    {item.unread && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-4 py-12 text-center">
            <BellRing className="mx-auto h-8 w-8 text-primary/70" />
            <p className="mt-3 text-sm font-bold text-foreground">
              Tá tudo em dia por aqui, visse?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Quando chegar novidade, ela aparece aqui.
            </p>
          </div>
        )}
      </section>

      <details className="mt-12 rounded-xl border border-border bg-card">
        <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-primary">
            <BellRing className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-card-foreground">
              Preferências de notificação
            </span>
            <span className="block text-xs text-muted-foreground">
              Escolhe por onde receber os avisos da Oxente.
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </summary>
        <div className="border-t border-border p-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Receba avisos de pedidos, novidades das lojas e lives da Bodega.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={enableNotifications}
              disabled={permissionPending || browserEnabled}
            >
              {browserEnabled ? "Notificações ativas" : "Permitir no navegador"}
            </Button>
            {user?.user_metadata?.["whatsapp"] && (
              <Button
                size="sm"
                variant={phoneEnabled ? "secondary" : "outline"}
                onClick={togglePhoneNotifications}
              >
                {phoneEnabled ? "Celular ativo" : "Receber no celular"}
              </Button>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
