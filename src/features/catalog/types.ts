/**
 * Contratos e Tipagens da Feature de Catálogo de NFTs.
 */
import type {
  Network,
  Nft,
  NftFacets,
  NftRarity,
  NftSortOption,
} from "@/contracts/catalog";

export type { Network, Nft, NftFacets, NftRarity, NftSortOption };

/**
 * Filtros de consulta e paginação do catálogo de NFTs.
 */
export interface CatalogFilters {
  page?: number;
  limit?: number;
  sortBy?: "recent" | "price_asc" | "price_desc" | "popular" | string;
  sortDirection?: "asc" | "desc";
  sort?: NftSortOption | string;
  category?: string;
  priceMin?: string;
  priceMax?: string;
  search?: string;
  // Aliases e filtros compatíveis adicionais
  q?: string;
  pageSize?: number;
  collection?: string;
  rarity?: NftRarity;
  network?: Network;
  availability?: "all" | "available" | "sold_out";
}

/**
 * Metadados de paginação padronizados do catálogo.
 */
export interface CatalogMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Resposta paginada da listagem do catálogo de NFTs.
 * Fornece compatibilidade com `data` e `items`, além de `meta`.
 */
export interface CatalogResponse {
  items: Nft[];
  data: Nft[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: NftFacets;
  meta: CatalogMeta;
}
