import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createAddress, listAddresses, listCart, placeOrder } from "@/lib/shop.functions";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { getLoyalty } from "@/lib/loyalty.functions";
import { MAX_CREDIT_SHARE, cashbackRate, tierConfig } from "@/lib/loyalty";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar pedido — Oxente" },
      {
        name: "description",
        content: "Escolha o endereço de entrega e confirme seu pedido no Oxente.",
      },
      { property: "og:title", content: "Finalizar pedido — Oxente" },
      { property: "og:description", content: "Checkout de demonstração, sem cobrança real." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string>("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [useCredits, setUseCredits] = useState(true);
  const [form, setForm] = useState({
    label: "Casa",
    recipient_name: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    zip_code: "",
  });

  const { data: cart = [] } = useQuery({ queryKey: ["cart"], queryFn: () => listCart() });
  const { data: addresses = [] } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => listAddresses(),
  });
  const { data: loyalty } = useQuery({ queryKey: ["loyalty"], queryFn: () => getLoyalty() });

  const saveAddress = useServerFn(createAddress);
  const order = useServerFn(placeOrder);

  const addressMutation = useMutation({
    mutationFn: () => saveAddress({ data: { ...form, is_default: true } }),
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setSelected(address.id);
      toast.success("Pronto e arretado! Endereço salvo com sucesso.");
    },
    onError: () => toast.error("Verifique os dados do endereço."),
  });

  const orderMutation = useMutation({
    mutationFn: (addressId: string) =>
      order({ data: { addressId, creditsToUse: creditsApplied, idempotencyKey } }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty"] });
      toast.success(
        result.cashbackEarned > 0
          ? `Pedido confirmado! Você ganhou ${formatBRL(result.cashbackEarned)} em Créditos Oxente.`
          : "Pedido realizado com sucesso!",
      );
      setIdempotencyKey(crypto.randomUUID());
      navigate({ to: "/pedidos" });
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível concluir o pedido."),
  });

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const maxCredits = Math.min(loyalty?.balance ?? 0, subtotal * MAX_CREDIT_SHARE);
  const creditsApplied = useCredits ? Math.round(maxCredits * 100) / 100 : 0;
  const total = Math.round((subtotal - creditsApplied) * 100) / 100;
  const tier = tierConfig(loyalty?.tier ?? "bronze");
  const cashbackPreview = Math.round(total * cashbackRate(tier.tier) * 100) / 100;
  const addressId =
    selected || addresses.find((address) => address.is_default)?.id || addresses[0]?.id || "";

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-foreground">
          Vixe, tem nada pra finalizar por aqui!
        </h1>
        <Button asChild className="mt-6">
          <Link to="/">Voltar pras compras</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-card p-5">
          <h1 className="text-lg font-bold text-card-foreground">Endereço de entrega</h1>
          {addresses.length > 0 && (
            <RadioGroup value={addressId} onValueChange={setSelected} className="mt-4 space-y-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm"
                >
                  <RadioGroupItem value={address.id} className="mt-1" />
                  <span>
                    <span className="font-semibold text-card-foreground">
                      {address.label} — {address.recipient_name}
                    </span>
                    <span className="block text-muted-foreground">
                      {address.street}, {address.number}
                      {address.complement ? ` - ${address.complement}` : ""} — {address.district},{" "}
                      {address.city}/{address.state} — CEP {address.zip_code}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}

          <form
            className="mt-6 grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              addressMutation.mutate();
            }}
          >
            <h2 className="text-sm font-semibold text-card-foreground sm:col-span-2">
              Novo endereço
            </h2>
            {(
              [
                ["recipient_name", "Nome do destinatário", "sm:col-span-2"],
                ["street", "Rua", "sm:col-span-2"],
                ["number", "Número", ""],
                ["complement", "Complemento", ""],
                ["district", "Bairro", ""],
                ["city", "Cidade", ""],
                ["state", "UF", ""],
                ["zip_code", "CEP", ""],
              ] as const
            ).map(([field, label, className]) => (
              <div key={field} className={`space-y-1 ${className}`}>
                <Label htmlFor={field}>{label}</Label>
                <Input
                  id={field}
                  value={form[field]}
                  required={field !== "complement"}
                  maxLength={field === "state" ? 2 : undefined}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [field]: event.target.value }))
                  }
                />
              </div>
            ))}
            <Button
              type="submit"
              variant="outline"
              className="sm:col-span-2"
              disabled={addressMutation.isPending}
            >
              Salvar endereço
            </Button>
          </form>
        </section>
      </div>

      <aside className="h-fit rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-card-foreground">Resumo</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {cart.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="line-clamp-1 text-muted-foreground">
                {item.quantity}x {item.product.name}
              </span>
              <span className="font-medium text-card-foreground">
                {formatBRL(item.product.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        {(loyalty?.balance ?? 0) > 0 && (
          <div className="mt-4 rounded-lg border border-brand-gold/40 bg-brand-gold-soft p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand-gold-foreground">
                  Usar Créditos Oxente
                </p>
                <p className="text-xs text-brand-gold-foreground/80">
                  Saldo: {formatBRL(loyalty?.balance ?? 0)} • até{" "}
                  {Math.round(MAX_CREDIT_SHARE * 100)}% do pedido
                </p>
              </div>
              <Switch
                checked={useCredits}
                onCheckedChange={setUseCredits}
                aria-label="Usar Créditos Oxente"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-card-foreground">{formatBRL(subtotal)}</span>
        </div>
        {creditsApplied > 0 && (
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Créditos Oxente</span>
            <span className="font-medium text-primary">- {formatBRL(creditsApplied)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-extrabold text-primary">{formatBRL(total)}</span>
        </div>
        <Button
          className="mt-4 w-full"
          size="lg"
          disabled={!addressId || orderMutation.isPending}
          onClick={() => orderMutation.mutate(addressId)}
        >
          Arroxa o nó e concluir pedido
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {tier.label}: você receberá {formatBRL(cashbackPreview)} de cashback (
          {Math.round(tier.cashback * 100)}%).
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Pedido de demonstração: o pagamento é dividido automaticamente entre a plataforma e a
          subconta do vendedor, sem cobrança real.
        </p>
      </aside>
    </div>
  );
}
