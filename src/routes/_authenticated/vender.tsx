import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Store as StoreIcon, Rocket, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMyStore } from "@/lib/seller.functions";

export const Route = createFileRoute("/_authenticated/vender")({
  head: () => ({
    meta: [
      { title: "Vender no Oxente — Crie sua loja instantaneamente" },
      {
        name: "description",
        content: "Abra sua loja no Oxente agora mesmo e comece a vender para todo o Brasil.",
      },
      { property: "og:title", content: "Vender no Oxente — Crie sua loja instantaneamente" },
      {
        property: "og:description",
        content: "Abra sua loja no Oxente agora mesmo e comece a vender para todo o Brasil.",
      },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const navigate = useNavigate();
  const createStore = useServerFn(createMyStore);
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => createStore({ data }),
    onSuccess: (store) => {
      toast.success("Loja criada com sucesso! Boas vendas.");
      navigate({ to: "/painel" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível criar a loja.");
    },
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    mutation.mutate({ name: storeName, description });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <StoreIcon className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Sua loja no ar em segundos.
          </h1>
          <p className="text-lg text-muted-foreground">
            No Oxente, valorizamos o seu tempo. Crie sua vitrine agora, cadastre seus produtos e
            comece a vender para todo o Brasil sem burocracia.
          </p>

          <ul className="space-y-4">
            {[
              "Cadastro instantâneo e sem análise manual",
              "Painel de controle completo para gerenciar produtos",
              "Split de pagamento automático e seguro",
              "Sua marca em destaque para milhares de compradores",
            ].map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 text-sm font-medium text-foreground"
              >
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-card-foreground">Dados da sua nova loja</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="store-name">Nome da loja</Label>
              <Input
                id="store-name"
                required
                maxLength={80}
                placeholder="Ex: Artesanatos do Cangaço"
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Você poderá mudar isso depois.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-description">O que você vende?</Label>
              <Textarea
                id="store-description"
                rows={4}
                required
                maxLength={600}
                placeholder="Conte um pouco sobre seus produtos e sua história..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <Button type="submit" size="lg" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Criando loja..." : "Criar minha loja agora"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Ao criar a loja, você concorda com os nossos termos de uso e comissão de venda.
            </p>
          </form>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link to="/" className="text-sm font-medium text-primary hover:underline">
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
