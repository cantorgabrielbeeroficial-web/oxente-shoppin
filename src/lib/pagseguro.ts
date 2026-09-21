import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PAGBANK_ORDERS_URL = "https://api.pagseguro.com/orders";

export type PagSeguroCustomer = {
  name: string;
  email: string;
  taxId?: string;
};

export type CreatePagSeguroPixOrderInput = {
  orderId: string;
  amount: number;
  customer: PagSeguroCustomer;
};

export type PagSeguroPixOrder = {
  orderId: string;
  code: string;
  qrCodeImageUrl: string;
};

const pagBankResponseSchema = z.object({
  id: z.string().optional(),
  qr_codes: z
    .array(
      z.object({
        text: z.string().min(1),
        links: z
          .array(
            z.object({
              href: z.string().url(),
              rel: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .min(1),
});

function amountInCents(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("O valor do pedido deve ser maior que zero.");
  }

  const cents = Math.round(amount * 100);
  if (cents < 1) throw new Error("O valor do pedido deve ser maior que zero.");
  return cents;
}

/** Cria uma cobrança Pix no PagBank. Deve ser chamado somente no servidor. */
async function createPagSeguroPixOrderRequest(
  input: CreatePagSeguroPixOrderInput,
): Promise<PagSeguroPixOrder> {
  const token = process.env["PAGSEGURO_TOKEN"];
  if (!token) throw new Error("PAGSEGURO_TOKEN não configurado.");

  const orderId = input.orderId.trim();
  const customerName = input.customer.name.trim();
  const customerEmail = input.customer.email.trim();
  if (!orderId || !customerName || !customerEmail) {
    throw new Error("orderId, nome e e-mail do cliente são obrigatórios.");
  }

  const payload = {
    reference_id: orderId,
    customer: {
      name: customerName,
      email: customerEmail,
      ...(input.customer.taxId ? { tax_id: input.customer.taxId.replace(/\D/g, "") } : {}),
    },
    items: [
      {
        reference_id: orderId,
        name: `Pedido ${orderId}`,
        quantity: 1,
        unit_amount: amountInCents(input.amount),
      },
    ],
    qr_codes: [{ amount: { value: amountInCents(input.amount) } }],
  };

  const response = await fetch(PAGBANK_ORDERS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-idempotency-key": orderId,
    },
    body: JSON.stringify(payload),
  });

  const responseBody: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof responseBody === "object" && responseBody !== null && "error_messages" in responseBody
        ? JSON.stringify(responseBody)
        : `PagBank retornou HTTP ${response.status}.`;
    throw new Error(`Falha ao criar cobrança Pix: ${message}`);
  }

  const parsed = pagBankResponseSchema.safeParse(responseBody);
  if (!parsed.success) {
    throw new Error("Resposta do PagBank não contém um QR Code Pix válido.");
  }

  const qrCode = parsed.data.qr_codes?.[0];
  if (!qrCode) throw new Error("QR Code não retornado pelo PagSeguro.");
  const qrCodeImageUrl = qrCode.links?.find((link) => link.rel.toUpperCase() === "QRCODE.PNG")?.href;
  if (!qrCodeImageUrl) {
    throw new Error("O PagBank não retornou a imagem do QR Code Pix.");
  }

  return {
    orderId,
    code: qrCode.text,
    qrCodeImageUrl,
  };
}

const createPagSeguroPixOrderInput = z.object({
  orderId: z.string().uuid(),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email().max(320),
    taxId: z.string().trim().min(11).max(18).optional(),
  }),
});

export const createPagSeguroPixOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => createPagSeguroPixOrderInput.parse(input))
  .handler(async ({ data, context }): Promise<PagSeguroPixOrder> => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, total, status")
      .eq("id", data.orderId)
      .eq("buyer_id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!order) throw new Error("Pedido não encontrado.");
    if (order.status === "paid") throw new Error("Este pedido já foi pago.");
    if (order.status !== "pendente") throw new Error("Este pedido não está aguardando pagamento.");

    const customer: PagSeguroCustomer = {
      name: data.customer.name,
      email: data.customer.email,
      ...(data.customer.taxId ? { taxId: data.customer.taxId } : {}),
    };

    return createPagSeguroPixOrderRequest({
      orderId: order.id,
      amount: Number(order.total),
      customer,
    });
  });
