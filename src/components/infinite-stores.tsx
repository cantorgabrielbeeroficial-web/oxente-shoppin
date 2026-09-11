import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, MapPin, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type StoreCard = {
  id: string;
  name: string;
  slug: string;
  category: string;
  rating: number;
  location: string;
  logo_url: string;
};

const STORE_POOL: StoreCard[] = [
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
  {
    id: "4",
    name: "Rendas de Alagoas",
    slug: "rendas-de-alagoas",
    category: "Casa e cama",
    rating: 4.8,
    location: "Maceió, AL",
    logo_url:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=100&h=100&auto=format&fit=crop",
  },
  {
    id: "5",
    name: "Tempero do Cariri",
    slug: "tempero-do-cariri",
    category: "Alimentos regionais",
    rating: 4.9,
    location: "Juazeiro do Norte, CE",
    logo_url:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&auto=format&fit=crop",
  },
  {
    id: "6",
    name: "Cangaço Store",
    slug: "cangaco-store",
    category: "Moda",
    rating: 4.6,
    location: "Petrolina, PE",
    logo_url:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&auto=format&fit=crop",
  },
];

const PAGE_SIZE = 6;

export function InfiniteStores() {
  const [items, setItems] = useState<StoreCard[]>(() => STORE_POOL.slice(0, PAGE_SIZE));
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || loading) return;
        setLoading(true);
        window.setTimeout(() => {
          setItems((prev) => {
            const page = Math.floor(prev.length / PAGE_SIZE);
            const next = STORE_POOL.map((store, index) => ({
              ...store,
              id: `${store.id}-${page}-${index}`,
            }));
            return [...prev, ...next];
          });
          setLoading(false);
        }, 600);
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loading]);

  return (
    <section className="mt-8">
      <h2 className="mb-3 px-1 text-lg font-bold text-foreground">Mais lojas pra tu conhecer</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((store) => (
          <Link
            key={store.id}
            to="/loja/$slug"
            params={{ slug: store.slug }}
            className="flex flex-col items-center rounded-xl border border-border bg-card p-4 text-center transition-shadow hover:shadow-md"
          >
            <Avatar className="mb-3 h-14 w-14 border-2 border-brand-orange-soft">
              <AvatarImage src={store.logo_url} alt={store.name} className="object-cover" />
              <AvatarFallback className="bg-brand-orange-soft font-bold text-primary">
                {store.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h3 className="line-clamp-1 text-sm font-bold text-card-foreground">{store.name}</h3>
            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-brand-gold">
              <Star className="h-3 w-3 fill-current" />
              <span className="font-bold">{store.rating}</span>
            </div>
            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{store.category}</p>
            <div className="mt-1 flex items-center justify-center gap-0.5 text-[10px] text-muted-foreground/80">
              <MapPin className="h-2.5 w-2.5" />
              <span>{store.location}</span>
            </div>
          </Link>
        ))}
      </div>
      <div
        ref={sentinel}
        className="flex items-center justify-center py-6 text-xs text-muted-foreground"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando mais lojas...
          </span>
        ) : (
          <span>Arrasta pra cima que tem mais loja, visse?</span>
        )}
      </div>
    </section>
  );
}
