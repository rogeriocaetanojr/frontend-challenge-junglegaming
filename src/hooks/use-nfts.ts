import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { getNftById, getNfts } from "@/services/nft-service";
import type { NftFilters } from "@/types/nft";

/**
 * Hook para busca e listagem paginada de NFTs com suporte a filtros e ordenação via TanStack Query.
 */
export function useNfts(filters?: NftFilters, page = 1, limit = 8) {
  return useQuery({
    queryKey: queryKeys.nfts.list({ ...filters, page, limit }),
    queryFn: () => getNfts(filters, page, limit),
  });
}

/**
 * Hook para carregar os detalhes completos de um NFT por ID.
 */
export function useNft(id: string) {
  return useQuery({
    queryKey: queryKeys.nfts.detail(id),
    queryFn: () => getNftById(id),
    enabled: Boolean(id),
  });
}
