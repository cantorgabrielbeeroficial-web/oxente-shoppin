import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const THREADS = [
  {
    id: "1",
    store: "ANJ.GG Store",
    preview: "Oxente! Já separei sua encomenda, painho. Posta amanhã cedinho, viu?",
    time: "14:52",
    unread: 2,
    active: true,
  },
  {
    id: "2",
    store: "Ateliê do Sertão",
    preview: "A rede sai em duas cores, a crua e a barro. Qual tu prefere?",
    time: "11:20",
    unread: 0,
    active: true,
  },
  {
    id: "3",
    store: "Casa Arretada",
    preview: "Obrigada pela compra, minha fia! Qualquer coisa é só chamar aqui.",
    time: "ontem",
    unread: 0,
    active: false,
  },
  {
    id: "4",
    store: "Couro do Cariri",
    preview: "O chapéu tamanho 58 chegou de novo no estoque, arretado demais.",
    time: "21 ago",
    unread: 1,
    active: false,
  },
];

export const Route = createFileRoute("/conversas")({
  head: () => ({
    meta: [
      { title: "Conversas — Oxente" },
      {
        name: "description",
        content: "Fale direto com os vendedores da Oxente e acompanhe suas encomendas pelo chat.",
      },
      { property: "og:title", content: "Conversas — Oxente" },
      { property: "og:description", content: "Chat direto com lojistas e artesãos do Nordeste." },
    ],
  }),
  component: ConversasPage,
});

function ConversasPage() {
  const [filter, setFilter] = useState<"Todos" | "Ativo">("Todos");
  const threads = filter === "Todos" ? THREADS : THREADS.filter((t) => t.active);

  return (
    <div className="mx-auto max-w-2xl pb-24 md:pb-8">
      <header className="flex items-center gap-2 border-b border-border px-3 py-3">
        <Link
          to="/"
          aria-label="Voltar"
          className="rounded-md p-1.5 text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-bold text-foreground">Conversas</h1>
      </header>

      <div className="flex gap-2 px-3 py-3">
        {(["Todos", "Ativo"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
              filter === item
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-border">
        {threads.map((thread) => (
          <li key={thread.id} className="flex items-center gap-3 px-3 py-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-orange-soft text-primary">
              <Store className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{thread.store}</p>
                <span className="shrink-0 text-[10px] text-muted-foreground">{thread.time}</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{thread.preview}</p>
            </div>
            {thread.unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {thread.unread}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
