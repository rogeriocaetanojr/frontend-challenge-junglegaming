/**
 * Rota dinâmica de detalhe de NFT (/nfts/$id).
 *
 * O loader aquece o cache do TanStack Query sem bloquear a navegação, para que
 * a página exiba seus próprios skeletons enquanto os dados chegam.
 */
import { createFileRoute } from "@tanstack/react-router";

import { NftDetailPage } from "@/features/nft-details/NftDetailPage";
import { nftDetailQueryOptions } from "@/features/nft-details/queries";

function NftDetailRouteComponent() {
  const { id } = Route.useParams();
  return <NftDetailPage nftId={id} />;
}

export const Route = createFileRoute("/nfts/$id")({
  loader: ({ context, params }) => {
    const nftId = params.id.trim();
    if (nftId) {
      void context.queryClient.prefetchQuery(nftDetailQueryOptions(nftId));
    }
  },
  component: NftDetailRouteComponent,
});
