import { queryOptions, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { getNftById, getNfts } from "@/services/nft-service";
import type { NftFilters } from "@/types/nft";

/**
 * Opções de consulta da listagem paginada de NFTs (compartilhadas entre o hook e o loader da rota).
 */
export function nftsQueryOptions(filters?: NftFilters, page = 1, limit = 8) {
  return queryOptions({
    queryKey: queryKeys.nfts.list({ ...filters, page, limit }),
    queryFn: () => getNfts(filters, page, limit),
  });
}

/**
 * Hook para busca e listagem paginada de NFTs com suporte a filtros e ordenação via TanStack Query.
 */
export function useNfts(filters?: NftFilters, page = 1, limit = 8) {
  return useQuery(nftsQueryOptions(filters, page, limit));
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
