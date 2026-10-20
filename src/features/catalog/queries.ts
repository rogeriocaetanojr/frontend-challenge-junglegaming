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
      const searchParams = new URLSearchParams();

      if (filters?.page !== undefined) searchParams.set("page", String(filters.page));
      if (filters?.limit !== undefined) searchParams.set("limit", String(filters.limit));
      if (filters?.pageSize !== undefined)
        searchParams.set("pageSize", String(filters.pageSize));

      const searchTerm = filters?.q ?? filters?.search;
      if (searchTerm) {
        searchParams.set("q", searchTerm);
        searchParams.set("search", searchTerm);
      }
      if (filters?.category) searchParams.set("category", filters.category);
      if (filters?.collection) searchParams.set("collection", filters.collection);
      if (filters?.rarity) searchParams.set("rarity", filters.rarity);
      if (filters?.network) searchParams.set("network", filters.network);
      if (filters?.availability) searchParams.set("availability", filters.availability);
      if (filters?.priceMin) searchParams.set("priceMin", filters.priceMin);
      if (filters?.priceMax) searchParams.set("priceMax", filters.priceMax);

      const resolvedSort =
        filters?.sort ??
        (filters?.sortBy === "price"
          ? filters?.sortDirection === "asc"
            ? "price_asc"
            : "price_desc"
          : filters?.sortBy === "createdAt" || filters?.sortBy === "recent"
            ? "recent"
            : filters?.sortBy === "popular"
              ? "popular"
              : (filters?.sortBy ?? "recent"));

      if (resolvedSort) {
        searchParams.set("sort", resolvedSort);
      }
      if (filters?.sortBy) {
        searchParams.set("sortBy", filters.sortBy);
      }
      if (filters?.sortDirection) {
        searchParams.set("sortDirection", filters.sortDirection);
      }

      const queryString = searchParams.toString();
      const endpoint = queryString ? `/api/nfts?${queryString}` : "/api/nfts";
      const response = await http.get<NftListResponse>(endpoint);

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
