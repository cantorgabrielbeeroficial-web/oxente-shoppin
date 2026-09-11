import { createFileRoute } from "@tanstack/react-router";
import { AffiliateCameraCreator } from "@/components/affiliate-camera-creator";

export const Route = createFileRoute("/criar-conteudo")({
  head: () => ({
    meta: [
      { title: "Criar conteúdo — Oxente Afiliados" },
      {
        name: "description",
        content: "Crie fotos e vídeos de produtos para compartilhar como afiliado Oxente.",
      },
    ],
  }),
  component: AffiliateCameraCreator,
});
