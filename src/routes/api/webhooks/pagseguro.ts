import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const pagBankWebhookSchema = z.object({
  reference_id: z.string().trim().min(1).max(120),
  charges: z
    .array(
      z.object({
        status: z.string().trim().min(1),
      }),
    )
    .optional(),
  status: z.string().trim().optional(),
});

function paymentStatus(payload: z.infer<typeof pagBankWebhookSchema>): string | null {
  return payload.charges?.[0]?.status?.toUpperCase() ?? payload.status?.toUpperCase() ?? null;
}

export const Route = createFileRoute("/api/webhooks/pagseguro")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const payload = pagBankWebhookSchema.parse(await request.json());
          const status = paymentStatus(payload);

          if (!status) {
            return Response.json({ error: "Status de pagamento ausente." }, { status: 400 });
          }

          if (status === "PAID" || status === "AVAILABLE") {
            const { error } = await supabaseAdmin
              .from("orders")
              .update({ status: "paid" })
              .eq("id", payload.reference_id)
              .neq("status", "paid");

            if (error) {
              console.error("Erro ao atualizar pedido após webhook PagBank:", error);
              return Response.json({ error: "Falha ao atualizar o pedido." }, { status: 500 });
            }
          }

          return Response.json({ received: true }, { status: 200 });
        } catch (error) {
          if (error instanceof z.ZodError || error instanceof SyntaxError) {
            return Response.json({ error: "Payload de webhook inválido." }, { status: 400 });
          }

          console.error("Erro ao processar webhook PagBank:", error);
          return Response.json({ error: "Falha ao processar o webhook." }, { status: 500 });
        }
      },
    },
  },
});