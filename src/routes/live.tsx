import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  BadgeCheck,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  Copy,
  Heart,
  Home,
  MessageCircle,
  MoreHorizontal,
  PlaySquare,
  Plus,
  Reply,
  Send,
  Share2,
  ShoppingCart,
  Star,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { useAuthUser } from "@/hooks/use-auth";
import { hasSupabaseConfig, supabase } from "@/integrations/supabase/client";

const TABS = ["Vídeos", "Lives", "Para você", "Seguindo"] as const;
const FEED = [
  {
    id: "1",
    cover: "/Banner-do-inicio-topo-01.png",
    store: "Ateliê do Sertão",
    storeSlug: "atelie-do-sertao",
    avatar: "/Banner-do-inicio-topo-01.png",
    caption: "Oxente! Rede de descanso feita no tear, direto do Cariri 🧵",
    viewers: 1284,
    likes: "12,4 mil",
    comments: 318,
    product: { name: "Rede de descanso sertaneja", price: 189.9 },
    live: true,
  },
  {
    id: "2",
    cover: "/Banner-do-inicio-topo-01.png",
    videoUrl: "/video-teste.mp4",
    store: "Raquel Santos",
    storeSlug: "raquel-santos",
    avatar: "/Banner-do-inicio-topo-01.png",
    caption:
      "Vestido de botão longo alfaiataria em cor madeira, com corte elegante e acabamento sofisticado para ocasiões especiais.",
    viewers: 842,
    likes: "3,8 mil",
    comments: 41,
    product: {
      name: "Vestido de botão longo alfaiataria cor madeira",
      price: 249.0,
      affiliateCode: "RAQUEL-VESTIDO-01",
    },
    live: false,
  },
];

interface FloatingHeart {
  id: number;
  left: number;
}

interface FloatingCoinReward {
  id: number;
}

