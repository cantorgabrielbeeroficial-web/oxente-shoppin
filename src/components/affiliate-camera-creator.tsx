import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, Check, Image, Settings2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AffiliateCameraCreator() {
  const navigate = useNavigate();
  const [cameraMode, setCameraMode] = useState<"photo" | "video">("photo");
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

  const stopCameraStream = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraStream(null);
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
    setIsRecording(false);
  }, []);

  const startCameraStream = useCallback(async () => {
    if (!window.isSecureContext) {
      setCameraError("A câmera precisa de uma conexão segura. Você ainda pode escolher um arquivo da galeria.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Seu navegador não suporta acesso à câmera. Escolha um arquivo da galeria.");
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
        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
      }
      streamRef.current = stream;
      setCameraStream(stream);
      setCameraError("");
    } catch (error) {
      const errorName = error instanceof DOMException ? error.name : "";
      const message =
        errorName === "NotAllowedError" || errorName === "SecurityError"
          ? "Permita o acesso à câmera no navegador ou escolha uma mídia da galeria."
          : errorName === "NotFoundError"
            ? "Nenhuma câmera foi encontrada. Escolha uma mídia da galeria."
            : "Não foi possível acessar a câmera. Escolha uma mídia da galeria.";
      setCameraError(message);
      toast.error(message);
    }
  }, [facingMode]);

  const applySelectedMedia = useCallback((file: File) => {
    setSelectedMedia((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return {
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
      };
    });
  }, []);

  const closeCreator = useCallback(() => {
    stopCameraStream();
    setSelectedMedia((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
    navigate({ to: "/live" });
  }, [navigate, stopCameraStream]);

  useEffect(() => {
    void startCameraStream();
    return () => stopCameraStream();
  }, [startCameraStream, stopCameraStream]);

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

  function handleMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    applySelectedMedia(file);
    event.target.value = "";
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
    const context = canvas.getContext("2d");
    if (!context) {
      toast.error("Não foi possível capturar a imagem.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
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
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const recordedBlob = new Blob(chunks, { type: chunks[0]?.type || "video/webm" });
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
    toast.success("Conteúdo preparado para publicação em modo de teste.");
    closeCreator();
  }

  const captureAction = cameraMode === "photo" ? capturePhoto : toggleVideoCapture;

  return (
    <main className="fixed inset-0 z-[100] overflow-hidden bg-black text-white">
      <section className="absolute inset-0 bg-black">
          {!selectedMedia ? (
            <video ref={cameraVideoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          ) : selectedMedia.type === "video" ? (
            <video src={selectedMedia.url} autoPlay playsInline controls className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <img src={selectedMedia.url} alt="Prévia do conteúdo" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/75" />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
            <button
              type="button"
              aria-label="Voltar para a Bodega"
              onClick={closeCreator}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white shadow-lg backdrop-blur transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Configurações da câmera"
              onClick={() => toast.info("Configurações avançadas estarão disponíveis em breve.")}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white shadow-lg backdrop-blur transition hover:bg-white/10"
            >
              <Settings2 className="h-5 w-5" />
            </button>
          </div>

          {cameraError && !selectedMedia && (
            <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-black/65 p-5 text-center backdrop-blur-md">
              <Camera className="mx-auto h-8 w-8 text-orange-300" />
              <p className="mt-3 text-sm font-medium leading-5 text-white">{cameraError}</p>
              <div className="mt-4 flex justify-center gap-2">
                <button type="button" onClick={() => void startCameraStream()} className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black">Tentar novamente</button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full border border-white/30 px-4 py-2 text-xs font-bold text-white">Abrir galeria</button>
              </div>
            </div>
          )}

          {!selectedMedia ? (
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Selecionar modo foto"
                  aria-pressed={cameraMode === "photo"}
                  onClick={() => setCameraMode("photo")}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/70 shadow-lg backdrop-blur transition",
                    cameraMode === "photo" && "border-white bg-white text-black",
                  )}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Selecionar modo vídeo"
                  aria-pressed={cameraMode === "video"}
                  onClick={() => setCameraMode("video")}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white/70 shadow-lg backdrop-blur transition",
                    cameraMode === "video" && "border-orange-300 bg-orange-500 text-white",
                  )}
                >
                  <Video className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                aria-label={cameraMode === "photo" ? "Tirar foto" : isRecording ? "Parar gravação" : "Iniciar gravação"}
                onClick={captureAction}
                className={cn(
                  "flex h-24 w-24 touch-none items-center justify-center rounded-full border-4 border-white bg-white shadow-2xl transition active:scale-95",
                  cameraMode === "video" && "border-orange-300",
                  isRecording && "border-red-500 bg-red-500",
                )}
              >
                <span className={cn("block rounded-full", cameraMode === "photo" ? "h-16 w-16 bg-black" : isRecording ? "h-8 w-8 bg-white" : "h-14 w-14 rounded-xl bg-orange-500")} />
              </button>
              <button
                type="button"
                aria-label="Abrir galeria"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-[max(2rem,env(safe-area-inset-bottom)+1rem)] left-[calc(50%+4.25rem)] flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white shadow-lg backdrop-blur transition hover:bg-white/10"
              >
                <Image className="h-6 w-6" />
              </button>
            </div>
          ) : (
            <div className="absolute inset-x-0 bottom-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="rounded-2xl border border-white/15 bg-black/65 p-3 backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div><p className="text-sm font-bold">Tudo certo?</p><p className="text-xs text-white/60">Adicione uma legenda para o produto.</p></div>
                  <button type="button" aria-label="Descartar mídia" onClick={() => setSelectedMedia(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X className="h-4 w-4" /></button>
                </div>
                <textarea value={publishCaption} onChange={(event) => setPublishCaption(event.target.value)} placeholder="Ex.: meu achadinho favorito da Oxente..." className="min-h-20 w-full resize-none rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-orange-300" />
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setSelectedMedia(null)} className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10">Refazer</button>
                  <button type="button" onClick={publishMedia} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-400"><Check className="h-4 w-4" /> Publicar</button>
                </div>
              </div>
            </div>
          )}
        </section>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleMediaChange} className="hidden" />
    </main>
  );
}
