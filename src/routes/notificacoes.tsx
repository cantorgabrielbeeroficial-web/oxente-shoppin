import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  MessageCircle,
  Store,
  Sparkles,
  Ticket,
  Wallet,
  Megaphone,
  Star,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const FILTERS = [
  { label: "Mais relevantes", icon: Star },
  { label: "Promoções", icon: Ticket },
  { label: "Lives & Prêmios", icon: Sparkles },
  { label: "Finanças", icon: Wallet },
  { label: "Atualizações", icon: Megaphone },
] as const;

const NOTIFICATIONS = [
  {
    id: "1",
    icon: Ticket,
    title: "Cupom arretado liberado!",
    text: "R$ 15 OFF em artesanato acima de R$ 89. Corre que é só até domingo.",
    time: "há 12 min",
    unread: true,
  },
  {
    id: "2",
    icon: Store,
    title: "Ateliê do Sertão postou novidade",
    text: "Chegaram redes de tear novas na loja que tu segue, meu painho.",
    time: "há 2 h",
    unread: true,
  },
  {
    id: "3",
    icon: Sparkles,
    title: "Live começando: Casa Arretada",
    text: "Prêmios e Moedas da Oxente pra quem entrar nos primeiros minutos.",
    time: "hoje, 14:30",
    unread: false,
  },
  {
    id: "4",
    icon: Wallet,
    title: "Cashback creditado",
    text: "Você recebeu 42 Moedas da Oxente do pedido #10293.",
    time: "ontem",
    unread: false,
  },
  {
    id: "5",
    icon: Megaphone,
    title: "Festa junina de ofertas",
    text: "Semana regional com frete reduzido pro Nordeste inteiro.",
    time: "21 ago",
    unread: false,
  },
];

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
  const [active, setActive] = useState<string>("Mais relevantes");
  const { user } = useAuthUser();
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const [phoneEnabled, setPhoneEnabled] = useState(false);
  const [permissionPending, setPermissionPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notification_preferences")
      .select("browser_enabled, phone_enabled")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const browserPermission = "Notification" in window && Notification.permission === "granted";
        setBrowserEnabled(data?.browser_enabled ?? browserPermission);
        setPhoneEnabled(data?.phone_enabled ?? false);
      });
  }, [user]);

  async function enableNotifications() {
    if (!user) {
      window.location.assign("/entrar");
      return;
    }
    setPermissionPending(true);
    const permission = "Notification" in window ? await Notification.requestPermission() : "denied";
    const enabled = permission === "granted";
    const { error } = await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      browser_enabled: enabled,
      phone_enabled: phoneEnabled,
    });
    setPermissionPending(false);
    if (error) return;
    setBrowserEnabled(enabled);
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
    if (!error) setPhoneEnabled(enabled);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-24 md:pb-8">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">Notificações</h1>
        <div className="flex items-center gap-1">
          <Link
            to="/carrinho"
            aria-label="Carrinho"
            className="rounded-md p-2 text-primary hover:bg-primary/10"
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

      <section className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-primary">
            <BellRing className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-card-foreground">Ativar notificações</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
        </div>
      </section>

      <Link
        to="/conversas"
        className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-brand-orange-soft p-3"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Store className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Atualizações de vendedores</p>
          <p className="truncate text-xs text-muted-foreground">
            3 lojas que tu segue postaram novidade
          </p>
        </div>
        <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
          3
        </span>
      </Link>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((filter) => (
          <button
            key={filter.label}
            onClick={() => setActive(filter.label)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active === filter.label
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            <filter.icon className="h-3.5 w-3.5" />
            {filter.label}
          </button>
        ))}
      </div>

      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {NOTIFICATIONS.map((item) => (
          <li key={item.id} className={cn("flex gap-3 p-3", item.unread && "bg-accent/40")}>
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-primary">
              <item.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-card-foreground">{item.title}</p>
                <span className="shrink-0 text-[10px] text-muted-foreground">{item.time}</span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
            {item.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
