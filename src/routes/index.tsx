import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { listCategories, listProducts } from "@/lib/catalog.functions";
import { formatBRL } from "@/lib/format";
import { BannerCarousel } from "@/components/banner-carousel";
import { MobileSearchBar } from "@/components/mobile-search-bar";
import { PromoCarousel } from "@/components/promo-carousel";
import { ProductCard } from "@/components/product-card";
const coinIcon = "/oxente-coin.png";

const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategories(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oxente â€” Marketplace" },
      {
        name: "description",
        content: "Marketplace nordestino com lojas, produtos e achados especiais.",
      },
      { property: "og:title", content: "Oxente â€” Marketplace" },
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

function Home() {
  const { data: categories = [] } = useQuery({
    ...categoriesQuery,
    enabled: typeof window !== "undefined",
  });
  const { data: testProducts = [] } = useQuery({
    queryKey: ["home-test-product"],
    queryFn: () => listProducts({ data: { search: "Fone de Ouvido Bluetooth Sem Fio", limit: 1 } }),
    enabled: typeof window !== "undefined",
  });
  const { data: officialProducts = [] } = useQuery({
    queryKey: ["home-products", "interligada"],
    queryFn: () => listProducts({ data: { storeKind: "interligada", limit: 12 } }),
    enabled: typeof window !== "undefined",
  });
  const { data: bodegaProducts = [] } = useQuery({
    queryKey: ["home-products", "bodega"],
    queryFn: () => listProducts({ data: { storeKind: "bodega", limit: 12 } }),
    enabled: typeof window !== "undefined",
  });
  const testProduct = testProducts[0];
  const featuredProducts = [
    ...(testProduct ? [testProduct] : []),
    ...[...bodegaProducts, ...officialProducts].filter((product) => product.id !== testProduct?.id),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <section className="relative -mx-4 -mt-6 overflow-hidden lg:mx-0 lg:mt-0">
        <div className="bg-primary px-3 pb-2 pt-2 sm:hidden">
          <MobileSearchBar />
        </div>
        <BannerCarousel />
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

      <section className="-mx-4 mt-4 bg-card px-2 pb-4 pt-3 sm:mx-0 sm:rounded-xl sm:border sm:border-border sm:px-4">
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Da Bodega pra tua casa
            </span>
            <h2 className="mt-0.5 text-lg font-bold text-foreground">Achadinhos de hoje</h2>
          </div>
          <Link to="/buscar" className="text-xs font-semibold text-primary hover:underline">
            Ver tudo
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          <Link
            to="/live"
            className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-shadow hover:shadow-lg"
            aria-label="Assistir vÃ­deo de afiliada na aba VÃ­deos"
          >
            <div className="relative aspect-square overflow-hidden bg-muted">
              <video
                src="/video-teste.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold text-white">
                <Play className="h-3 w-3 fill-current" />
                VÃ­deo de afiliada
              </span>
              <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-semibold text-white">
                <PlaySquare className="h-3.5 w-3.5" />
                Ver na Bodega
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1 p-2 sm:p-3">
              <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-card-foreground sm:text-sm">
                Vestido de botÃ£o longo, visse que achado!
              </h3>
              <p className="mt-auto text-base font-bold text-primary sm:text-lg">
                {formatBRL(249)}
              </p>
              <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                Raquel Santos Â· Afiliada
              </p>
            </div>
          </Link>

          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mt-1 hidden gap-2 sm:grid sm:grid-cols-3 sm:gap-3">
        {[
          { icon: ShieldCheck, title: "Compra protegida", text: "Acompanhada do inÃ­cio ao fim." },
          { icon: Truck, title: "Todo Brasil", text: "Lojas de vÃ¡rias regiÃµes." },
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
    </div>
  );
}
