import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-brand-navy text-brand-navy-foreground">
      <div className="mx-auto hidden max-w-7xl gap-8 px-4 py-10 sm:grid sm:grid-cols-3">
        <div>
          <h2 className="text-lg font-extrabold">Oxente</h2>
          <p className="mt-2 text-sm opacity-80">
            O marketplace do jeitinho nordestino: várias lojas, um só lugar.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">Comprar</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/" className="opacity-80 hover:opacity-100">
                Início
              </Link>
            </li>
            <li>
              <Link to="/carrinho" className="opacity-80 hover:opacity-100">
                Meu carrinho
              </Link>
            </li>
            <li>
              <Link to="/pedidos" className="opacity-80 hover:opacity-100">
                Meus pedidos
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide opacity-70">Vender</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/vender" className="opacity-80 hover:opacity-100">
                Abrir minha loja
              </Link>
            </li>
            <li>
              <Link to="/entrar" className="opacity-80 hover:opacity-100">
                Entrar na conta
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="hidden border-t border-white/10 py-4 text-center text-xs opacity-70 sm:block">
        © {new Date().getFullYear()} Oxente Marketplace. Pedidos de demonstração, sem cobrança real.
      </div>
    </footer>
  );
}
