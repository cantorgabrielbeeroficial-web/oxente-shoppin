import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

const PROMO_SLIDES = [
  {
    id: "live",
    tag: "Live na Oxente",
    title: "30% OFF",
    subtitle: "Desconto de até R$15",
    slots: ["18H", "19H"],
    to: "/live",
  },
  {
    id: "oficiais",
    tag: "Lojas Oficiais",
    title: "Arretado do começo ao fim",
    subtitle: "Produtos oficiais garantidos",
    slots: ["Frete", "Grátis"],
    to: "/oficiais",
  },
  {
    id: "sertao",
    tag: "Direto do sertão",
    title: "Artesanato e couro",
    subtitle: "Feito à mão, com xodó",
    slots: ["Até", "40% OFF"],
    to: "/buscar",
  },
  {
    id: "cupons",
    tag: "Cupons da Oxente",
    title: "Cupons especiais",
    subtitle: "Descontos para suas compras",
    slots: ["Use", "agora"],
    to: "/notificacoes",
  },
  {
    id: "moedas",
    tag: "Moedas da Oxente",
    title: "Ganhe cashback",
    subtitle: "Junte moedas e economize",
    slots: ["Mais", "vantagens"],
    to: "/eu",
  },
] as const;

const MAX_CAROUSEL_CREATIVES = 5;

export function PromoCarousel() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const plugin = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const slides = PROMO_SLIDES.slice(0, MAX_CAROUSEL_CREATIVES);

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="relative">
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        opts={{ loop: true, align: "start" }}
        className="w-full"
      >
        <CarouselContent className="md:ml-0">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="basis-1/2 pl-4 md:basis-full">
              <Link
                to={slide.to}
                className="relative flex h-[84px] min-w-0 items-center gap-2 overflow-hidden rounded-xl bg-primary p-2 text-primary-foreground md:h-[140px] md:gap-3 md:rounded-2xl md:p-3"
              >
                <div className="flex min-w-0 flex-1 flex-col justify-center rounded-lg bg-white px-2 py-2 md:rounded-xl md:px-3">
                  <span className="flex items-center gap-1 truncate text-[9px] font-semibold text-primary md:text-[11px]">
                    <Play className="h-3 w-3 fill-current" /> {slide.tag}
                  </span>
                  <span className="truncate text-sm font-black leading-tight text-foreground md:text-xl">
                    {slide.title}
                  </span>
                  <span className="hidden truncate text-[11px] font-medium text-muted-foreground md:block">
                    {slide.subtitle}
                  </span>
                </div>
                <div className="hidden shrink-0 gap-2 md:flex">
                  {slide.slots.map((slot) => (
                    <span
                      key={slot}
                      className="flex h-14 w-16 items-center justify-center rounded-xl bg-primary-foreground/15 text-sm font-bold"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
                <span className="absolute bottom-1 right-2 rounded-full bg-primary-foreground/20 px-2 text-[8px] font-semibold md:left-1/2 md:right-auto md:-translate-x-1/2 md:px-3 md:text-[10px]">
                  Resgate agora ▸
                </span>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="mt-2 flex justify-center gap-1.5">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            aria-label={`Ir para anúncio ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              current === index ? "w-5 bg-primary" : "w-1.5 bg-primary/30",
            )}
          />
        ))}
      </div>
    </div>
  );
}
