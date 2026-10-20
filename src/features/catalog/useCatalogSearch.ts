/**
 * Hook de Sincronização de Filtros e Busca do Catálogo com a URL (useCatalogSearch).
 *
 * Integra os search params com o TanStack Router mantendo o estado serializado na URL.
 * Em conformidade com os requisitos de UX e contratos do marketplace:
 * - Alterações em filtros (termo de busca, categoria, faixa de preço, ordenação e limite) resetam a página para 1.
 * - Paginação mantém os filtros ativos.
 * - Preserva parâmetros desconhecidos/adicionais já existentes na query string.
 * - Sanitização e validação através do catalogSearchSchema (Zod).
 */
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

import { type CatalogSearchParams, parseCatalogSearch } from "./schemas";

export interface UseCatalogSearchOptions {
  /** Função de navegação customizada (útil para testes ou mocks) */
  navigate?: (opts: {
    search: (prev: Record<string, unknown>) => Record<string, unknown>;
    replace?: boolean;
  }) => unknown;
  /** Objeto de search params customizado (útil para testes ou mocks) */
  search?: Record<string, unknown>;
}

export interface UseCatalogSearchReturn {
  searchParams: CatalogSearchParams;
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  page: number;
  limit: number;
  setSearch: (q: string) => void;
  setCategory: (category?: string) => void;
  setPriceRange: (range: { min?: number; max?: number }) => void;
  setSort: (sortBy: string, sortDirection: "asc" | "desc") => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetFilters: () => void;
}

export function useCatalogSearch(
  options?: UseCatalogSearchOptions,
): UseCatalogSearchReturn {
  // Conecta ao router ou utiliza mock injetado
  const routerNavigate = useNavigate();
  const rawRouterSearch = useSearch({ strict: false });

  const navigate = options?.navigate ?? routerNavigate;
  const rawSearch = options?.search ?? (rawRouterSearch as Record<string, unknown>);

  const searchParams = useMemo(() => {
    return parseCatalogSearch(rawSearch);
  }, [rawSearch]);

  const updateSearch = useCallback(
    (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => {
      const navFn = navigate as (opts: {
        search: (prev: Record<string, unknown>) => Record<string, unknown>;
        replace?: boolean;
      }) => unknown;

      navFn({
        search: (prev: Record<string, unknown>) => {
          const prevSafe = prev && typeof prev === "object" ? prev : {};
          const next = updater(prevSafe);

          // Remove propriedades vazias/indefinidas para manter a URL limpa
          const cleaned: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(next)) {
            if (value !== undefined && value !== null && value !== "") {
              cleaned[key] = value;
            }
          }
          return cleaned;
        },
        replace: true,
      });
    },
    [navigate],
  );

  const setSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      updateSearch((prev) => ({
        ...prev,
        q: trimmed.length > 0 ? trimmed : undefined,
        page: 1,
      }));
    },
    [updateSearch],
  );

  const setCategory = useCallback(
    (category?: string) => {
      const trimmed = category?.trim();
      updateSearch((prev) => ({
        ...prev,
        category: trimmed && trimmed.length > 0 ? trimmed : undefined,
        page: 1,
      }));
    },
    [updateSearch],
  );

  const setPriceRange = useCallback(
    (range: { min?: number; max?: number }) => {
      updateSearch((prev) => ({
        ...prev,
        minPrice: range.min !== undefined && range.min >= 0 ? range.min : undefined,
        maxPrice: range.max !== undefined && range.max >= 0 ? range.max : undefined,
        page: 1,
      }));
    },
    [updateSearch],
  );

  const setSort = useCallback(
    (sortBy: string, sortDirection: "asc" | "desc") => {
      updateSearch((prev) => ({
        ...prev,
        sortBy,
        sortDirection,
        page: 1,
      }));
    },
    [updateSearch],
  );

  const setPage = useCallback(
    (page: number) => {
      updateSearch((prev) => ({
        ...prev,
        page: Math.max(1, Math.floor(page)),
      }));
    },
    [updateSearch],
  );

  const setLimit = useCallback(
    (limit: number) => {
      updateSearch((prev) => ({
        ...prev,
        limit: Math.max(1, Math.floor(limit)),
        page: 1,
      }));
    },
    [updateSearch],
  );

  const resetFilters = useCallback(() => {
    updateSearch((prev) => {
      const next = { ...prev };
      delete next.q;
      delete next.category;
      delete next.minPrice;
      delete next.maxPrice;
      delete next.sortBy;
      delete next.sortDirection;

      return {
        ...next,
        page: 1,
        limit: 12,
      };
    });
  }, [updateSearch]);

  return {
    searchParams,
    q: searchParams.q,
    category: searchParams.category,
    minPrice: searchParams.minPrice,
    maxPrice: searchParams.maxPrice,
    sortBy: searchParams.sortBy,
    sortDirection: searchParams.sortDirection,
    page: searchParams.page,
    limit: searchParams.limit,
    setSearch,
    setCategory,
    setPriceRange,
    setSort,
    setPage,
    setLimit,
    resetFilters,
  };
}
