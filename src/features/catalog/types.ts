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

export interface CategoryOption {
  id: string;
  label: string;
  count?: number;
}

export const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  { id: "art", label: "Arte" },
  { id: "gaming", label: "Jogos" },
  { id: "pfps", label: "PFPs" },
  { id: "photography", label: "Fotografia" },
  { id: "membership", label: "Membros" },
];

export interface SortOptionItem {
  value: string;
  label: string;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

export const CATALOG_SORT_OPTIONS: SortOptionItem[] = [
  {
    value: "createdAt:desc",
    label: "Mais recentes",
    sortBy: "createdAt",
    sortDirection: "desc",
  },
  {
    value: "price:asc",
    label: "Preço: Menor para maior",
    sortBy: "price",
    sortDirection: "asc",
  },
  {
    value: "price:desc",
    label: "Preço: Maior para menor",
    sortBy: "price",
    sortDirection: "desc",
  },
  {
    value: "title:asc",
    label: "Nome: A-Z",
    sortBy: "title",
    sortDirection: "asc",
  },
  {
    value: "title:desc",
    label: "Nome: Z-A",
    sortBy: "title",
    sortDirection: "desc",
  },
];

export const CATALOG_PAGE_SIZE_OPTIONS = [8, 12, 24, 48] as const;

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