const EMOJI_LIST = ["❤️", "🔥", "👏", "🌵", "😍", "✨"];

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Bodega — Rede social de vendedores" },
      {
        name: "description",
        content:
          "Assista lives e vídeos dos vendedores da Oxente e compre artesanato nordestino ao vivo.",
      },
      { property: "og:title", content: "Bodega — Rede social de vendedores" },
      {
        property: "og:description",
        content: "Lives e vídeos com artesanato, decoração e moda do Nordeste.",
      },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { user } = useAuthUser();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Vídeos");
  const [currentUserProfile, setCurrentUserProfile] = useState({
    avatarUrl: "",
    fullName: "Usuária Oxente",
    handle: "usuario_oxente",
  });
  const [likedItems, setLikedItems] = useState<string[]>([]);
  const [followedStores, setFollowedStores] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({
    "1": 12846,
    "2": 3840,
  });
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({
    "1": 318,
    "2": 41,
  });
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({
    "1": 45,
    "2": 128,
  });

  // ESTADO DA BARRA DE ANÚNCIO (ABRE AUTOMÁTICO E FECHA COM 10 SEGUNDOS)
  const [showAnnouncementDetails, setShowAnnouncementDetails] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnnouncementDetails(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // ESTADO DO MODAL DE COMENTÁRIOS DOS VÍDEOS
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("2");
  const [videoInputText, setVideoInputText] = useState("");

  // ESTADO DA GAVETA DE COMPARTILHAMENTO
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTargetItem, setShareTargetItem] = useState<(typeof FEED)[number] | null>(null);

  // ESTADO DO PROGRESSO E ANIMAÇÃO DA MOEDA OXENTE
  const [coinProgress, setCoinProgress] = useState(25);
  const [isDraggingCoin, setIsDraggingCoin] = useState(false);
  const [floatingCoinRewards, setFloatingCoinRewards] = useState<FloatingCoinReward[]>([]);

  const [liveInputText, setLiveInputText] = useState("");
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [commentsMap, setCommentsMap] = useState<
    Record<string, Array<{ id: string; body: string; name: string; avatar?: string; time: string }>>
  >({
    "1": [
      { id: "c1", body: "de entrega para Paulista - PE?", name: "Maria Clara", time: "2m" },
      { id: "c2", body: "Já garanti a minha com o cupom! 🌵❤️", name: "Ana Souza", time: "1m" },
      { id: "c3", body: "oi", name: "Raquel Santos", time: "agora" },
    ],
    "2": [
      { id: "vc1", body: "Que lindo esse vestido! Coube certinho? 😍", name: "Juliana Silva", time: "10m" },
      { id: "vc2", body: "O tecido é linho ou viscose?", name: "Mariana Costa", time: "5m" },
      { id: "vc3", body: "Entregam em Recife?", name: "Carla Pimentel", time: "2m" },
    ],
  });

  // ESTADO PARA ESCONDER/EXIBIR APENAS AS ABAS NA LIVE
  const [showLiveTabs, setShowLiveTabs] = useState(true);
  const liveTabsTimer = useRef<NodeJS.Timeout | null>(null);

  const visibleFeed =
    tab === "Vídeos"
      ? FEED.filter((item) => !item.live)
      : tab === "Lives"
        ? FEED.filter((item) => item.live)
        : FEED;

  const isCurrentLiveTab = tab === "Lives";

  // PROGRESSO DO ANEL E EFEITO VISUAL DE FATURAMENTO NO ÍCONE
  useEffect(() => {
    if (isCurrentLiveTab) return;
    const interval = setInterval(() => {
      setCoinProgress((prev) => {
        if (prev >= 100) {
          const newReward: FloatingCoinReward = { id: Date.now() };
          setFloatingCoinRewards((current) => [...current, newReward]);
          setTimeout(() => {
            setFloatingCoinRewards((current) => current.filter((r) => r.id !== newReward.id));
          }, 1200);

          return 0;
        }
        return prev + 10;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCurrentLiveTab]);

  // TIMER PARA AUTO-HIDE APENAS DAS ABAS NA LIVE
  const resetLiveTabsTimer = useCallback(() => {
    setShowLiveTabs(true);
    if (liveTabsTimer.current) clearTimeout(liveTabsTimer.current);
    liveTabsTimer.current = setTimeout(() => {
      setShowLiveTabs(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (isCurrentLiveTab) {
      resetLiveTabsTimer();
    } else {
      setShowLiveTabs(true);
      if (liveTabsTimer.current) clearTimeout(liveTabsTimer.current);
    }
    return () => {
      if (liveTabsTimer.current) clearTimeout(liveTabsTimer.current);
    };
  }, [isCurrentLiveTab, resetLiveTabsTimer]);

  useEffect(() => {
    if (!user || !hasSupabaseConfig()) {
      setCurrentUserProfile({
        avatarUrl: "",
        fullName: "Raquel Santos",
        handle: "raquel_santos",
      });
      return;
    }

    const userMetadata = user.user_metadata ?? {};
    const fullName =
      (userMetadata["full_name"] as string | undefined) ||
      user.email?.split("@")[0] ||
      "Raquel Santos";

    supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const profileData = (data ?? {}) as Record<string, unknown>;
        setCurrentUserProfile({
          avatarUrl: (profileData["avatar_url"] as string) || "",
          fullName: (profileData["full_name"] as string) || fullName,
          handle: "raquel_santos",
        });
      });
  }, [user]);

  async function toggleLike(itemId: string) {
    const liked = likedItems.includes(itemId);
    setLikedItems((current) =>
      liked ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
    setLikeCounts((current) => ({
      ...current,
      [itemId]: Math.max(0, (current[itemId] ?? 0) + (liked ? -1 : 1)),
    }));
  }

  function toggleFollow(storeSlug: string) {
    setFollowedStores((current) =>
      current.includes(storeSlug)
        ? current.filter((slug) => slug !== storeSlug)
        : [...current, storeSlug]
    );
  }

  function openShareDrawer(item: (typeof FEED)[number]) {
    setShareTargetItem(item);
    setShareModalOpen(true);
  }

  async function handleCopyLink() {
    if (!shareTargetItem) return;
    const url = `${window.location.origin}/live#${shareTargetItem.id}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado para a área de transferência!");
      }
    } catch {
      toast.error("Erro ao copiar o link.");
    }
    setShareModalOpen(false);
  }

  function handleSharePlatform(platform: "whatsapp" | "facebook" | "twitter" | "native") {
    if (!shareTargetItem) return;
    const url = encodeURIComponent(`${window.location.origin}/live#${shareTargetItem.id}`);
    const text = encodeURIComponent(`Confira ${shareTargetItem.product.name} na Bodega Oxente!`);

    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${text}%20${url}`, "_blank");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    } else if (platform === "native" && navigator.share) {
      navigator
        .share({
          title: shareTargetItem.product.name,
          text: shareTargetItem.caption,
          url: `${window.location.origin}/live#${shareTargetItem.id}`,
        })
        .catch(() => {});
    }

    if (shareTargetItem) {
      setShareCounts((current) => ({
        ...current,
        [shareTargetItem.id]: (current[shareTargetItem.id] ?? 0) + 1,
      }));
    }
    setShareModalOpen(false);
  }

  function openCommentsModal(itemId: string) {
    setSelectedVideoId(itemId);
    setCommentsModalOpen(true);
  }

  function handleSendVideoComment(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = videoInputText.trim();
    if (!text) return;

    const newComment = {
      id: `comment-${Date.now()}`,
      body: text,
      name: currentUserProfile.fullName || "Você",
      avatar: currentUserProfile.avatarUrl,
      time: "agora",
    };

    setCommentsMap((prev) => ({
      ...prev,
      [selectedVideoId]: [newComment, ...(prev[selectedVideoId] ?? [])],
    }));

    setCommentCounts((prev) => ({
      ...prev,
      [selectedVideoId]: (prev[selectedVideoId] ?? 0) + 1,
    }));

    setVideoInputText("");
  }

  async function handleSendLiveComment(itemId: string) {
    const text = liveInputText.trim();
    if (!text) return;

    const newComment = {
      id: `live-${Date.now()}`,
      body: text,
      name: currentUserProfile.fullName || "Você",
      time: "agora",
    };

    setCommentsMap((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] ?? []), newComment],
    }));

    setCommentCounts((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? 0) + 1,
    }));

    setLiveInputText("");
  }

  // CÁLCULO DO ANEL DE PROGRESSO
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (coinProgress / 100) * circumference;

  return (
    <div 
      ref={containerRef}
      className="relative h-[100svh] min-h-[100svh] w-full overflow-hidden bg-black text-white"
      onClick={() => {
        if (isCurrentLiveTab) resetLiveTabsTimer();
      }}
    >
      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-140px) scale(1.3);
          }
        }
        .animate-float-up {
          animation: floatUp 1.5s ease-out forwards;
        }
        @keyframes coinRewardFloat {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translateY(-35px) scale(1.2);
          }
        }
        .animate-coin-reward {
          animation: coinRewardFloat 1s ease-out forwards;
        }
      `}</style>

      {/* CABEÇALHO DA ABA VÍDEOS: SETINHA VOLTAR NA ESQUERDA E ABAS CENTRALIZADAS */}
      {!isCurrentLiveTab && (
        <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-3 pt-8 pb-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/10 transition active:scale-90 shrink-0"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6 drop-shadow" />
          </button>

          <div className="flex items-center justify-center gap-4 flex-1 pr-8">
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={cn(
                  "relative text-xs font-bold transition-all whitespace-nowrap drop-shadow",
                  tab === item
                    ? "text-white underline decoration-primary underline-offset-4 font-black scale-105"
                    : "text-white/70 hover:text-white",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CABEÇALHO DA ABA LIVES COM BOTÃO VOLTAR */}
      {isCurrentLiveTab && (
        <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-3 pt-8 pb-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate({ to: "/" });
            }}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/10 transition active:scale-90 shrink-0 pointer-events-auto",
              showLiveTabs ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            aria-label="Voltar"
          >
            <ChevronLeft className="h-6 w-6 drop-shadow" />
          </button>

          <div 
            className={cn(
              "flex-1 flex justify-center items-center gap-3 transition-opacity duration-300 pointer-events-auto pr-6",
              showLiveTabs ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTab(item);
                }}
                className={cn(
                  "text-[11px] font-bold transition-all whitespace-nowrap drop-shadow",
                  tab === item ? "text-white underline decoration-primary underline-offset-4" : "text-white/70 hover:text-white",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="absolute right-3 top-3 pointer-events-auto">
            <span className="inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter text-white shadow-md animate-pulse whitespace-nowrap leading-none">
              AO VIVO
            </span>
          </div>
        </div>
      )}

      {/* MOEDA FLUTUANTE ARRASTÁVEL COM ANEL DE PROGRESSO */}
      {!isCurrentLiveTab && (
        <motion.div
          drag
          dragConstraints={containerRef}
          dragElastic={0.1}
          onDragStart={() => setIsDraggingCoin(true)}
          onDragEnd={() => setTimeout(() => setIsDraggingCoin(false), 100)}
          className="fixed top-20 right-4 z-40 touch-none cursor-grab active:cursor-grabbing"
        >
          <div className="relative flex h-11 w-11 items-center justify-center">
            <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r={radius}
                className="stroke-white/20"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="25"
                cy="25"
                r={radius}
                className="stroke-amber-400 transition-all duration-500 ease-out"
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <button
              type="button"
              className="relative flex h-8 w-8 items-center justify-center active:scale-95 transition-transform"
              aria-label="Oxente Coin"
            >
              <img
                src="/oxente-coin.png"
                alt="Oxente Coin"
                className="h-7 w-7 object-contain drop-shadow-md pointer-events-none"
              />
            </button>

            <AnimatePresence>
              {floatingCoinRewards.map((reward) => (
                <span
                  key={reward.id}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none select-none text-[11px] font-black text-amber-300 drop-shadow-md animate-coin-reward whitespace-nowrap"
                >
                  +100 🪙
                </span>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* FEED DE VÍDEOS E LIVES */}
      <div className="mx-auto h-full max-w-md snap-y snap-mandatory overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
        {visibleFeed.length === 0 ? (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <p className="text-base font-bold text-white">Nenhum conteúdo nesta aba no momento.</p>
          </div>
        ) : (
          visibleFeed.map((item) => {
            const isFollowed = followedStores.includes(item.storeSlug);
            return (
              <section
                key={item.id}
                className="relative flex h-[100svh] min-h-[100svh] snap-start items-end overflow-hidden"
              >
                {item.videoUrl ? (
                  <video
                    src={item.videoUrl}
                    poster={item.cover}
                    muted
                    autoPlay
                    loop
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={item.cover}
                    alt={item.store}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

                {/* CORAÇÕES FLUTUANTES */}
                <div className="absolute right-6 bottom-20 z-30 pointer-events-none">
                  {floatingHearts.map((heart) => (
                    <div
                      key={heart.id}
                      style={{ right: `${heart.left}px` }}
                      className="absolute bottom-0 text-primary animate-float-up"
                    >
                      <Heart className="h-7 w-7 fill-primary" />
                    </div>
                  ))}
                </div>

                {/* BARRA DE AÇÕES LATERAL DIREITA DOS VÍDEOS */}
                {!item.live && (
                  <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3.5 text-white">
                    {/* FOTO DO PERFIL COM BOTÃO DE SEGUIR (+ / V) ACIMA DO CORAÇÃO */}
                    <div className="relative mb-1">
                      <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-white shadow-md bg-zinc-800">
                        <img src={item.avatar} alt={item.store} className="h-full w-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFollow(item.storeSlug)}
                        className={cn(
                          "absolute -bottom-2 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full text-white shadow transition-transform active:scale-95",
                          isFollowed ? "bg-emerald-600" : "bg-primary"
                        )}
                        aria-label="Seguir perfil"
                      >
                        {isFollowed ? <Check className="h-3 w-3 stroke-[3]" /> : <Plus className="h-3.5 w-3.5 stroke-[3]" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      className="flex flex-col items-center gap-0.5 group"
                      onClick={() => toggleLike(item.id)}
                    >
                      <div className="p-2 rounded-full bg-black/30 backdrop-blur-sm group-hover:bg-black/50 transition">
                        <Heart
                          className={cn(
                            "h-6 w-6 transition transform active:scale-125",
                            likedItems.includes(item.id) && "fill-primary text-primary",
                          )}
                        />
                      </div>
                      <span className="text-[11px] font-bold">{likeCounts[item.id] ?? 0}</span>
                    </button>

                    <button
                      type="button"
                      className="flex flex-col items-center gap-0.5 group"
                      onClick={() => openCommentsModal(item.id)}
                    >
                      <div className="p-2 rounded-full bg-black/30 backdrop-blur-sm group-hover:bg-black/50 transition">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <span className="text-[11px] font-bold">{commentCounts[item.id] ?? 41}</span>
                    </button>

                    <button
                      type="button"
                      className="flex flex-col items-center gap-0.5 group"
                      onClick={() => openShareDrawer(item)}
                    >
                      <div className="p-2 rounded-full bg-black/30 backdrop-blur-sm group-hover:bg-black/50 transition">
                        <Share2 className="h-6 w-6" />
                      </div>
                      <span className="text-[11px] font-bold">{shareCounts[item.id] ?? 0}</span>
                    </button>
                  </div>
                )}

                {/* CONTEÚDO DA BASE NA ABA VÍDEOS */}
                <div className={cn("relative z-20 w-full p-3 space-y-2", !item.live ? "pb-16" : "pb-3")}>
                  {!item.live ? (
                    <div className="pr-16 space-y-2">
                      <div className="relative z-40 mb-1.5 w-[85%] overflow-hidden rounded-xl shadow-lg border border-white/15 bg-black/60 backdrop-blur-md">
                        {showAnnouncementDetails && (
                          <div className="p-2 bg-zinc-900/95 animate-in fade-in duration-300">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.cover}
                                alt={item.product?.name}
                                className="h-12 w-12 shrink-0 rounded-lg object-cover border border-white/10"
                              />
                              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <p className="line-clamp-1 text-[11px] font-bold text-white">
                                  {item.product?.name}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  <span className="rounded bg-primary px-1 py-0.2 text-[9px] font-extrabold text-primary-foreground">
                                    Oferta
                                  </span>
                                  <span className="text-[9px] text-emerald-400 font-semibold">Frete grátis</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-black text-primary">
                                    {formatBRL(item.product?.price || 0)}
                                  </span>
                                  <span className="flex items-center gap-0.5 text-[9px] text-amber-300">
                                    <Star className="h-2.5 w-2.5 fill-amber-300" /> 4,8
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="mt-1 flex w-full items-center justify-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground shadow"
                                >
                                  <ShoppingCart className="h-3 w-3" />
                                  Comprar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => setShowAnnouncementDetails((current) => !current)}
                          className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[11px] font-bold text-white transition"
                        >
                          <img src="/so-logo-bolsa.png" alt="" className="h-4 w-4 shrink-0 object-contain" />
                          <span className="min-w-0 flex-1 truncate text-left">
                            R$10 de desconto | Oferta da Bodega
                          </span>
                          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-white transition-transform", showAnnouncementDetails && "rotate-180")} />
                        </button>
                      </div>

                      <div className="max-w-[calc(100%-1rem)] text-white">
                        <p className="text-xs font-black drop-shadow tracking-wide">
                          @{item.store.toLowerCase().replace(/\s+/g, '_')}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-snug text-white/90 drop-shadow line-clamp-2">
                          {item.caption}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* SE FOR LIVE */
                    <div className="space-y-2">
                      <div className="flex flex-col gap-1 max-h-24 overflow-y-auto scrollbar-none pr-2 text-[10px]">
                        {(commentsMap[item.id] ?? []).slice(-3).map((comment) => (
                          <div
                            key={comment.id}
                            className="inline-flex max-w-[65%] items-center gap-1 rounded-lg bg-black/30 px-2.5 py-1 text-white/90 backdrop-blur-sm border border-white/5 shadow-xs"
                          >
                            <span className="font-bold text-primary shrink-0 leading-tight">{comment.name}:</span>
                            <span className="break-words font-normal leading-tight text-white/95">{comment.body}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendLiveComment(item.id);
                          }}
                          className="flex flex-1 items-center gap-2 rounded-full border border-white/20 bg-black/40 p-1 pl-3 backdrop-blur-md shadow-md"
                        >
                          <input
                            type="text"
                            value={liveInputText}
                            onChange={(e) => setLiveInputText(e.target.value)}
                            placeholder="Comente na live..."
                            className="min-w-0 flex-1 bg-transparent text-[11px] text-white placeholder:text-white/60 outline-none"
                          />
                          <button
                            type="submit"
                            aria-label="Enviar"
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition active:scale-90 shrink-0"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        </form>

                        <button
                          type="button"
                          aria-label="Curtir"
                          className="flex flex-col items-center group active:scale-125 transition-transform shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerMultipleLikes(item.id);
                          }}
                        >
                          <div className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 group-hover:bg-black/60 transition shadow-md">
                            <Heart className="h-5 w-5 text-primary fill-primary" />
                          </div>
                          <span className="text-[9px] font-extrabold drop-shadow mt-0.5">{likeCounts[item.id] ?? 0}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* GAVETA DE COMENTÁRIOS DOS VÍDEOS */}
      {commentsModalOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative flex h-[65%] w-full flex-col rounded-t-3xl bg-zinc-900 px-4 pt-3 pb-4 text-white shadow-2xl border-t border-white/10 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-bold text-white/90">
                {commentCounts[selectedVideoId] ?? 0} comentários
              </span>
              <button
                type="button"
                onClick={() => setCommentsModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3.5 scrollbar-thin">
              {(commentsMap[selectedVideoId] ?? []).length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-white/50">
                  Seja o primeiro a comentar!
                </div>
              ) : (
                (commentsMap[selectedVideoId] ?? []).map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5 text-xs">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-black text-primary border border-primary/30">
                      {c.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white/90 text-[11px]">{c.name}</span>
                        <span className="text-[9px] text-white/40">{c.time}</span>
                      </div>
                      <p className="text-[11px] text-white/80 leading-relaxed break-words">{c.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-around py-1.5 border-t border-white/10 bg-zinc-900/90">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setVideoInputText((prev) => prev + emoji)}
                  className="text-base hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendVideoComment} className="mt-1 flex items-center gap-2">
              <input
                type="text"
                value={videoInputText}
                onChange={(e) => setVideoInputText(e.target.value)}
                placeholder="Adicione um comentário..."
                className="flex-1 rounded-full border border-white/15 bg-zinc-800 px-3.5 py-2 text-xs text-white placeholder:text-white/40 outline-none focus:border-primary transition"
              />
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition active:scale-90 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GAVETA DE COMPARTILHAMENTO */}
      {shareModalOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative flex w-full flex-col rounded-t-3xl bg-zinc-900 px-4 pt-3 pb-6 text-white shadow-2xl border-t border-white/10 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-white/90">
                Compartilhar este vídeo
              </span>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 py-5 text-center">
              <button
                type="button"
                onClick={() => handleSharePlatform("whatsapp")}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg group-hover:scale-105 transition-transform">
                  <Share2 className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-semibold text-white/80">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 text-white shadow-lg group-hover:scale-105 transition-transform">
                  <Copy className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-semibold text-white/80">Copiar Link</span>
              </button>

              <button
                type="button"
                onClick={() => handleSharePlatform("facebook")}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg group-hover:scale-105 transition-transform">
                  <Share2 className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-semibold text-white/80">Facebook</span>
              </button>

              <button
                type="button"
                onClick={() => handleSharePlatform("native")}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg group-hover:scale-105 transition-transform">
                  <MoreHorizontal className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-semibold text-white/80">Outros</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE NAVEGAÇÃO INFERIOR */}
      {!isCurrentLiveTab && (
        <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
          <ul className="mx-auto flex max-w-md items-stretch">
            <li className="flex-1">
              <Link to="/" className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-white/65 hover:text-white transition">
                <Home className="h-5 w-5" />
                <span className="leading-none">Início</span>
              </Link>
            </li>
            <li className="flex-1">
              <Link to="/oficiais" className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-white/65 hover:text-white transition">
                <BadgeCheck className="h-5 w-5" />
                <span className="leading-none">Oficiais</span>
              </Link>
            </li>
            <li className="flex-1">
              <Link to="/live" className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-white hover:text-white transition">
                <PlaySquare className="h-5 w-5 text-primary" />
                <span className="leading-none font-bold">Bodega</span>
              </Link>
            </li>
            <li className="flex-1">
              <Link to="/notificacoes" className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-white/65 hover:text-white transition">
                <Bell className="h-5 w-5" />
                <span className="leading-none">Notificações</span>
              </Link>
            </li>
            <li className="flex-1">
              <Link to="/eu" className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-white/65 hover:text-white transition">
                <User className="h-5 w-5" />
                <span className="leading-none">Eu</span>
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}