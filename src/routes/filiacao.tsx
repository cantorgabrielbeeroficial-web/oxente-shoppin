import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, Check, Instagram, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuthUser } from "@/hooks/use-auth";

const networks = [
  { id: "instagram", label: "Instagram", detail: "Reels, Stories e posts", icon: Instagram },
  { id: "facebook", label: "Facebook", detail: "Página e grupos", icon: UserRound },
  { id: "tiktok", label: "TikTok", detail: "Vídeos curtos e lives", icon: Store },
  { id: "oxente", label: "Oxente", detail: "Bodega, vídeos e lives", icon: Building2 },
] as const;

export const Route = createFileRoute("/filiacao")({
  head: () => ({
    meta: [
      { title: "Começar filiação — Oxente" },
      { name: "description", content: "Configure seu perfil de afiliado e escolha onde vender." },
    ],
  }),
  component: AffiliateOnboardingPage,
});

function AffiliateOnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthUser();
  const [accountType, setAccountType] = useState<"individual" | "company">("individual");
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>(["oxente"]);
  const [handle, setHandle] = useState(String(user?.user_metadata?.["full_name"] ?? ""));

  function toggleNetwork(networkId: string) {
    setSelectedNetworks((current) =>
      current.includes(networkId)
        ? current.filter((id) => id !== networkId)
        : [...current, networkId],
    );
  }

  function submit() {
    if (!handle.trim()) {
      toast.error("Informe o nome do seu perfil");
      return;
    }
    if (selectedNetworks.length === 0) {
      toast.error("Escolha pelo menos uma rede para divulgar");
      return;
    }

    window.localStorage.setItem(
      "oxente_affiliate_application",
      JSON.stringify({
        accountType,
        networks: selectedNetworks,
        handle: handle.trim(),
        userId: user?.id ?? null,
        createdAt: new Date().toISOString(),
      }),
    );
    toast.success("Filiação iniciada! Seu perfil já pode começar a vender.");
    navigate({ to: "/live" });
  }

  return (
    <div className="min-h-screen bg-[#f5f3f0] text-neutral-900">
      <main className="mx-auto max-w-lg px-4 pb-10 pt-5">
        <button
          type="button"
          aria-label="Voltar ao perfil"
          onClick={() => navigate({ to: "/live" })}
          className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <p className="text-sm font-bold uppercase tracking-[0.12em] text-orange-600">
          Oxente Afiliados
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Comece sua filiação</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-neutral-600">
          Escolha seu tipo de perfil e as redes onde você quer impulsionar seus produtos.
        </p>

        <section className="mt-7">
          <h2 className="text-sm font-bold text-neutral-900">Você vai vender como</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { id: "individual" as const, label: "Pessoa física", icon: UserRound },
              { id: "company" as const, label: "Empresa", icon: Building2 },
            ].map((option) => {
              const Icon = option.icon;
              const active = accountType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setAccountType(option.id)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${active ? "border-orange-500 bg-orange-50 text-orange-800 ring-2 ring-orange-100" : "border-neutral-200 bg-white text-neutral-700"}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-bold">{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-7">
          <h2 className="text-sm font-bold text-neutral-900">Onde você quer vender?</h2>
          <div className="mt-3 space-y-2">
            {networks.map((network) => {
              const Icon = network.icon;
              const active = selectedNetworks.includes(network.id);
              return (
                <button
                  key={network.id}
                  type="button"
                  onClick={() => toggleNetwork(network.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${active ? "border-orange-400 bg-orange-50" : "border-neutral-200 bg-white"}`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-orange-600 text-white" : "bg-neutral-100 text-neutral-600"}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-neutral-900">
                      {network.label}
                    </span>
                    <span className="block text-xs text-neutral-500">{network.detail}</span>
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${active ? "border-orange-600 bg-orange-600 text-white" : "border-neutral-300"}`}
                  >
                    {active && <Check className="h-4 w-4" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <label className="mt-7 block text-sm font-bold text-neutral-900">
          Nome do perfil ou empresa
          <input
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="Ex.: Raquel Santos"
            className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-normal outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </label>

        <button
          type="button"
          onClick={submit}
          className="mt-7 flex w-full items-center justify-center rounded-full bg-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-500"
        >
          Iniciar minha filiação
        </button>
      </main>
    </div>
  );
}
