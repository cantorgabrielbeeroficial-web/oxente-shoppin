import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronDown, Plus } from "lucide-react";
import {
  createAddress,
  listAddresses,
  listCart,
  listMyOrders,
  placeOrder,
} from "@/lib/shop.functions";
import { createPagSeguroHostedCheckout, createPagSeguroPixOrder } from "@/lib/pagseguro";
import { formatBRL } from "@/lib/format";
import { generateUUID } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { getLoyalty } from "@/lib/loyalty.functions";
import { MAX_CREDIT_SHARE, cashbackRate, tierConfig } from "@/lib/loyalty";

const PIX_COUNTDOWN_SECONDS = 50;

// A contagem é apenas visual: ao chegar a zero o QR Code continua válido na tela.
function PixSheet({
  pix,
  open,
  onOpenChange,
}: {
  pix: { code: string; qrCodeImageUrl: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(PIX_COUNTDOWN_SECONDS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(PIX_COUNTDOWN_SECONDS);
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, pix.code]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(pix.code);
    } catch {
      // Sem HTTPS (ex.: teste por IP no celular) a Clipboard API não existe.
      const field = document.getElementById("pix-code") as HTMLTextAreaElement | null;
      field?.select();
      if (!document.execCommand("copy")) {
        toast.error("Não foi possível copiar. Selecione o código e copie manualmente.");
        return;
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="h-[50vh] max-h-[50vh]">
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <DrawerHeader className="p-2 text-center">
            <DrawerTitle>Pague com Pix</DrawerTitle>
            <DrawerDescription>
              {secondsLeft > 0
                ? `Pague em ${secondsLeft}s para garantir seu pedido`
                : "Finalize o pagamento o quanto antes"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${(secondsLeft / PIX_COUNTDOWN_SECONDS) * 100}%` }}
            />
          </div>
          <img
            src={pix.qrCodeImageUrl}
            alt="QR Code para pagamento Pix"
            className="mx-auto mt-3 h-40 w-40 rounded-md border border-border p-1"
          />
          <Label htmlFor="pix-code" className="mt-3 block text-left text-xs">
            Pix copia e cola
          </Label>
          <textarea
            id="pix-code"
            readOnly
            value={pix.code}
            className="mt-1 h-16 w-full resize-none rounded-md border border-input bg-background p-2 text-xs text-foreground"
          />
          <Button type="button" className="mt-2 w-full" onClick={copyCode}>
            {copied ? "Copiado!" : "Copiar Código Pix"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

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
  const [step, setStep] = useState<"address" | "payment">("address");
  const [newAddressOpen, setNewAddressOpen] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateUUID());
  const [useCredits, setUseCredits] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [pix, setPix] = useState<{ code: string; qrCodeImageUrl: string } | null>(null);
  const [pixSheetOpen, setPixSheetOpen] = useState(false);
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
    email: "",
    taxId: "",
  });

  const { data: cart = [] } = useQuery({ queryKey: ["cart"], queryFn: () => listCart() });
  const { data: addresses = [] } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => listAddresses(),
  });
  const { data: loyalty } = useQuery({ queryKey: ["loyalty"], queryFn: () => getLoyalty() });

  const saveAddress = useServerFn(createAddress);
  const order = useServerFn(placeOrder);
  const createPix = useServerFn(createPagSeguroPixOrder);
  const createCardCheckout = useServerFn(createPagSeguroHostedCheckout);

  const addressMutation = useMutation({
    mutationFn: () => {
      const { email: _email, taxId: _taxId, ...addressFields } = form;
      return saveAddress({ data: { ...addressFields, is_default: true } });
    },
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setSelected(address.id);
      setNewAddressOpen(false);
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
      queryClient.invalidateQueries({ queryKey: ["loyalty"] });
      const orderId = result.orderIds[0];
      if (!orderId) {
        toast.error("O pedido foi criado, mas não recebemos o identificador de pagamento.");
        return;
      }
      setCurrentOrderId(orderId);
      if (paymentMethod === "pix") pixMutation.mutate(orderId);
      else cardCheckoutMutation.mutate(orderId);
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível concluir o pedido."),
  });

  const pixMutation = useMutation({
    mutationFn: (orderId: string) =>
      createPix({
        data: {
          orderId,
          customer: {
            name: payerName,
            email: form.email,
            ...(form.taxId.trim() ? { taxId: form.taxId } : {}),
          },
        },
      }),
    onSuccess: (result) => {
      setPix({ code: result.code, qrCodeImageUrl: result.qrCodeImageUrl });
      setPixSheetOpen(true);
      toast.success("Pix gerado. Escaneie o QR Code para pagar.");
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível gerar o Pix."),
  });

  const cardCheckoutMutation = useMutation({
    mutationFn: (orderId: string) =>
      createCardCheckout({
        data: {
          orderId,
          customer: {
            name: payerName,
            email: form.email,
            ...(form.taxId.trim() ? { taxId: form.taxId } : {}),
          },
        },
      }),
    onSuccess: ({ paymentUrl }) => window.location.assign(paymentUrl),
    onError: (error: Error) => {
      console.error("[CARD_CHECKOUT_ERROR]", error);
      toast.error(error.message || "Não foi possível abrir o pagamento por cartão.");
    },
  });

  const paymentQuery = useQuery({
    queryKey: ["payment-order", currentOrderId],
    queryFn: async () => {
      const orders = await listMyOrders();
      return orders.find((item) => item.id === currentOrderId) ?? null;
    },
    enabled: Boolean(currentOrderId),
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (paymentQuery.data?.status === "paid") {
      toast.success("Pagamento confirmado! Seu pedido foi recebido.");
      navigate({ to: "/pedidos" });
    }
  }, [navigate, paymentQuery.data?.status]);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const maxCredits = Math.min(loyalty?.balance ?? 0, subtotal * MAX_CREDIT_SHARE);
  const creditsApplied = useCredits ? Math.round(maxCredits * 100) / 100 : 0;
  const total = Math.round((subtotal - creditsApplied) * 100) / 100;
  const tier = tierConfig(loyalty?.tier ?? "bronze");
  const cashbackPreview = Math.round(total * cashbackRate(tier.tier) * 100) / 100;
  const addressId =
    selected || addresses.find((address) => address.is_default)?.id || addresses[0]?.id || "";
  const payerName =
    form.recipient_name.trim() ||
    addresses.find((address) => address.id === addressId)?.recipient_name ||
    "";
  const selectedAddress = addresses.find((address) => address.id === addressId);

  if (cart.length === 0 && !currentOrderId) {
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
        {step === "address" && (
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

            <button
              type="button"
              aria-expanded={newAddressOpen}
              onClick={() => setNewAddressOpen((open) => !open)}
              className="mt-4 flex w-full items-center justify-between rounded-md border border-dashed border-primary/50 px-3 py-3 text-sm font-semibold text-primary"
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Novo endereço
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${newAddressOpen ? "rotate-180" : ""}`}
              />
            </button>

            <form
              hidden={!newAddressOpen}
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                addressMutation.mutate();
              }}
            >
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

            <Button
              type="button"
              size="lg"
              className="mt-5 w-full"
              onClick={() => {
                if (!addressId) {
                  toast.error("Salve ou selecione um endereço de entrega para continuar.");
                  return;
                }
                setStep("payment");
              }}
            >
              Continuar para o pagamento
            </Button>
          </section>
        )}

        {step === "payment" && (
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-lg font-bold text-card-foreground">Pagamento</h1>
              {!currentOrderId && (
                <button
                  type="button"
                  onClick={() => setStep("address")}
                  className="text-sm font-medium text-primary"
                >
                  Trocar endereço
                </button>
              )}
            </div>
            {selectedAddress && (
              <p className="mt-2 text-sm text-muted-foreground">
                Entrega para{" "}
                <b className="text-card-foreground">{selectedAddress.recipient_name}</b>:{" "}
                {selectedAddress.street}, {selectedAddress.number} — {selectedAddress.district},{" "}
                {selectedAddress.city}/{selectedAddress.state}
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="email">E-mail para o pagamento</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="taxId">CPF</Label>
                <Input
                  id="taxId"
                  value={form.taxId}
                  onChange={(event) => setForm((prev) => ({ ...prev, taxId: event.target.value }))}
                />
              </div>
            </div>
          </section>
        )}

        {step === "payment" && pix && (
          <section className="rounded-lg border border-primary/30 bg-card p-5 text-center">
            <h2 className="text-lg font-bold text-card-foreground">Pix gerado</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O pedido será confirmado automaticamente após o pagamento.
            </p>
            <Button type="button" className="mt-3 w-full" onClick={() => setPixSheetOpen(true)}>
              Ver QR Code e copia e cola
            </Button>
            {paymentQuery.isFetching && (
              <p className="mt-3 text-xs text-muted-foreground">
                Aguardando confirmação do pagamento...
              </p>
            )}
          </section>
        )}
      </div>

      {pix && <PixSheet pix={pix} open={pixSheetOpen} onOpenChange={setPixSheetOpen} />}

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
        {step === "address" ? (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Escolha o endereço e toque em “Continuar para o pagamento”.
          </p>
        ) : (
          <>
            <div className="mt-4 space-y-2">
              <Label>Forma de pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === "pix" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("pix")}
                >
                  Pix
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("card")}
                >
                  Crédito ou débito
                </Button>
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              size="lg"
              disabled={
                orderMutation.isPending || pixMutation.isPending || cardCheckoutMutation.isPending
              }
              onClick={() => {
                if (pix) {
                  setPixSheetOpen(true);
                  return;
                }
                if (!addressId) {
                  toast.error("Salve ou selecione um endereço de entrega para continuar.");
                  return;
                }
                if (!form.email.trim() || !payerName) {
                  toast.error("Informe o e-mail para o pagamento para continuar.");
                  return;
                }
                if (currentOrderId) {
                  if (paymentMethod === "pix") pixMutation.mutate(currentOrderId);
                  else cardCheckoutMutation.mutate(currentOrderId);
                  return;
                }
                orderMutation.mutate(addressId);
              }}
            >
              {pixMutation.isPending || cardCheckoutMutation.isPending
                ? "Abrindo pagamento..."
                : pix
                  ? "Ver QR Code do Pix"
                  : paymentMethod === "pix"
                    ? "Pagar com Pix"
                    : "Pagar com cartão"}
            </Button>
          </>
        )}
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {tier.label}: você receberá {formatBRL(cashbackPreview)} de cashback (
          {Math.round(tier.cashback * 100)}%).
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          O pagamento é processado pelo PagBank. O status será atualizado após a confirmação.
        </p>
      </aside>
    </div>
  );
}
