import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShieldCheck,
  Truck,
  Store as StoreIcon,
  Shirt,
  Radio,
  Home as HomeIcon,
  Palette,
  Flower,
  Trophy,
  Coins,
  Ticket,
  PackageSearch,
  PlaySquare,
  BadgeCheck,
  ChevronRight,
  Play,
  Star,
} from "lucide-react";
import { listCategories } from "@/lib/catalog.functions";
import { BannerCarousel } from "@/components/banner-carousel";
import { MobileSearchBar } from "@/components/mobile-search-bar";
import { PromoCarousel } from "@/components/promo-carousel";
import coinIcon from "@/assets/oxente-coin.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategories(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oxente — Marketplace" },
      {
        name: "description",
        content: "Marketplace nordestino com lojas, produtos e achados especiais.",
      },
      { property: "og:title", content: "Oxente — Marketplace" },
      {
        property: "og:description",
        content: "Lojas e produtos selecionados para comprar no Oxente.",
      },
    ],
  }),
  component: Home,
});

const QUICK_ACCESS = [
  { label: "Moedas", to: "/eu", icon: Coins, image: coinIcon },
  { label: "Cupons", to: "/notificacoes", icon: Ticket, image: "/imagem-cupons.png" },
  { label: "Estoque Direto", to: "/buscar", icon: PackageSearch },
  { label: "Live", to: "/live", icon: PlaySquare },
  { label: "Lojas Oficiais", to: "/oficiais", icon: BadgeCheck },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CATEGORY_ICONS: Record<string, any> = {
  moda: Shirt,
  eletronicos: Radio,
  "casa-e-decoracao": HomeIcon,
  artesanato: Palette,
  beleza: Flower,
  esporte: Trophy,
};

const FAKE_OFFICIAL_PRODUCT = {
  store: "Oxente Oficial",
  name: "Bolsa oficial Oxente em lona resistente",
  description:
    "Escolha o acabamento ideal para sua rotina. As opções mudam conforme o produto cadastrado pela loja.",
  image: "/so-logo-bolsa.png",
  price: "R$ 89,90",
  options: {
    tipo: ["Alça curta", "Transversal"],
    cor: ["Crua", "Barro", "Preta"],
    tamanho: ["P", "M", "G"],
    espessura: ["Leve", "Reforçada"],
  },
};

type OfficialOption = keyof typeof FAKE_OFFICIAL_PRODUCT.options;

function Home() {
  const { data: categories = [] } = useQuery({
    ...categoriesQuery,
    enabled: typeof window !== "undefined",
  });
  const [officialOpen, setOfficialOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<OfficialOption, string>>({
    tipo: FAKE_OFFICIAL_PRODUCT.options.tipo[0] ?? "",
    cor: FAKE_OFFICIAL_PRODUCT.options.cor[0] ?? "",
    tamanho:
      FAKE_OFFICIAL_PRODUCT.options.tamanho[1] ?? FAKE_OFFICIAL_PRODUCT.options.tamanho[0] ?? "",
    espessura:
      FAKE_OFFICIAL_PRODUCT.options.espessura[1] ??
      FAKE_OFFICIAL_PRODUCT.options.espessura[0] ??
      "",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <section className="relative -mx-4 -mt-6 overflow-hidden lg:mx-0 lg:mt-0">
        <BannerCarousel />
        <MobileSearchBar className="absolute inset-x-3 top-2 z-30 sm:hidden" />
      </section>

      <section className="-mx-4 mt-1 flex items-start gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:mt-6 md:grid md:grid-cols-6 md:gap-1 md:rounded-xl md:border md:border-border md:bg-card md:p-2">
        {QUICK_ACCESS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex w-[74px] shrink-0 flex-col items-center gap-1.5 rounded-lg p-1 text-center hover:bg-accent/50 md:w-auto"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-primary md:h-9 md:w-9 md:rounded-full ${item.label === "Cupons" ? "bg-transparent shadow-none" : "bg-brand-orange-soft shadow-sm md:shadow-none"}`}
            >
              {"image" in item ? (
                <img
                  src={item.image}
                  alt=""
                  className="h-16 w-16 object-contain mix-blend-multiply md:h-14 md:w-14"
                />
              ) : (
                <item.icon className="h-5 w-5 md:h-4 md:w-4" />
              )}
            </span>
            <span className="text-[10px] font-medium leading-tight text-card-foreground sm:text-[11px]">
              {item.label}
            </span>
          </Link>
        ))}
        <Link
          to="/buscar"
          aria-label="Ver todos os atalhos"
          className="flex w-[54px] shrink-0 flex-col items-center gap-1.5 rounded-lg p-1 text-center hover:bg-accent/50 md:w-auto"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-orange-soft text-primary shadow-sm md:h-9 md:w-9 md:rounded-full md:shadow-none">
            <ChevronRight className="h-5 w-5 md:h-4 md:w-4" />
          </span>
          <span className="text-[10px] font-medium leading-tight text-card-foreground sm:text-[11px]">
            Tudo
          </span>
        </Link>
      </section>

      <section className="-mx-4 mt-1 px-4 md:mx-0 md:mt-6 md:px-0">
        <PromoCarousel />
      </section>

      <section className="mt-1 hidden gap-2 sm:grid sm:grid-cols-3 sm:gap-3">
        {[
          { icon: ShieldCheck, title: "Compra protegida", text: "Acompanhada do início ao fim." },
          { icon: Truck, title: "Todo Brasil", text: "Lojas de várias regiões." },
          { icon: StoreIcon, title: "Lojas independentes", text: "Vendedores aprovados." },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 sm:flex-col sm:items-start sm:gap-3 sm:p-4"
          >
            <item.icon className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 className="text-[11px] font-bold text-card-foreground sm:text-sm">
                {item.title}
              </h3>
              <p className="hidden text-[10px] text-muted-foreground sm:block">{item.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-4 hidden sm:block">
        <h2 className="text-lg font-bold text-foreground">Categorias</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] || Shirt;
            return (
              <Link
                key={category.id}
                to="/categoria/$slug"
                params={{ slug: category.slug }}
                search={{ canal: "bodega" }}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-primary sm:p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange-soft text-primary sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className="line-clamp-1 text-[10px] font-medium text-card-foreground sm:text-xs">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <Dialog open={officialOpen} onOpenChange={setOfficialOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle>Personalize seu produto</DialogTitle>
            <DialogDescription>{FAKE_OFFICIAL_PRODUCT.description}</DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl bg-muted">
            <img
              src={FAKE_OFFICIAL_PRODUCT.image}
              alt={FAKE_OFFICIAL_PRODUCT.name}
              className="aspect-video w-full object-cover"
            />
          </div>
          <div className="space-y-4">
            {(Object.entries(FAKE_OFFICIAL_PRODUCT.options) as [OfficialOption, string[]][]).map(
              ([name, options]) => (
                <fieldset key={name}>
                  <legend className="mb-2 text-sm font-semibold capitalize text-foreground">
                    {name}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setSelectedOptions((current) => ({ ...current, [name]: option }))
                        }
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${selectedOptions[name] === option ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:border-primary"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ),
            )}
          </div>
          <DialogFooter className="flex-row items-center justify-between gap-3 sm:justify-between">
            <span className="text-lg font-bold text-primary">{FAKE_OFFICIAL_PRODUCT.price}</span>
            <Button type="button" onClick={() => setOfficialOpen(false)}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="-mx-4 mt-8 grid grid-cols-2 gap-2 sm:mx-0 sm:mt-12 sm:gap-5">
        <Link
          to="/live"
          className="group min-w-0 overflow-hidden rounded-none border-y border-border bg-card shadow-sm transition-shadow hover:shadow-lg sm:rounded-xl sm:border"
        >
          <div className="relative aspect-[0.82] w-full overflow-hidden bg-muted sm:aspect-square">
            <video
              src="/video-teste.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
              <Play className="h-3 w-3 fill-current" /> Vídeo
            </span>
          </div>
          <div className="space-y-2 p-3 sm:p-4">
            <h2 className="line-clamp-2 text-sm font-bold leading-tight text-card-foreground sm:text-base">
              Caneca artesanal com estampa nordestina
            </h2>
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Um achado cheio de personalidade para deixar seu café mais especial e levar um
              pedacinho do Nordeste para casa.
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-bold text-primary sm:text-lg">R$ 39,90</span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-xs">
                <Star className="h-3 w-3 fill-brand-gold text-brand-gold" /> 4,9
              </span>
            </div>
            <span className="block text-[10px] text-muted-foreground sm:text-xs">
              1,2 mil vendidos
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setOfficialOpen(true)}
          className="group min-w-0 overflow-hidden rounded-none border-y border-border bg-card text-left shadow-sm transition-shadow hover:shadow-lg sm:rounded-xl sm:border"
        >
          <div className="relative aspect-[0.82] w-full overflow-hidden bg-brand-orange-soft sm:aspect-square">
            <img
              src={FAKE_OFFICIAL_PRODUCT.image}
              alt={FAKE_OFFICIAL_PRODUCT.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="space-y-2 p-3 sm:p-4">
            <h2 className="line-clamp-2 text-sm font-bold leading-tight text-card-foreground sm:text-base">
              {FAKE_OFFICIAL_PRODUCT.name}
            </h2>
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Escolha cor, tamanho e acabamento conforme as opções disponíveis neste produto.
            </p>
            <p className="text-base font-bold text-primary sm:text-lg">
              {FAKE_OFFICIAL_PRODUCT.price}
            </p>
          </div>
        </button>

        <Link
          to="/live"
          className="group min-w-0 overflow-hidden rounded-none border-y border-border bg-card shadow-sm transition-shadow hover:shadow-lg sm:rounded-xl sm:border"
        >
          <div className="relative aspect-[0.82] w-full overflow-hidden bg-muted sm:aspect-square">
            <img
              src="/so-logo-bolsa.png"
              alt="Bolsa artesanal Oxente"
              className="block h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
              Achadinho
            </span>
          </div>
          <div className="space-y-2 p-3 sm:p-4">
            <h2 className="line-clamp-2 text-sm font-bold leading-tight text-card-foreground sm:text-base">
              Bolsa Oxente para levar tudo com estilo
            </h2>
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Prática, bonita e pronta para acompanhar sua rotina, com espaço para tudo que você
              precisa carregar.
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-bold text-primary sm:text-lg">R$ 79,90</span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-xs">
                <Star className="h-3 w-3 fill-brand-gold text-brand-gold" /> 4,8
              </span>
            </div>
            <span className="block text-[10px] text-muted-foreground sm:text-xs">860 vendidos</span>
          </div>
        </Link>
      </section>
    </div>
  );
}
