import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  BadgeCheck,
  Bell,
  ChevronDown,
  ChevronRight,
  Grid2X2,
  Heart,
  Home,
  Image,
  Infinity as BoomerangIcon,
  MessageCircle,
  PlaySquare,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Settings2,
  ShoppingCart,
  Sparkles,
  Star,
  Type,
  User,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { useAuthUser } from "@/hooks/use-auth";
import { hasSupabaseConfig, supabase } from "@/integrations/supabase/client";

const TABS = ["Vídeos", "Lives", "Para você", "Seguindo"] as const;
const CAPTURE_MODES = ["POST", "STORIES", "INSTANTS", "REELS", "LIVE"] as const;
const FEED = [
  {
    id: "1",
    cover: "/Banner-do-inicio-topo-01.png",
    store: "Ateliê do Sertão",
    storeSlug: "atelie-do-sertao",
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
  const [tab, setTab] = useState<(typeof TABS)[number]>("Vídeos");
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState({
    avatarUrl: "",
    fullName: "Usuária Oxente",
    handle: "usuario_oxente",
  });
  const [profileSearch, setProfileSearch] = useState("");
  const [followedStores, setFollowedStores] = useState<string[]>([]);
  const [likedItems, setLikedItems] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({
    "2": 3840,
  });
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({
    "2": 41,
  });
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({
    "2": 128,
  });
  const [showAnnouncementDetails, setShowAnnouncementDetails] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<"photo" | "video">("photo");
  const [captureMode, setCaptureMode] = useState("STORIES");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [publishCaption, setPublishCaption] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [liveComments, setLiveComments] = useState<
    Record<string, Array<{ id: string; body: string; userId: string }>>
  >({});
  const visibleFeed =
    tab === "Vídeos"
      ? FEED.filter((item) => !item.live)
      : tab === "Lives"
        ? FEED.filter((item) => item.live)
        : tab === "Seguindo"
          ? FEED.filter((item) => followedStores.includes(item.store))
          : FEED;
  const searchedFeed = visibleFeed.filter((item) =>
    item.store.toLowerCase().includes(profileSearch.trim().toLowerCase()),
  );

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
    const sanitizedHandle =
      fullName
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s_]/g, "")
        .replace(/\s+/g, "_")
        .replace(/^_+|_+$/g, "") || "raquel_santos";

    let active = true;

    supabase
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;

        const profileData = (data ?? {}) as Record<string, unknown>;
        const profileName = (profileData["full_name"] as string | undefined) || fullName;
        const avatarUrl =
          (profileData["avatar_url"] as string | undefined) ||
          (userMetadata["avatar_url"] as string | undefined) ||
          (userMetadata["picture"] as string | undefined) ||
          "";

        setCurrentUserProfile({
          avatarUrl,
          fullName: profileName || "Raquel Santos",
          handle: sanitizedHandle === "usuario_oxente" ? "raquel_santos" : sanitizedHandle,
        });
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowAnnouncementDetails(true), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showAnnouncementDetails) return;

    const timer = window.setTimeout(() => setShowAnnouncementDetails(false), 15000);
    return () => window.clearTimeout(timer);
  }, [showAnnouncementDetails]);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    let active = true;
    Promise.all([
      supabase.from("video_likes").select("content_id, user_id"),
      supabase.from("video_shares").select("content_id"),
      supabase.from("live_comments").select("id, content_id, body, user_id").order("created_at"),
    ]).then(([likesResult, sharesResult, commentsResult]) => {
      if (!active) return;
      const counts: Record<string, number> = {};
      const mine: string[] = [];
      (likesResult.data ?? []).forEach((like) => {
        counts[like.content_id] = (counts[like.content_id] ?? 0) + 1;
        if (user && like.user_id === user.id) mine.push(like.content_id);
      });
      const comments: Record<string, Array<{ id: string; body: string; userId: string }>> = {};
      const shares: Record<string, number> = {};
      (sharesResult.data ?? []).forEach((share) => {
        shares[share.content_id] = (shares[share.content_id] ?? 0) + 1;
      });
      (commentsResult.data ?? []).forEach((comment) => {
        comments[comment.content_id] = [
          ...(comments[comment.content_id] ?? []),
          { id: comment.id, body: comment.body, userId: comment.user_id },
        ];
      });
      setLikeCounts(counts);
      setShareCounts(shares);
      setLikedItems(mine);
      setCommentCounts(
        Object.fromEntries(Object.entries(comments).map(([id, values]) => [id, values.length])),
      );
      setLiveComments(comments);
    });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const channel = supabase
      .channel("live-comments")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_comments" },
        (payload) => {
          const comment = payload.new as {
            id: string;
            content_id: string;
            body: string;
            user_id: string;
          };
          setLiveComments((current) => ({
            ...current,
            [comment.content_id]: [
              ...(current[comment.content_id] ?? []).slice(-4),
              { id: comment.id, body: comment.body, userId: comment.user_id },
            ],
          }));
          setCommentCounts((current) => ({
            ...current,
            [comment.content_id]: (current[comment.content_id] ?? 0) + 1,
          }));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function toggleLike(itemId: string) {
    const liked = likedItems.includes(itemId);

    if (user) {
      const result = liked
        ? await supabase
            .from("video_likes")
            .delete()
            .eq("content_id", itemId)
            .eq("user_id", user.id)
        : await supabase.from("video_likes").insert({ content_id: itemId, user_id: user.id });

      if (result.error) {
        toast.error("Não foi possível registrar sua curtida.");
        return;
      }
    }

    setLikedItems((current) =>
      liked ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
    setLikeCounts((current) => ({
      ...current,
      [itemId]: Math.max(0, (current[itemId] ?? 0) + (liked ? -1 : 1)),
    }));

    if (!user) {
      toast.success(
        liked ? "Curtida removida no modo de teste." : "Curtida registrada no modo de teste.",
      );
    }
  }

  async function shareVideo(item: (typeof FEED)[number]) {
    const url = `${window.location.origin}/live#${item.id}`;
    const shareData = {
      title: item.product.name,
      text: item.caption,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link do vídeo copiado!");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        toast.error("Não foi possível compartilhar o vídeo.");
      }
    }

    if (user) {
      const { error } = await supabase.from("video_shares").insert({
        content_id: item.id,
        user_id: user.id,
      });
      if (error) {
        toast.error("Não foi possível registrar o compartilhamento.");
        return;
      }
    }

    setShareCounts((current) => ({
      ...current,
      [item.id]: (current[item.id] ?? 0) + 1,
    }));

    if (!user) {
      toast.success("Compartilhamento testado com sucesso.");
    }
  }

  function openAffiliateProfile() {
    const handle = currentUserProfile.handle || "raquel_santos";
    navigate({ to: "/afiliado/$username", params: { username: handle } });
  }

  async function addComment(itemId: string) {
    const commentBody = window.prompt("Escreva seu comentário:");
    if (commentBody === null) return;

    const sanitized = commentBody.trim();
    if (!sanitized) {
      toast.error("Seu comentário não pode estar vazio.");
      return;
    }

    if (user) {
      const { data, error } = await supabase
        .from("live_comments")
        .insert({ content_id: itemId, body: sanitized, user_id: user.id })
        .select("id, content_id, body, user_id")
        .single();

      if (error) {
        toast.error("Não foi possível enviar o comentário.");
        return;
      }

      setLiveComments((current) => ({
        ...current,
        [itemId]: [
          ...(current[itemId] ?? []),
          { id: data.id, body: data.body, userId: data.user_id },
        ],
      }));
    } else {
      const localCommentId = `demo-${itemId}-${Date.now()}`;
      setLiveComments((current) => ({
        ...current,
        [itemId]: [
          ...(current[itemId] ?? []),
          { id: localCommentId, body: sanitized, userId: "demo-user" },
        ],
      }));
    }

    setCommentCounts((current) => ({
      ...current,
      [itemId]: (current[itemId] ?? 0) + 1,
    }));

    if (!user) {
      toast.success("Comentário adicionado no modo de teste.");
    } else {
      toast.success("Comentário enviado!");
    }
  }

  const stopCameraStream = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    setIsRecording(false);
  }, []);

  const openGalleryPicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const startCameraStream = useCallback(async () => {
    if (!publishOpen) return;

    if (!window.isSecureContext) {
      setCameraError(
        "A câmera só funciona em uma conexão segura (HTTPS). Abra o app pelo endereço HTTPS.",
      );
      toast.error("Conexão insegura: o navegador bloqueou o acesso à câmera.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Seu navegador não suporta acesso à câmera.");
      return;
    }

    try {
      const videoConstraints = {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: true,
        });
      } catch {
        // A microphone denial must not prevent the camera preview from opening.
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraStream(stream);
      setCameraError("");
    } catch (error) {
      const errorName = error instanceof DOMException ? error.name : "";
      const message =
        errorName === "NotAllowedError" || errorName === "SecurityError"
          ? "O acesso à câmera foi bloqueado. Permita a câmera nas configurações do navegador e tente novamente."
          : errorName === "NotFoundError"
            ? "Nenhuma câmera foi encontrada neste dispositivo. Você pode escolher uma mídia da galeria."
            : "Não foi possível acessar a câmera. Verifique as permissões do navegador ou escolha uma mídia da galeria.";
      setCameraError(message);
      toast.error(message);
    }
  }, [facingMode, publishOpen]);

  const applySelectedMedia = useCallback((file: File) => {
    setSelectedMedia((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
      }

      return {
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
      };
    });
  }, []);

  function handleMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    applySelectedMedia(file);
    event.target.value = "";
  }

  function closePublish() {
    stopCameraStream();
    setSelectedMedia((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
    setPublishCaption("");
    setCameraMode("photo");
    setCameraError("");
    setPublishOpen(false);
  }

  async function capturePhoto() {
    const video = cameraVideoRef.current;
    if (!video || !streamRef.current) {
      toast.error("A câmera ainda não está pronta.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Não foi possível capturar a imagem.");
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );

    if (!blob) {
      toast.error("Não foi possível salvar a foto.");
      return;
    }

    applySelectedMedia(new File([blob], `oxente-photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
  }

  function toggleVideoCapture() {
    if (!streamRef.current) {
      toast.error("A câmera ainda não está pronta.");
      return;
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "";

    const recorder = mimeType
      ? new MediaRecorder(streamRef.current, { mimeType })
      : new MediaRecorder(streamRef.current);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const recordedBlob = new Blob(chunks, {
        type: chunks[0]?.type || "video/webm",
      });

      if (recordedBlob.size === 0) {
        toast.error("Não foi possível gravar o vídeo.");
        return;
      }

      applySelectedMedia(
        new File([recordedBlob], `oxente-video-${Date.now()}.webm`, {
          type: recordedBlob.type || "video/webm",
        }),
      );
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    toast.success("Gravação iniciada.");
  }

  function publishMedia() {
    if (!selectedMedia) {
      toast.error("Escolha uma foto ou vídeo primeiro.");
      return;
    }
    closePublish();
    toast.success("Conteúdo preparado para publicação em modo de teste.");
  }

  function toggleCamera() {
    stopCameraStream();
    setFacingMode((current) => (current === "environment" ? "user" : "environment"));
  }

  useEffect(() => {
    if (!publishOpen) return;

    void startCameraStream();

    return () => {
      stopCameraStream();
    };
  }, [publishOpen, facingMode, startCameraStream, stopCameraStream]);

  useEffect(() => {
    const video = cameraVideoRef.current;
    if (!video || !cameraStream) return;

    video.srcObject = cameraStream;
    video.muted = true;
    video.playsInline = true;
    void video.play().catch(() => undefined);

    return () => {
      if (video.srcObject === cameraStream) video.srcObject = null;
    };
  }, [cameraStream]);

  return (
    <div className="relative h-[100svh] min-h-[100svh] w-full overflow-hidden bg-black text-white">
      <div className="absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/60 to-transparent px-3 pb-8 pt-2">
        <div className="flex h-9 items-center justify-between">
          <button
            type="button"
            aria-label="Abrir perfil do afiliado"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-white shadow-sm hover:bg-white/15"
            onClick={openAffiliateProfile}
          >
            {currentUserProfile.avatarUrl ? (
              <img
                src={currentUserProfile.avatarUrl}
                alt={currentUserProfile.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
          </button>
          <span className="text-lg font-extrabold tracking-wide text-white">Bodega</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Notificações"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Criar"
              onClick={() => navigate({ to: "/criar-conteudo" })}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="mt-2 flex items-center gap-2 rounded-full bg-white/15 px-3 py-2">
            <Search className="h-4 w-4 text-white/70" />
            <input
              autoFocus
              value={profileSearch}
              onChange={(event) => setProfileSearch(event.target.value)}
              placeholder="Buscar perfis e lojas"
              aria-label="Buscar perfis e lojas"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60"
            />
          </div>
        )}
        <div className="mt-2 flex justify-center gap-6">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              aria-pressed={tab === item}
              className={cn(
                "relative text-[13px] font-medium tracking-[0.01em] transition-all duration-200",
                tab === item ? "text-white opacity-100" : "text-white/60 opacity-70",
              )}
            >
              {item}
              {tab === item && (
                <span className="absolute -bottom-1.5 left-1/2 h-[1px] w-3.5 -translate-x-1/2 rounded-full bg-zinc-400/45" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto h-full max-w-md snap-y snap-mandatory overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
        {searchedFeed.length === 0 ? (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <div>
              <p className="text-base font-bold text-white">Ainda não tem conteúdo por aqui.</p>
              <p className="mt-2 text-sm text-white/70">
                Volte em breve para acompanhar novidades das lojas Oxente.
              </p>
            </div>
          </div>
        ) : (
          searchedFeed.map((item) => (
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
                  className="absolute inset-0 h-full w-full object-cover [filter:saturate(1.1)_contrast(1.05)]"
                />
              ) : (
                <img
                  src={item.cover}
                  alt={item.store}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

              {item.live && (
                <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase text-primary-foreground shadow-lg">
                    AO VIVO
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "absolute right-1 bottom-20 z-20 flex flex-col items-center gap-3 text-white",
                )}
              >
                {!item.live && (
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-black/25 shadow-lg backdrop-blur">
                    <button
                      type="button"
                      aria-label="Abrir perfil do afiliado"
                      className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-extrabold text-white"
                      onClick={openAffiliateProfile}
                    >
                      {currentUserProfile.avatarUrl ? (
                        <img
                          src={currentUserProfile.avatarUrl}
                          alt={currentUserProfile.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        currentUserProfile.fullName.slice(0, 1).toUpperCase()
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label={
                        followedStores.includes(item.store)
                          ? `Deixar de seguir ${item.store}`
                          : `Seguir ${item.store}`
                      }
                      aria-pressed={followedStores.includes(item.store)}
                      className="absolute -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white"
                      onClick={() =>
                        setFollowedStores((current) =>
                          current.includes(item.store)
                            ? current.filter((store) => store !== item.store)
                            : [...current, item.store],
                        )
                      }
                    >
                      {!followedStores.includes(item.store) ? (
                        <Plus className="h-3 w-3" />
                      ) : (
                        <span className="text-[10px] font-bold">✓</span>
                      )}
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  aria-label={likedItems.includes(item.id) ? "Descurtir" : "Curtir"}
                  aria-pressed={likedItems.includes(item.id)}
                  className="flex flex-col items-center gap-1"
                  onClick={() => toggleLike(item.id)}
                >
                  <Heart
                    className={cn(
                      "h-6 w-6",
                      likedItems.includes(item.id) && "fill-primary text-primary",
                    )}
                  />
                  <span className="text-[10px]">{likeCounts[item.id] ?? 0}</span>
                </button>
                {!item.live && (
                  <button
                    type="button"
                    aria-label="Comentários"
                    className="flex flex-col items-center gap-1"
                    onClick={() => addComment(item.id)}
                  >
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-[10px]">{commentCounts[item.id] ?? 11}</span>
                  </button>
                )}
                {!item.live && (
                  <>
                    <button
                      type="button"
                      aria-label="Compartilhar vídeo"
                      className="flex flex-col items-center gap-1"
                      onClick={() => shareVideo(item)}
                    >
                      <Reply className="h-6 w-6" />
                      <span className="text-[10px]">{shareCounts[item.id] ?? 0}</span>
                    </button>
                  </>
                )}
              </div>

              <div className="relative z-10 w-full space-y-3 p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pr-16">
                {!item.live && (
                  <>
                    <div className="relative z-40 mb-3 w-full overflow-hidden rounded-xl shadow-lg">
                      {showAnnouncementDetails && (
                        <div className="animate-announcement-rise bg-white/95 p-1">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={item.cover}
                              alt={item.product.name}
                              className="h-8 w-8 shrink-0 rounded-lg object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold leading-tight text-foreground">
                                {item.product.name}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Star className="h-3 w-3 fill-brand-gold text-brand-gold" /> 4,8
                              </p>
                              <p className="text-sm font-extrabold text-foreground">
                                {formatBRL(item.product.price)} no Pix
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-2 py-1.5 text-[10px] font-bold text-primary-foreground"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Comprar com cupom
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label={showAnnouncementDetails ? "Fechar anúncio" : "Abrir anúncio"}
                        onClick={() => setShowAnnouncementDetails((current) => !current)}
                        className="flex w-full items-center gap-2 border border-white/10 bg-zinc-800/45 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-sm transition-all"
                      >
                        <img
                          src="/so-logo-bolsa.png"
                          alt=""
                          className="h-4 w-4 shrink-0 object-contain"
                        />
                        <span className="min-w-0 flex-1 truncate">
                          R$10 de desconto | Caneca Bodega...
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-white/80 transition-transform duration-200",
                            showAnnouncementDetails && "rotate-180",
                          )}
                        />
                      </button>
                    </div>
                    <div className="max-w-[calc(100%-1rem)] text-white">
                      <p className="text-sm font-extrabold">@Bodega_Achados</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/90">
                        {item.caption} <span className="font-semibold">Veja mais</span>
                      </p>
                    </div>
                  </>
                )}

                {item.live && (liveComments[item.id]?.length ?? 0) > 0 && (
                  <div className="max-h-24 space-y-1 overflow-hidden text-xs text-white/90">
                    {(liveComments[item.id] ?? []).slice(-3).map((comment) => (
                      <p key={comment.id} className="truncate rounded-full bg-black/30 px-3 py-1">
                        <strong>{comment.userId === user?.id ? "Você" : "Participante"}:</strong>{" "}
                        {comment.body}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))
        )}
      </div>
      {publishOpen && (
        <div className="absolute inset-0 z-50 overflow-hidden bg-black">
          <div className="absolute inset-0 bg-black">
            {!selectedMedia ? (
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            ) : selectedMedia.type === "video" ? (
              <video
                src={selectedMedia.url}
                autoPlay
                playsInline
                controls
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={selectedMedia.url}
                alt="Prévia do conteúdo"
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
          </div>

          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/55 to-transparent px-4 pb-8 pt-4">
              <button
                type="button"
                aria-label="Fechar criação"
                onClick={closePublish}
                className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/40"
              >
                <X className="h-5 w-5" />
              </button>

              <button
                type="button"
                aria-label="Configurações e flash"
                className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/40"
              >
                <Zap className="h-5 w-5" />
              </button>
            </div>

            {!selectedMedia && (
              <div className="absolute left-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-2 text-white backdrop-blur-sm">
                {[
                  { label: "Texto", icon: Type },
                  { label: "Boomerang", icon: BoomerangIcon },
                  { label: "Layout", icon: Grid2X2 },
                  { label: "Efeitos", icon: Sparkles },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    aria-label={label}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15"
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Mais ferramentas"
                  className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {cameraError && !selectedMedia && (
            <div className="absolute inset-x-4 top-20 z-10 mx-auto max-w-md rounded-2xl border border-white/15 bg-black/45 p-3 text-center text-sm backdrop-blur-sm">
              <p className="font-medium text-white">{cameraError}</p>
              <div className="mt-3 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void startCameraStream()}
                  className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black"
                >
                  Tentar novamente
                </button>
                <button
                  type="button"
                  onClick={openGalleryPicker}
                  className="rounded-full border border-white/30 px-4 py-2 text-xs font-bold text-white"
                >
                  Escolher da galeria
                </button>
              </div>
            </div>
          )}

          {!selectedMedia ? (
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16">
              <div className="mb-5 flex justify-center gap-5 overflow-x-auto px-2 text-[11px] font-bold tracking-wide text-white/65">
                {CAPTURE_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setCaptureMode(mode);
                      setCameraMode(mode === "LIVE" || mode === "REELS" ? "video" : "photo");
                    }}
                    className={cn(
                      "shrink-0 transition",
                      captureMode === mode &&
                        "text-white underline decoration-2 underline-offset-4",
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="flex items-end justify-between">
                <button
                  type="button"
                  onClick={openGalleryPicker}
                  className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-black/30 text-white shadow-lg backdrop-blur-sm transition hover:scale-[1.02]"
                  aria-label="Abrir galeria"
                >
                  <img
                    src={FEED[0].cover}
                    alt="Miniatura da galeria"
                    className="h-full w-full object-cover"
                  />
                </button>

                <button
                  type="button"
                  onClick={cameraMode === "photo" ? capturePhoto : toggleVideoCapture}
                  aria-label={
                    cameraMode === "photo"
                      ? "Capturar foto"
                      : isRecording
                        ? "Parar gravação"
                        : "Gravar vídeo"
                  }
                  className={cn(
                    "flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/80 bg-white text-black shadow-2xl transition active:scale-95",
                    cameraMode === "video" && "border-primary/80 bg-primary text-white",
                    isRecording && "border-red-500 bg-red-500 text-white",
                  )}
                >
                  <span
                    className={cn(
                      "block rounded-full bg-current",
                      cameraMode === "photo" ? "h-14 w-14" : isRecording ? "h-6 w-6" : "h-12 w-12",
                    )}
                  />
                </button>

                <button
                  type="button"
                  onClick={toggleCamera}
                  aria-label="Alternar câmera frontal e traseira"
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white shadow-lg backdrop-blur-sm transition hover:scale-[1.02]"
                >
                  <RefreshCw className="h-6 w-6" />
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-3 backdrop-blur-sm">
                <textarea
                  value={publishCaption}
                  onChange={(event) => setPublishCaption(event.target.value)}
                  placeholder="Escreva uma legenda para seu conteúdo..."
                  className="min-h-[88px] w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/60"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closePublish}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={publishMedia}
                    className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                  >
                    Publicar
                  </button>
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
            className="hidden"
          />
        </div>
      )}
      <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto flex max-w-md items-stretch">
          <li className="flex-1">
            <Link
              to="/"
              aria-label="Início"
              className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-white/65"
            >
              <Home className="h-5 w-5" />
              <span className="leading-none">Início</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              to="/oficiais"
              aria-label="Oficiais"
              className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-white/65"
            >
              <BadgeCheck className="h-5 w-5" />
              <span className="leading-none">Oficiais</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              to="/live"
              aria-label="Bodega"
              className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-white"
            >
              <PlaySquare className="h-5 w-5" />
              <span className="leading-none">Bodega</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              to="/notificacoes"
              aria-label="Notificações"
              className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-white/65"
            >
              <Bell className="h-5 w-5" />
              <span className="leading-none">Notificações</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link
              to="/eu"
              aria-label="Eu"
              className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium text-white/65"
            >
              <User className="h-5 w-5" />
              <span className="leading-none">Eu</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
