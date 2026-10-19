import { http } from "@/lib/http";
import type { NftFilters, NftItem, PaginatedResponse } from "@/types/nft";

/**
 * Camada de serviço de domínio para NFTs, consumindo estritamente o cliente HTTP centralizado.
 */
export async function getNfts(
  filters?: NftFilters,
  page = 1,
  limit = 8,
): Promise<PaginatedResponse<NftItem>> {
  const params: Record<string, unknown> = {
    page,
    limit,
    ...(filters?.search && { search: filters.search }),
    ...(filters?.category && { category: filters.category }),
    ...(filters?.network && { network: filters.network }),
    ...(filters?.minPrice !== undefined && { minPrice: filters.minPrice }),
    ...(filters?.maxPrice !== undefined && { maxPrice: filters.maxPrice }),
    ...(filters?.sortBy && { sortBy: filters.sortBy }),
  };

  return http.get<PaginatedResponse<NftItem>>("/nfts", { params });
}

/**
 * Recupera os detalhes completos de um NFT por meio de seu identificador exclusivo.
 */
export async function getNftById(id: string): Promise<NftItem> {
  return http.get<NftItem>(`/nfts/${id}`);
}
