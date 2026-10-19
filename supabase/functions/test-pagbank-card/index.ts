import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PAGBANK_TOKEN = Deno.env.get("PAGBANK_TOKEN");
// Forçando explicitamente a URL de Produção do PagBank
const PAGBANK_URL = "https://api.pagseguro.com/orders";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== INICIANDO TESTE DE CARTÃO (PRODUÇÃO) ===");
    console.log("Token configurado:", PAGBANK_TOKEN ? "PRESENTE (Tamanho: " + PAGBANK_TOKEN.length + ")" : "AUSENTE");

    const orderPayload = {
      reference_id: `OXENTE-PROD-${Date.now()}`,
      customer: {
        name: "GABRIEL PEREIRA DA SILVA",
        email: "cantorgabrielbeeroficial@gmail.com",
        tax_id: "11371165440", // CPF real da conta para testes de homologação
      },
      items: [
        {
          reference_id: "ITEM-01",
          name: "Produto Teste Homologacao Cartao",
          quantity: 1,
          unit_amount: 100, // R$ 1,00 em centavos
        },
      ],
      charges: [
        {
          reference_id: `CHARGE-${Date.now()}`,
          description: "Homologacao Cartao Oxente Shoppin",
          amount: {
            value: 100,
            currency: "BRL",
          },
          payment_method: {
            type: "CREDIT_CARD",
            installments: 1,
            capture: true,
            card: {
              number: "4111111111111111",
              exp_month: "12",
              exp_year: "2030",
              security_code: "123",
              holder: {
                name: "GABRIEL PEREIRA DA SILVA",
              },
            },
          },
        },
      ],
    };

    const response = await fetch(PAGBANK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAGBANK_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const responseData = await response.json();

    console.log(`Status HTTP Retornado: ${response.status}`);
    console.log("Resposta PagBank:", JSON.stringify(responseData));

    return new Response(
      JSON.stringify({
        http_status: response.status,
        request_sent: orderPayload,
        pagbank_response: responseData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});