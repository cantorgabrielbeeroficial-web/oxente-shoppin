import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "@tanstack/react-router";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

// Espaços de propaganda: troque por uma arte real quando houver anunciante.
const AD_BANNERS = [
  { id: "ad-1", title: "Anuncie aqui", text: "Seu produto na vitrine da Oxente", color: "from-orange-500 to-amber-400" },
  { id: "ad-2", title: "Oferta do Sertão", text: "Preço de xique-xique", color: "from-rose-500 to-orange-400" },
  { id: "ad-3", title: "Frete arretado", text: "Entrega para todo o Brasil", color: "from-emerald-600 to-lime-400" },
  { id: "ad-4", title: "Moda nordestina", text: "Estilo com identidade", color: "from-fuchsia-600 to-pink-400" },
  { id: "ad-5", title: "Artesanato raiz", text: "Feito à mão, feito com amor", color: "from-amber-700 to-yellow-400" },
  { id: "ad-6", title: "Sabores do Nordeste", text: "Da roça pra sua mesa", color: "from-red-600 to-orange-400" },
  { id: "ad-7", title: "Cupom Oxente", text: "Pegue o seu e economize", color: "from-sky-600 to-cyan-400" },
  { id: "ad-8", title: "Lojas oficiais", text: "Compra segura e garantida", color: "from-indigo-600 to-violet-400" },
  { id: "ad-9", title: "Live Oxente", text: "Ofertas ao vivo todo dia", color: "from-purple-600 to-fuchsia-400" },
  { id: "ad-10", title: "Venda na Oxente", text: "Abra sua loja hoje mesmo", color: "from-teal-600 to-emerald-400" },
] as const;

export function AdBanners({ className }: { className?: string }) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const plugin = React.useRef(Autoplay({ delay: 4000, stopOnInteraction: false }));

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <Carousel setApi={setApi} plugins={[plugin.current]} opts={{ loop: true }}>
        <CarouselContent className="ml-0">
          {AD_BANNERS.map((banner) => (
            <CarouselItem key={banner.id} className="pl-0">
              <Link
                to="/vendedor"
                className={cn(
                  "flex aspect-[2/1] max-h-[220px] w-full flex-col justify-center bg-gradient-to-r px-6 text-white",
                  banner.color,
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                  Publicidade
                </span>
                <span className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">
                  {banner.title}
                </span>
                <span className="mt-1 text-sm sm:text-base">{banner.text}</span>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {AD_BANNERS.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Banner ${index + 1}`}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                current === index ? "w-4 bg-white" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
