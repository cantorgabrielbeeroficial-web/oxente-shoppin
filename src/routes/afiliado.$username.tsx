import { createFileRoute } from "@tanstack/react-router";
import { AffiliateProfileView } from "@/pages/AffiliateProfileView";

export const Route = createFileRoute("/afiliado/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `Perfil do afiliado — ${params.username}` },
      {
        name: "description",
        content: "Perfil de afiliado do ecossistema Achadinhos da Bodega.",
      },
    ],
  }),
  component: AffiliateProfileRoute,
});

function AffiliateProfileRoute() {
  return <AffiliateProfileView />;
}
