import { Link } from "@tanstack/react-router";
import { Star, MapPin } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const FEATURED_STORES = [
  {
    id: "1",
    name: "Sertão Couros",
    slug: "sertao-couros",
    category: "Moda e acessórios",
    rating: 4.9,
    location: "Crato, CE",
    logo_url:
      "https://images.unsplash.com/photo-1590674899484-d5640e52263d?w=100&h=100&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Casa da Vó",
    slug: "casa-da-vo",
    category: "Artesanato",
    rating: 4.8,
    location: "Olinda, PE",
    logo_url:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=100&h=100&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Artesanato Nordeste",
    slug: "artesanato-nordeste",
    category: "Decoração",
    rating: 4.7,
    location: "Campina Grande, PB",
    logo_url:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=100&h=100&auto=format&fit=crop",
  },
];

export function FeaturedStores() {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between px-1">
        <h2 className="text-lg font-bold text-foreground">Lojas em destaque</h2>
        <Link to="/buscar" className="text-sm font-medium text-primary hover:underline">
          Ver tudo
        </Link>
      </div>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 pb-2">
          {FEATURED_STORES.map((store) => (
            <CarouselItem key={store.id} className="pl-2 basis-[200px] sm:basis-[240px]">
              <Link
                to="/loja/$slug"
                params={{ slug: store.slug }}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center transition-shadow hover:shadow-md"
              >
                <Avatar className="h-16 w-16 border-2 border-brand-orange-soft mb-3">
                  <AvatarImage src={store.logo_url} alt={store.name} className="object-cover" />
                  <AvatarFallback className="bg-brand-orange-soft text-primary font-bold">
                    {store.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="line-clamp-1 text-sm font-bold text-card-foreground">
                  {store.name}
                </h3>
                <div className="mt-1 flex items-center justify-center gap-1 text-xs text-brand-gold">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="font-bold">{store.rating}</span>
                </div>
                <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                  {store.category}
                </p>
                {store.location && (
                  <div className="mt-1 flex items-center justify-center gap-0.5 text-[10px] text-muted-foreground/80">
                    <MapPin className="h-2.5 w-2.5" />
                    <span>{store.location}</span>
                  </div>
                )}
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
