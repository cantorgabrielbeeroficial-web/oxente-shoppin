import { Link } from "@tanstack/react-router";
import { Home, BadgeCheck, PlaySquare, Bell, User } from "lucide-react";

const TABS = [
  { to: "/", label: "Início", icon: Home },
  { to: "/oficiais", label: "Oficiais", icon: BadgeCheck },
  { to: "/live", label: "Live e Vídeo", icon: PlaySquare, badge: "Novo" },
  { to: "/notificacoes", label: "Notificações", icon: Bell, badge: "41" },
  { to: "/eu", label: "Eu", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <Link
              to={tab.to}
              activeOptions={{ exact: tab.to === "/" }}
              className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <span className="relative">
                <tab.icon className="h-5 w-5" />
                {"badge" in tab && tab.badge && (
                  <span className="absolute -right-3.5 -top-1.5 rounded-full bg-primary px-1 text-[8px] font-bold leading-4 text-primary-foreground">
                    {tab.badge}
                  </span>
                )}
              </span>
              <span className="leading-none">{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
