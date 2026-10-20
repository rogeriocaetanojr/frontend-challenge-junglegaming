/**
 * Rota Dinâmica de Detalhe de NFT (/nfts/$nftId) com TanStack Router (alias compatível com $nftId).
 */
import { type AnyRoute, createFileRoute } from "@tanstack/react-router";

import { NftDetailPage } from "@/features/nft-details/NftDetailPage";
import { nftDetailQueryOptions } from "@/features/nft-details/queries";
import { queryClient as defaultQueryClient } from "@/lib/query-client";
import type { RouterContext } from "@/router";

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/nfts/$nftId": {
      id: "/nfts/$nftId";
      path: "/nfts/$nftId";
      fullPath: "/nfts/$nftId";
      preLoaderRoute: typeof Route;
      parentRoute: AnyRoute;
    };
  }
}

function NftDetailRouteComponent() {
  const params = Route.useParams() as { nftId?: string; id?: string };
  const nftId = params.nftId ?? params.id ?? "";
  return <NftDetailPage nftId={nftId} />;
}

export const Route = createFileRoute("/nfts/$nftId")({
  loader: async ({ context, params }) => {
    const routerContext = context as unknown as Partial<RouterContext> | undefined;
    const queryClient = routerContext?.queryClient ?? defaultQueryClient;
    const routeParams = params as { nftId?: string; id?: string };
    const nftId = String(routeParams.nftId ?? routeParams.id ?? "").trim();

    if (!nftId) {
      return null;
    }

    try {
      return await queryClient.ensureQueryData(nftDetailQueryOptions(nftId));
    } catch {
      return null;
    }
  },
  component: NftDetailRouteComponent,
});

export default Route;
