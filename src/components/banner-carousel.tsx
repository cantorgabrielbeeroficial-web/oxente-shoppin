import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import sellerBannerAsset from "@/assets/oxente-banner-seller.png.asset.json";

const DESKTOP_BANNER_ITEMS = [
  {
    id: "inicio-topo",
    title: "Banner principal da Oxente",
    image: "/Banner-do-inicio-topo-01.png",
    link: "/buscar",
  },
  {
    id: "venda-oxente",
    title: "Venda na Oxente",
    image: sellerBannerAsset.url,
    link: "/vendedor",
  },
];

const MOBILE_BANNER_ITEMS = [
  {
    id: "inicio-topo-mobile",
    title: "Banner principal da Oxente",
    image: "/Banner-do-inicio-topo-01.png",
    link: "/buscar",
  },
];

const MAX_CAROUSEL_CREATIVES = 5;

export function BannerCarousel() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const isMobile = useIsMobile();
  const bannerItems = (isMobile ? MOBILE_BANNER_ITEMS : DESKTOP_BANNER_ITEMS).slice(
    0,
    MAX_CAROUSEL_CREATIVES,
  );

  const plugin = React.useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="group relative w-full overflow-hidden bg-[#f58220] lg:rounded-2xl">
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        className="w-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {bannerItems.map((item) => (
            <CarouselItem key={item.id}>
              <Link
                to={item.link}
                className={cn(
                  "relative block w-full aspect-[2/1]",
                  isMobile ? "max-h-[195px]" : "",
                )}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className={cn(
                    "h-full w-full object-contain object-center",
                    isMobile ? "max-h-[195px]" : "",
                  )}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Custom Navigation */}
        <button
          onClick={() => api?.scrollPrev()}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-md"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => api?.scrollNext()}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-md"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {bannerItems.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300",
                current === index ? "bg-white w-8" : "bg-white/30 hover:bg-white/50",
              )}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
