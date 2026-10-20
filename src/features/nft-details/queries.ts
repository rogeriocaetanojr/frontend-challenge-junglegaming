/**
 * Opções de Consulta (Query Options) e Hooks de Detalhe de NFT via TanStack Query v5.
 *
 * Configuração:
 * - staleTime: 60_000 ms (1 minuto)
 * - gcTime: 300_000 ms (5 minutos)
 */
import { queryOptions, useQuery } from "@tanstack/react-query";

import { http } from "@/lib/http";
import { queryKeys } from "@/lib/query/keys";
import type { NftDetail, NftDetailId } from "./types";

export const NFT_DETAIL_STALE_TIME = 60_000;
export const NFT_DETAIL_GC_TIME = 5 * 60_000;

/**
 * Cria as opções de consulta tipadas para o detalhe de um NFT.
 */
export function nftDetailQueryOptions(id: NftDetailId) {
  const normalizedId = String(id).trim();

  return queryOptions<NftDetail>({
    queryKey: queryKeys.catalog.detail(normalizedId),
    queryFn: async () => {
      if (!normalizedId) {
        throw new Error("ID de NFT inválido para consulta de detalhes.");
      }
      return http.get<NftDetail>(`/api/nfts/${normalizedId}`);
    },
    staleTime: NFT_DETAIL_STALE_TIME,
    gcTime: NFT_DETAIL_GC_TIME,
    enabled: Boolean(normalizedId),
  });
}

/**
 * Hook utilitário para consumir os detalhes de um NFT com tipagem estrita.
 */
export function useNftDetail(id: NftDetailId) {
  return useQuery(nftDetailQueryOptions(id));
}
