import { z } from "zod";

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
export async function createPagSeguroPixOrder(
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

  const qrCode = parsed.data.qr_codes[0];
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
