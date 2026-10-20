/**
 * Opções de Consulta (Query Options) e Hooks do Catálogo de NFTs via TanStack Query v5.
 *
 * Configuração:
 * - staleTime: 60_000 ms (1 minuto)
 * - gcTime: 300_000 ms (5 minutos)
 * - placeholderData: keepPreviousData (mantém os dados anteriores visíveis durante transições de página/filtros)
 */
import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";

import type { NftListResponse } from "@/contracts/catalog";
import { http } from "@/lib/http";
import { queryKeys } from "@/lib/query/keys";
import type { CatalogFilters, CatalogResponse } from "./types";

export const CATALOG_STALE_TIME = 60_000;
export const CATALOG_GC_TIME = 5 * 60_000;

/**
 * Cria as opções de consulta tipadas para listagem do catálogo de NFTs.
 */
export function catalogListQueryOptions(filters: CatalogFilters = {}) {
  return queryOptions<CatalogResponse>({
    queryKey: queryKeys.catalog.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const params: Record<string, string | number> = {};

      if (filters.page !== undefined) params.page = filters.page;
      if (filters.limit !== undefined) params.limit = filters.limit;
      if (filters.pageSize !== undefined) params.pageSize = filters.pageSize;
      const searchTerm = filters.q ?? filters.search;
      if (searchTerm) {
        params.q = searchTerm;
      }
      if (filters.category) params.category = filters.category;
      if (filters.collection) params.collection = filters.collection;
      if (filters.rarity) params.rarity = filters.rarity;
      if (filters.network) params.network = filters.network;
      if (filters.availability) params.availability = filters.availability;
      if (filters.priceMin) params.priceMin = filters.priceMin;
      if (filters.priceMax) params.priceMax = filters.priceMax;

      if (filters.sortBy) {
        if (filters.sortBy === "price") {
          params.sort = filters.sortDirection === "desc" ? "price_desc" : "price_asc";
        } else {
          params.sort = filters.sortBy;
        }
      } else if (filters.sort) {
        params.sort = filters.sort;
      }

      const response = await http.get<NftListResponse>("/nfts", { params });

      const catalogResponse: CatalogResponse = {
        items: response.items,
        data: response.items,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages,
        facets: response.facets,
        meta: {
          total: response.total,
          page: response.page,
          limit: response.pageSize,
          totalPages: response.totalPages,
        },
      };

      return catalogResponse;
    },
    staleTime: CATALOG_STALE_TIME,
    gcTime: CATALOG_GC_TIME,
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook de consulta do catálogo de NFTs com suporte a filtros e paginação fluida.
 */
export function useCatalog(filters: CatalogFilters = {}) {
  return useQuery(catalogListQueryOptions(filters));
}
