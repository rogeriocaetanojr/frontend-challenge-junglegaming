/**
 * Alias legado: /nft/$id redireciona para a rota canônica /nfts/$id.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/nft/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/nfts/$id", params: { id: params.id }, replace: true });
  },
});
