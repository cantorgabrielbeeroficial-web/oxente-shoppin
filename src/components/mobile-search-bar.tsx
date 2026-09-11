import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingCart, Camera, MessageCircle } from "lucide-react";
import { cartCount } from "@/lib/shop.functions";
import { useAuthUser } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/** Search bar + cart/chat shortcuts, made to float over the home banner on mobile. */
export function MobileSearchBar({ className }: { className?: string }) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { user } = useAuthUser();

  const { data: count = 0 } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: () => cartCount(),
    enabled: Boolean(user),
  });

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <form
        className="min-w-0 flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ to: "/buscar", search: { q: term, categoria: undefined, ordem: "recentes" } });
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Buscar na Oxente"
            aria-label="Buscar produtos"
            className="h-10 w-full rounded-full border border-white/40 bg-white/10 pl-9 pr-10 text-sm text-white shadow-sm outline-none placeholder:text-white/80 focus-visible:ring-2 focus-visible:ring-white/40"
          />
          <button
            type="button"
            aria-label="Buscar por foto"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-white"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
      </form>

      <Link
        to="/carrinho"
        aria-label="Carrinho"
        className="relative flex h-10 w-9 shrink-0 items-center justify-center text-white drop-shadow"
      >
        <ShoppingCart className="h-6 w-6" />
        {count > 0 && (
          <span className="absolute -right-1 -top-0.5 rounded-full bg-white px-1.5 text-[10px] font-bold text-primary">
            {count}
          </span>
        )}
      </Link>

      <Link
        to="/conversas"
        aria-label="Conversas com vendedores"
        className="flex h-10 w-9 shrink-0 items-center justify-center text-white drop-shadow"
      >
        <MessageCircle className="h-6 w-6" />
      </Link>
    </div>
  );
}
