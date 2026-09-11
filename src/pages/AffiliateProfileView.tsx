import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, Ellipsis, Heart, Share2, ShoppingBag, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthUser } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export interface AffiliateProfile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  stats: {
    following: number;
    followers: string;
    likes: string;
  };
  isFollowing: boolean;
}

export interface AffiliateProduct {
  id: string;
  title: string;
  discountPrice: number;
  originalPrice: number;
  imageUrl: string;
  videoCount: number;
  isBestSeller?: boolean;
  affiliateCode: string;
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const defaultProfile: AffiliateProfile = {
  id: "aff-1",
  displayName: "Raquel Santos",
  username: "@raquel_santos",
  avatarUrl:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
  bio: "✨ Achados incríveis para você viver mais bonito, com estilo e conforto. 👀 Produtos selecionados com muito carinho para o seu dia a dia. ... Veja mais",
  stats: {
    following: 428,
    followers: "128K",
    likes: "54K",
  },
  isFollowing: false,
};

const products: AffiliateProduct[] = [
  {
    id: "prod-1",
    title: "Vestido de botão longo alfaiataria cor madeira",
    discountPrice: 249,
    originalPrice: 349,
    imageUrl:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    videoCount: 12,
    isBestSeller: true,
    affiliateCode: "RAQUEL-VESTIDO-01",
  },
  {
    id: "prod-2",
    title: "Vaso de barro rústico para mesa e decoração",
    discountPrice: 41.2,
    originalPrice: 79.0,
    imageUrl:
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80",
    videoCount: 7,
    affiliateCode: "ACHADINHOS-41",
  },
  {
    id: "prod-3",
    title: "Cesta de organização em fibra natural",
    discountPrice: 35.6,
    originalPrice: 64.9,
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    videoCount: 9,
    affiliateCode: "ACHADINHOS-35",
  },
  {
    id: "prod-4",
    title: "Manta de algodão para quarto e sala",
    discountPrice: 52.9,
    originalPrice: 99.0,
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
    videoCount: 4,
    affiliateCode: "ACHADINHOS-52",
  },
  {
    id: "prod-5",
    title: "Luminária de mesa com acabamento em metal",
    discountPrice: 61.4,
    originalPrice: 120.0,
    imageUrl:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80",
    videoCount: 15,
    affiliateCode: "ACHADINHOS-61",
  },
  {
    id: "prod-6",
    title: "Conjunto de taças artesanais para servir",
    discountPrice: 49.9,
    originalPrice: 88.0,
    imageUrl:
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=80",
    videoCount: 6,
    affiliateCode: "ACHADINHOS-49",
  },
];

type TabKey = "Vídeos" | "Produtos";

export function AffiliateProfileView() {
  const { user } = useAuthUser();
  const [profile, setProfile] = useState<AffiliateProfile>(defaultProfile);
  const [activeTab, setActiveTab] = useState<TabKey>("Vídeos");
  const [isFollowing, setIsFollowing] = useState(defaultProfile.isFollowing);

  useEffect(() => {
    if (!user) {
      setProfile(defaultProfile);
      setIsFollowing(defaultProfile.isFollowing);
      return;
    }

    const userMetadata = user.user_metadata ?? {};
    const fullName =
      (userMetadata["full_name"] as string | undefined) ||
      user.email?.split("@")[0] ||
      "Usuária Oxente";
    const sanitizedHandle =
      fullName
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s_]/g, "")
        .replace(/\s+/g, "_")
        .replace(/^_+|_+$/g, "") || "usuario_oxente";

    let active = true;

    supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;

        const profileData = (data ?? {}) as Record<string, unknown>;

        setProfile({
          ...defaultProfile,
          id: user.id,
          displayName: (profileData["full_name"] as string | undefined) || fullName,
          username: `@${sanitizedHandle}`,
          avatarUrl: (profileData["avatar_url"] as string | undefined) || defaultProfile.avatarUrl,
        });
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    setIsFollowing(profile.isFollowing);
  }, [profile]);

  const tabItems = useMemo<TabKey[]>(() => ["Vídeos", "Produtos"], []);

  const handleProductClick = (affiliateCode: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("oxente_affiliate_ref", affiliateCode);
      window.location.href = "/produto/preview";
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3f0] text-neutral-900">
      <div className="mx-auto max-w-md bg-[#f6f4f2]">
        <header className="sticky top-0 z-10 bg-[#f6f4f2]/95 px-4 pb-3 pt-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Voltar"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-black/5"
            >
              <ArrowLeft className="h-5 w-5 text-neutral-800" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Compartilhar perfil"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-black/5"
              >
                <Share2 className="h-4 w-4 text-neutral-800" />
              </button>
              <button
                type="button"
                aria-label="Mais opções"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm ring-1 ring-black/5"
              >
                <Ellipsis className="h-4 w-4 text-neutral-800" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 pb-8">
          <section className="pt-2">
            <div className="flex items-start gap-4">
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-white shadow-md"
              />

              <div className="flex flex-1 items-start justify-between gap-3 pt-1">
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-neutral-900">
                    {profile.stats.following}
                  </span>
                  <span className="text-[11px] text-neutral-500">Seguindo</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-neutral-900">
                    {profile.stats.followers}
                  </span>
                  <span className="text-[11px] text-neutral-500">Seguidores</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-neutral-900">
                    {profile.stats.likes}
                  </span>
                  <span className="text-[11px] text-neutral-500">Curtidas</span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-1">
                <h1 className="text-lg font-bold text-neutral-900">{profile.displayName}</h1>
                <BadgeCheck className="h-4 w-4 text-orange-500" />
              </div>
              <p className="mt-1 text-sm text-neutral-500">Nome de usuário: {profile.username}</p>
            </div>

            <p className="mt-3 text-sm leading-5 text-neutral-700">
              {profile.bio} <span className="font-semibold text-neutral-500">Veja mais</span>
            </p>

            <button
              type="button"
              onClick={() => setIsFollowing((prev) => !prev)}
              className={cn(
                "mt-4 flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors",
                isFollowing ? "bg-neutral-900 text-white" : "bg-orange-600 hover:bg-orange-500",
              )}
            >
              {isFollowing ? "Seguindo" : "Seguir"}
            </button>
          </section>

          <nav className="mt-6 border-b border-neutral-200">
            <div className="flex items-center justify-center gap-8">
              {tabItems.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative pb-3 text-sm font-semibold transition-colors",
                    activeTab === tab ? "text-neutral-900" : "text-neutral-500",
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-neutral-900" />
                  )}
                </button>
              ))}
            </div>
          </nav>

          <section className="mt-4">
            {activeTab === "Produtos" ? (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductClick(product.affiliateCode)}
                    className="overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-black/5"
                  >
                    <div className="relative">
                      {product.isBestSeller && (
                        <span className="absolute left-2 top-2 z-10 rounded-full bg-rose-500 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white">
                          MAIS VENDIDO
                        </span>
                      )}

                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-36 w-full object-cover"
                      />

                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-end bg-gradient-to-t from-black/65 to-transparent px-2 pb-2 pt-6">
                        <span className="rounded-full bg-black/35 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                          ▶ {product.videoCount} vídeos
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5">
                      <p className="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-5 text-neutral-800">
                        {product.title}
                      </p>

                      <div className="mt-2 flex items-center gap-1 text-[11px] text-neutral-500">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>4,8</span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-extrabold text-red-500">
                          {formatBRL(product.discountPrice)}
                        </span>
                        <span className="text-[11px] text-neutral-400 line-through">
                          {formatBRL(product.originalPrice)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {products.slice(0, 2).map((product) => (
                  <button
                    key={`video-${product.id}`}
                    type="button"
                    onClick={() => handleProductClick(product.affiliateCode)}
                    className="relative block w-full overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-black/5"
                  >
                    <div className="relative">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-56 w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                        <ShoppingBag className="h-3 w-3" />
                        {product.videoCount} vídeos
                      </div>
                    </div>

                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium text-neutral-800">
                        {product.title}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-extrabold text-red-500">
                          {formatBRL(product.discountPrice)}
                        </span>
                        <span className="text-[11px] text-neutral-400 line-through">
                          {formatBRL(product.originalPrice)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default AffiliateProfileView;
