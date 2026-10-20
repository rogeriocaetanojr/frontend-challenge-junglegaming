/**
 * Testes unitários para as queries e hooks do catálogo (src/features/catalog/queries.ts).
 */
import { keepPreviousData, QueryClient } from "@tanstack/react-query";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { http } from "@/lib/http";
import { queryKeys } from "@/lib/query/keys";
import { resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";
import { CATALOG_GC_TIME, CATALOG_STALE_TIME, catalogListQueryOptions } from "../queries";
import type { CatalogFilters } from "../types";

describe("Queries do Catálogo (src/features/catalog/queries.ts)", () => {
  let queryClient: QueryClient;

  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    resetDb();
    scenarioEngine.reset();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Infinity },
      },
    });
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.restoreAllMocks();
  });

  describe("catalogListQueryOptions", () => {
    it("deve configurar queryKey pública compatível com a fábrica de chaves", () => {
      const filters: CatalogFilters = { page: 1, limit: 8, category: "art" };
      const options = catalogListQueryOptions(filters);

      expect(options.queryKey).toEqual(
        queryKeys.catalog.list(filters as Record<string, unknown>),
      );
      expect(options.queryKey[0]).toBe("public");
      expect(options.queryKey[1]).toBe("catalog");
      expect(options.queryKey[2]).toBe("list");
    });

    it("deve configurar staleTime de 1 minuto, gcTime de 5 minutos e keepPreviousData", () => {
      const options = catalogListQueryOptions();

      expect(options.staleTime).toBe(CATALOG_STALE_TIME);
      expect(options.staleTime).toBe(60_000);
      expect(options.gcTime).toBe(CATALOG_GC_TIME);
      expect(options.gcTime).toBe(300_000);
      expect(options.placeholderData).toBe(keepPreviousData);
    });

    it("deve resolver dados com filtros padrão contendo data, items, meta e facets", async () => {
      const options = catalogListQueryOptions();

      // Executa a query através do TanStack Query Client
      const result = await queryClient.fetchQuery(options);

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toBe(result.items);
      expect(result.items.length).toBeGreaterThan(0);

      // Metadados de paginação
      expect(result.meta).toEqual({
        total: result.total,
        page: result.page,
        limit: result.pageSize,
        totalPages: result.totalPages,
      });
      expect(result.meta.page).toBe(1);
      expect(result.meta.total).toBeGreaterThan(0);

      // Facetas agregadas
      expect(result.facets).toBeDefined();
      expect(Array.isArray(result.facets.categories)).toBe(true);
      expect(Array.isArray(result.facets.networks)).toBe(true);
    });

    it("deve repassar corretamente os query params na URL via cliente HTTP", async () => {
      const httpGetSpy = vi.spyOn(http, "get");

      const filters: CatalogFilters = {
        search: "emerald",
        category: "art",
        page: 2,
        limit: 4,
        sortBy: "price",
        sortDirection: "desc",
        priceMin: "0.1",
        priceMax: "5.0",
      };

      const options = catalogListQueryOptions(filters);
      await queryClient.fetchQuery(options);

      expect(httpGetSpy).toHaveBeenCalledTimes(1);
      expect(httpGetSpy).toHaveBeenCalledWith(
        "/nfts",
        expect.objectContaining({
          params: {
            page: 2,
            limit: 4,
            q: "emerald",
            category: "art",
            sort: "price_desc",
            priceMin: "0.1",
            priceMax: "5.0",
          },
        }),
      );
    });

    it("deve mapear corretamente ordenação crescente por preço (sortDirection: asc)", async () => {
      const httpGetSpy = vi.spyOn(http, "get");

      const filters: CatalogFilters = {
        sortBy: "price",
        sortDirection: "asc",
      };

      const options = catalogListQueryOptions(filters);
      await queryClient.fetchQuery(options);

      expect(httpGetSpy).toHaveBeenCalledWith(
        "/nfts",
        expect.objectContaining({
          params: expect.objectContaining({
            sort: "price_asc",
          }),
        }),
      );
    });

    it("deve manter dados anteriores como placeholder (keepPreviousData) ao alternar filtros", () => {
      const options = catalogListQueryOptions({ page: 2 });
      const previousData = {
        items: [],
        data: [],
        total: 10,
        page: 1,
        pageSize: 5,
        totalPages: 2,
        facets: {
          categories: [],
          collections: [],
          networks: [],
          rarities: [],
        },
        meta: { total: 10, page: 1, limit: 5, totalPages: 2 },
      };

      // Chama a função placeholderData configurada
      const placeholderFn = options.placeholderData as (previous: unknown) => unknown;
      const placeholderResult = placeholderFn(previousData);

      expect(placeholderResult).toBe(previousData);
    });
  });
});
