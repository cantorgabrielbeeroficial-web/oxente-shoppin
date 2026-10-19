import LiveFeed from "./LiveFeed";
import { useRef, useState } from "react";
import {
  Bell,
  Camera,
  Heart,
  Home,
  MessageCircle,
  Pause,
  Play,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

export interface AffiliatePF {
  id: string;
  fullName: string;
  handle: string;
  avatarUrl: string;
  pixKey: string;
}

// Mock ou tipo para o feed (ajuste conforme seu código real)
const feedPosts: any[] = []; // Mantenha sua lista de posts original aqui

const tabs = ["Vídeos", "Lives", "Para você"] as const;

export function AchadinhosFeed() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Vídeos");
  const [posts, setPosts] = useState<any[]>(feedPosts);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [videoPlaying, setVideoPlaying] = useState<Record<string, boolean>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentPost = posts[0];

  const handleLikeToggle = (postId: string) => {
    const isLiked = !!likedMap[postId];
    setLikedMap((prev) => ({ ...prev, [postId]: !isLiked }));
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          likes: Math.max(0, post.likes + (isLiked ? -1 : 1)),
        };
      }),
    );
  };

  const handleBuyWithCoupon = (affiliateCode: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("oxente_affiliate_ref", affiliateCode);
      window.location.href = "/checkout";
    }
  };

  const handleShare = async (post: any) => {
    if (typeof navigator === "undefined") return;
    const shareData = {
      title: post.product.title,
      text: `Indicação de ${post.affiliate.handle} — ${post.product.title}`,
      url: `${window.location.origin}/live#${post.id}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
      }
    } catch (error) {
      console.error("Share failed", error);
    }
  };

  const toggleVideoPlayback = () => {
    const videoNode = videoRef.current;
    if (!videoNode || !currentPost) return;

    if (videoNode.paused) {
      void videoNode.play();
      setVideoPlaying((prev) => ({ ...prev, [currentPost.id]: true }));
    } else {
      videoNode.pause();
      setVideoPlaying((prev) => ({ ...prev, [currentPost.id]: false }));
    }
  };

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-black text-white">
      
      {/* HEADER FIXO COM AS ABAS */}
      <header className="absolute inset-x-0 top-0 z-30 px-3 pb-4 pt-3">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Perfil do afiliado"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/25 backdrop-blur-sm"
            >
              <User className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex items-center gap-5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 backdrop-blur-md">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "relative text-[11px] font-medium transition-colors",
                  activeTab === tab ? "text-white" : "text-white/60",
                )}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute -bottom-1.5 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-white/90" />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Buscar"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/25 backdrop-blur-sm"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Câmera"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/25 backdrop-blur-sm"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* RENDERIZAÇÃO CONDICIONAL: SE FOR "Lives", MOSTRA O LIVEFEED. SENÃO, MOSTRA OS VÍDEOS */}
      {activeTab === "Lives" ? (
        <div className="pt-16">
          <LiveFeed />
        </div>
      ) : currentPost ? (
        <>
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              src={currentPost.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              onPlay={() => setVideoPlaying((prev) => ({ ...prev, [currentPost.id]: true }))}
              onPause={() => setVideoPlaying((prev) => ({ ...prev, [currentPost.id]: false }))}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/30" />
          </div>

          {/* Botões laterais de interação */}
          <div className="absolute inset-y-0 right-3 z-30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 pb-20 pt-32">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-white/10 shadow-lg backdrop-blur-sm">
                  <img
                    src={currentPost.affiliate.avatarUrl}
                    alt={currentPost.affiliate.fullName}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleLikeToggle(currentPost.id)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
                >
                  <Heart
                    className={cn(
                      "h-6 w-6 transition-colors",
                      likedMap[currentPost.id] ? "fill-red-500 text-red-500" : "text-white",
                    )}
                  />
                </button>
                <span className="text-[10px] font-semibold text-white/90">
                  {currentPost.likes.toLocaleString("pt-BR")}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleShare(currentPost)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
                >
                  <Share2 className="h-6 w-6" />
                </button>
                <span className="text-[10px] font-semibold text-white/90">Compartilhar</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
                >
                  <MessageCircle className="h-6 w-6" />
                </button>
                <span className="text-[10px] font-semibold text-white/90">{currentPost.comments}</span>
              </div>

              <button
                type="button"
                onClick={toggleVideoPlayback}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/25 backdrop-blur-sm"
              >
                {videoPlaying[currentPost.id] ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Card do produto no rodapé */}
          <div className="absolute inset-x-0 bottom-0 z-30 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-md px-3">
              <div className="mb-3 overflow-hidden rounded-[18px] bg-white/95 text-black shadow-2xl shadow-black/30">
                <div className="flex items-center gap-2.5 p-2.5">
                  <img
                    src={currentPost.product.imageUrl}
                    alt={currentPost.product.title}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-neutral-800">
                      {currentPost.product.title}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-neutral-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4,8
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold text-neutral-900">
                      R$ {currentPost.product.discountPrice} no Pix
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleBuyWithCoupon(currentPost.affiliateCode)}
                  className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-2 text-[11px] font-bold text-white"
                >
                  Comprar com cupom
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* BARRA DE NAVEGAÇÃO INFERIOR */}
      <nav className="absolute inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2.5">
          {[
            { label: "Início", icon: Home, active: true },
            { label: "Oficinas", icon: Sparkles },
            { label: "Vídeos", icon: Play },
            { label: "Notificações", icon: Bell },
            { label: "Perfil", icon: User },
          ].map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              type="button"
              className="flex flex-col items-center gap-1 text-[10px] font-medium"
            >
              <Icon className={cn("h-5 w-5", active ? "text-white" : "text-white/60")} />
              <span className={cn(active ? "text-white" : "text-white/60")}>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default AchadinhosFeed;