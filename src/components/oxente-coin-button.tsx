import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Copy, Gift, Sparkles, Users, X } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth";
import { dailyCheckin, getLoyalty, redeemReferral } from "@/lib/loyalty.functions";
import { CHECKIN_REWARD, REFERRAL_REWARD, TIERS, nextTier, tierConfig } from "@/lib/loyalty";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import coinIcon from "@/assets/oxente-coin.png";

export function OxenteCoinButton() {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { user } = useAuthUser();

  return (
    <>
      <motion.button
        type="button"
        drag
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 50)}
        dragTransition={{ power: 0, timeConstant: 0 }}
        whileDrag={{ scale: 1.1 }}
        style={{ touchAction: "none" }}
        aria-label="Abrir Moeda da Oxente"
        onClick={() => !isDragging && setOpen(true)}
        className="animate-coin-pulse fixed bottom-20 right-4 z-50 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gold-gradient ring-2 ring-brand-gold/60 transition-transform hover:scale-105 cursor-grab active:cursor-grabbing sm:bottom-5 sm:right-5"
      >
        <img
          src={coinIcon}
          alt=""
          width={64}
          height={64}
          className="h-8 w-8 sm:h-12 sm:w-12 drop-shadow pointer-events-none"
        />
      </motion.button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
          <div className="bg-sertao-gradient px-5 pb-6 pt-5 text-primary-foreground">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-primary-foreground">Moeda da Oxente</SheetTitle>
                <SheetDescription className="text-primary-foreground/80">
                  Junte créditos, suba de chapéu e ganhe cashback.
                </SheetDescription>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-primary-foreground/80 hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {user ? <LoyaltyPanel /> : <GuestPanel onClose={() => setOpen(false)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function TierList() {
  return (
    <ul className="space-y-2">
      {TIERS.map((item) => (
        <li key={item.tier} className="rounded-lg border border-border bg-card p-3">
          <p className="text-sm font-bold text-card-foreground">
            {item.label}{" "}
            <span className="font-normal text-muted-foreground">({item.subtitle})</span>
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {item.perks.map((perk) => (
              <li key={perk}>• {perk}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function GuestPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4 p-5">
      <p className="text-sm text-muted-foreground">
        Entre na sua conta para acumular Créditos Oxente em cada compra, fazer check-in diário e
        indicar amigos.
      </p>
      <Button asChild className="w-full" onClick={onClose}>
        <Link to="/entrar">Entrar e começar a ganhar</Link>
      </Button>
      <h3 className="pt-2 text-sm font-semibold text-foreground">Níveis de chapéu</h3>
      <TierList />
    </div>
  );
}

function LoyaltyPanel() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const { data, isPending } = useQuery({ queryKey: ["loyalty"], queryFn: () => getLoyalty() });
  const checkin = useServerFn(dailyCheckin);
  const referral = useServerFn(redeemReferral);

  const checkinMutation = useMutation({
    mutationFn: () => checkin(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["loyalty"] });
      toast.success(
        `+${formatBRL(result.reward)} em créditos! Sequência de ${result.streak} dias.`,
      );
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível fazer o check-in."),
  });

  const referralMutation = useMutation({
    mutationFn: () => referral({ data: { code } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["loyalty"] });
      setCode("");
      toast.success(`Indicação validada: +${formatBRL(result.reward)} em créditos!`);
    },
    onError: (error: Error) => toast.error(error.message || "Código inválido."),
  });

  if (isPending || !data) {
    return <p className="p-5 text-sm text-muted-foreground">Carregando seus créditos…</p>;
  }

  const current = tierConfig(data.tier);
  const upcoming = nextTier(data.tier);
  const progress = upcoming
    ? Math.min(100, Math.round((data.totalSpent / upcoming.minSpent) * 100))
    : 100;

  return (
    <div className="space-y-5 p-5">
      <section className="rounded-xl border border-brand-gold/40 bg-brand-gold-soft p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold-foreground/80">
          Créditos Oxente
        </p>
        <p className="text-3xl font-extrabold text-brand-gold-foreground">
          {formatBRL(data.balance)}
        </p>
        <p className="mt-1 text-xs text-brand-gold-foreground/80">
          Use no checkout como desconto (até 50% do pedido).
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-card-foreground">{current.label}</p>
            <p className="text-xs text-muted-foreground">
              Cashback de {Math.round(current.cashback * 100)}% em cada compra
            </p>
          </div>
          <img src={coinIcon} alt="" width={40} height={40} loading="lazy" className="h-10 w-10" />
        </div>
        <Progress value={progress} className="mt-3 h-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          {upcoming
            ? `Faltam ${formatBRL(Math.max(0, upcoming.minSpent - data.totalSpent))} em compras para o ${upcoming.label}.`
            : "Você está no nível máximo do sertão!"}
        </p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground">Missões rápidas</h3>
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-brand-gold" />
              <div>
                <p className="text-sm font-medium text-card-foreground">Check-in diário</p>
                <p className="text-xs text-muted-foreground">
                  +{formatBRL(CHECKIN_REWARD)} por dia • sequência: {data.checkinStreak}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              disabled={data.checkedInToday || checkinMutation.isPending}
              onClick={() => checkinMutation.mutate()}
            >
              {data.checkedInToday ? <Check className="h-4 w-4" /> : "Fazer"}
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 text-brand-gold" />
              <div>
                <p className="text-sm font-medium text-card-foreground">Indique um amigo</p>
                <p className="text-xs text-muted-foreground">
                  Vocês dois ganham {formatBRL(REFERRAL_REWARD)} em créditos.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input readOnly value={data.referralCode} className="font-mono" />
              <Button
                variant="outline"
                size="icon"
                aria-label="Copiar código"
                onClick={async () => {
                  await navigator.clipboard.writeText(data.referralCode);
                  setCopied(true);
                  toast.success("Código copiado!");
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {!data.hasReferrer && (
              <form
                className="mt-2 flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  referralMutation.mutate();
                }}
              >
                <Input
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="Recebeu um código? Digite aqui"
                />
                <Button type="submit" variant="secondary" disabled={referralMutation.isPending}>
                  <Gift className="mr-1 h-4 w-4" /> Usar
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {data.transactions.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground">Últimos créditos</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {data.transactions.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="line-clamp-1 text-muted-foreground">{item.reason}</span>
                <span
                  className={
                    item.amount >= 0 ? "font-semibold text-primary" : "text-muted-foreground"
                  }
                >
                  {item.amount >= 0 ? "+" : "-"}
                  {formatBRL(Math.abs(item.amount))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-foreground">Níveis de chapéu</h3>
        <div className="mt-2">
          <TierList />
        </div>
      </section>
    </div>
  );
}
