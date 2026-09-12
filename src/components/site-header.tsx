import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ShoppingCart,
  User,
  Store,
  LogOut,
  Menu,
  Camera,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listCategories } from "@/lib/catalog.functions";
import { cartCount } from "@/lib/shop.functions";
import { useAuthUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { user, loading } = useAuthUser();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isHome = pathname === "/";

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
    enabled: typeof window !== "undefined",
    staleTime: 5 * 60 * 1000,
  });

  const { data: count = 0 } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: () => cartCount(),
    enabled: Boolean(user),
  });

  return (
    <header
      className={`sticky top-0 z-50 bg-white text-primary shadow-md ${isHome ? "hidden sm:block" : ""}`}
    >
      <div className="mx-auto flex max-w-7xl flex-nowrap items-center gap-2 px-3 py-2 text-primary sm:flex-wrap sm:gap-3 sm:px-4 sm:py-3">
        <Link to="/" className="hidden shrink-0 items-center sm:flex">
          <img src="/logo-oxente.png" alt="Oxente" className="h-20 w-auto" />
        </Link>

        <form
          className="order-1 flex min-w-0 flex-1 items-center gap-2 sm:order-2 sm:w-auto"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({
              to: "/buscar",
              search: { q: term, categoria: undefined, ordem: "recentes" },
            });
          }}
        >
          <div className="relative flex-1">
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Buscar na Oxente"
              aria-label="Buscar produtos"
              className="border-primary/30 bg-white pr-16 text-primary placeholder:text-primary/60 focus-visible:ring-primary"
            />
            <button
              type="button"
              aria-label="Buscar por foto"
              className="absolute right-8 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-primary hover:bg-primary/10"
            >
              <Camera className="h-4 w-4" />
            </button>
            <button
              type="submit"
              aria-label="Buscar"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-primary hover:bg-primary/10"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="order-2 flex shrink-0 items-center gap-0.5 sm:order-3 sm:ml-auto sm:gap-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-primary hover:bg-primary/10 sm:inline-flex"
          >
            <Link to="/vender">
              <Store className="mr-1 h-4 w-4" />
              Vender no Oxente
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative text-primary hover:bg-primary/10"
          >
            <Link to="/carrinho" aria-label="Carrinho">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>

          <Button asChild variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
            <Link to="/conversas" aria-label="Conversas com vendedores">
              <MessageCircle className="h-5 w-5" />
            </Link>
          </Button>

          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden text-primary hover:bg-primary/10 sm:inline-flex"
                  aria-label="Minha conta"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/pedidos">Meus pedidos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/carrinho">Meu carrinho</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/painel">Minha loja</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden border-primary text-primary hover:bg-primary/10 hover:text-primary sm:inline-flex"
            >
              <Link to="/entrar">Entrar</Link>
            </Button>
          )}
        </div>
      </div>

      <nav className="hidden border-t border-primary/20 bg-primary text-primary-foreground sm:block">
        <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-2 text-sm">
          <span className="flex shrink-0 items-center gap-1 font-semibold">
            <Menu className="h-4 w-4" /> Categorias
          </span>
          {categories.map((category) => (
            <Link
              key={category.id}
              to="/categoria/$slug"
              params={{ slug: category.slug }}
              className="shrink-0 whitespace-nowrap opacity-90 hover:underline hover:opacity-100"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
