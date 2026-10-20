/**
 * Rota Dinâmica de Detalhe de NFT (/nfts/$id) com TanStack Router.
 *
 * Configura:
 * - loader: pré-carrega os dados do NFT concorrentemente via ensureQueryData com fallback seguro.
 * - component: NftDetailRouteComponent renderizando NftDetailPage.
 */
import { createFileRoute } from "@tanstack/react-router";

import { NftDetailPage } from "@/features/nft-details/NftDetailPage";
import { nftDetailQueryOptions } from "@/features/nft-details/queries";
import { queryClient as defaultQueryClient } from "@/lib/query-client";
import type { RouterContext } from "@/router";

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/nfts/$id": {
      id: "/nfts/$id";
      path: "/nfts/$id";
      fullPath: "/nfts/$id";
      preLoaderRoute: unknown;
      parentRoute: unknown;
    };
  }
}

function NftDetailRouteComponent() {
  const { id } = Route.useParams();
  return <NftDetailPage nftId={id} />;
}

export const Route = createFileRoute("/nfts/$id")({
  loader: async ({ context, params }) => {
    const routerContext = context as unknown as Partial<RouterContext> | undefined;
    const queryClient = routerContext?.queryClient ?? defaultQueryClient;
    const nftId = String(params.id ?? "").trim();

    if (!nftId) {
      return null;
    }

    try {
      return await queryClient.ensureQueryData(nftDetailQueryOptions(nftId));
    } catch {
      // Fallback seguro para não travar a navegação caso o item venha com formato inesperado
      return null;
    }
  },
  component: NftDetailRouteComponent,
});

export default Route;
