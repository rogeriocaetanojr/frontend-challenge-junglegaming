/**
 * Testes unitários para useCatalogSearch e schemas (src/features/catalog/useCatalogSearch.ts).
 */
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { catalogSearchSchema, parseCatalogSearch } from "../schemas";
import { useCatalogSearch, type UseCatalogSearchReturn } from "../useCatalogSearch";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("catalogSearchSchema e parseCatalogSearch", () => {
  it("deve retornar valores padrão quando a busca estiver vazia ou indefinida", () => {
    const result = parseCatalogSearch({});
    expect(result).toEqual({
      page: 1,
      limit: 12,
    });

    const nullResult = parseCatalogSearch(null);
    expect(nullResult).toEqual({
      page: 1,
      limit: 12,
    });
  });

  it("deve realizar coerção correta de tipos para valores numéricos a partir de strings", () => {
    const raw = {
      page: "3",
      limit: "24",
      minPrice: "1.5",
      maxPrice: "10.0",
      sortBy: "price",
      sortDirection: "desc",
      q: "Ape",
      category: "gaming",
    };

    const parsed = parseCatalogSearch(raw);

    expect(parsed).toEqual({
      page: 3,
      limit: 24,
      minPrice: 1.5,
      maxPrice: 10,
      sortBy: "price",
      sortDirection: "desc",
      q: "Ape",
      category: "gaming",
    });
  });

  it("deve sanitizar inputs inválidos e aplicar fallbacks seguros", () => {
    const raw = {
      page: "-5",
      limit: "invalido",
      minPrice: "-10",
      maxPrice: "not-a-number",
      q: "   ",
      category: "   ",
    };

    const parsed = parseCatalogSearch(raw);

    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(12);
    expect(parsed.minPrice).toBeUndefined();
    expect(parsed.maxPrice).toBeUndefined();
    expect(parsed.q).toBeUndefined();
    expect(parsed.category).toBeUndefined();
  });

  it("deve remover espaços em branco desnecessários em q e category", () => {
    const raw = {
      q: "   Jungle Primates   ",
      category: "  art  ",
    };

    const parsed = parseCatalogSearch(raw);

    expect(parsed.q).toBe("Jungle Primates");
    expect(parsed.category).toBe("art");
  });

  it("deve aceitar os campos válidos diretamente no schema catalogSearchSchema", () => {
    const valid = catalogSearchSchema.safeParse({
      page: 2,
      limit: 48,
      sortBy: "createdAt",
      sortDirection: "asc",
    });

    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.page).toBe(2);
      expect(valid.data.limit).toBe(48);
      expect(valid.data.sortBy).toBe("createdAt");
      expect(valid.data.sortDirection).toBe("asc");
    }
  });
});

describe("useCatalogSearch (Hook com TanStack Router)", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    container?.remove();
    vi.restoreAllMocks();
  });

  function setupRouterTest(initialUrl = "/") {
    let hookState: UseCatalogSearchReturn | null = null;

    function TestConsumer() {
      hookState = useCatalogSearch();
      return React.createElement(
        "div",
        { "data-testid": "search-state" },
        `Page: ${hookState.page}, Limit: ${hookState.limit}`,
      );
    }

    const rootRoute = createRootRoute();
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      validateSearch: (search) => parseCatalogSearch(search),
      component: TestConsumer,
    });

    const routeTree = rootRoute.addChildren([indexRoute]);
    const history = createMemoryHistory({ initialEntries: [initialUrl] });
    const router = createRouter({ routeTree, history });

    return {
      router,
      getHook: () => hookState!,
    };
  }

  it("deve inicializar com parâmetros parseados a partir da busca fornecida na URL", async () => {
    const { router, getHook } = setupRouterTest(
      "/?q=sword&category=gaming&minPrice=2&maxPrice=5&sortBy=price&sortDirection=asc&page=2&limit=24",
    );

    await act(async () => {
      root?.render(React.createElement(RouterProvider, { router }));
    });

    const hook = getHook();
    expect(hook).not.toBeNull();
    expect(hook.q).toBe("sword");
    expect(hook.category).toBe("gaming");
    expect(hook.minPrice).toBe(2);
    expect(hook.maxPrice).toBe(5);
    expect(hook.sortBy).toBe("price");
    expect(hook.sortDirection).toBe("asc");
    expect(hook.page).toBe(2);
    expect(hook.limit).toBe(24);
  });

  it("setSearch deve atualizar q e resetar page para 1 preservando outros parâmetros", async () => {
    const { router, getHook } = setupRouterTest("/?category=art&page=4&limit=12");

    await act(async () => {
      root?.render(React.createElement(RouterProvider, { router }));
    });

    await act(async () => {
      getHook().setSearch("Dragon");
    });

    const updated = getHook();
    expect(updated.q).toBe("Dragon");
    expect(updated.category).toBe("art");
    expect(updated.page).toBe(1);
    expect(updated.limit).toBe(12);

    const searchState = router.state.location.search as Record<string, unknown>;
    expect(searchState.q).toBe("Dragon");
    expect(searchState.page).toBe(1);
    expect(searchState.category).toBe("art");
  });

  it("setSearch com string vazia deve remover o termo q da URL", async () => {
    const { router, getHook } = setupRouterTest("/?q=oldQuery&page=3");

    await act(async () => {
      root?.render(React.createElement(RouterProvider, { router }));
    });

    await act(async () => {
      getHook().setSearch("   ");
    });

    const updated = getHook();
    expect(updated.q).toBeUndefined();
    expect(updated.page).toBe(1);

    const searchState = router.state.location.search as Record<string, unknown>;
    expect(searchState.q).toBeUndefined();
  });

  it("setCategory deve atualizar category e resetar page para 1", async () => {
    const { router, getHook } = setupRouterTest("/?page=3");

    await act(async () => {
      root?.render(React.createElement(RouterProvider, { router }));
    });

    await act(async () => {
      getHook().setCategory("photography");
    });

    const updated = getHook();
    expect(updated.category).toBe("photography");
    expect(updated.page).toBe(1);

    const searchState = router.state.location.search as Record<string, unknown>;
    expect(searchState.category).toBe("photography");
    expect(searchState.page).toBe(1);
  });

  it("setPriceRange deve atualizar minPrice e maxPrice e resetar page para 1", async () => {
    const { router, getHook } = setupRouterTest("/?page=5");

    await act(async () => {
      root?.render(React.createElement(RouterProvider, { router }));
    });

    await act(async () => {
      getHook().setPriceRange({ min: 0.5, max: 2.0 });
    });

    const updated = getHook();
    expect(updated.minPrice).toBe(0.5);
    expect(updated.maxPrice).toBe(2.0);
    expect(updated.page).toBe(1);

    const searchState = router.state.location.search as Record<string, unknown>;
    expect(searchState.minPrice).toBe(0.5);
    expect(searchState.maxPrice).toBe(2.0);
    expect(searchState.page).toBe(1);
  });

  it("setSort deve atualizar ordenação e resetar page para 1", async () => {
    const { router, getHook } = setupRouterTest("/?page=2");

    await act(async () => {
      root?.render(React.createElement(RouterProvider, { router }));
    });

    await act(async () => {
      getHook().setSort("price", "asc");
    });

    const updated = getHook();
    expect(updated.sortBy).toBe("price");
    expect(updated.sortDirection).toBe("asc");
    expect(updated.page).toBe(1);

    const searchState = router.state.location.search as Record<string, unknown>;
    expect(searchState.sortBy).toBe("price");
    expect(searchState.sortDirection).toBe("asc");
    expect(searchState.page).toBe(1);
  });

  it("setPage deve atualizar apenas a página preservando todos os filtros", async () => {
    const { router, getHook } = setupRouterTest("/?q=ape&category=art&page=1");

    await act(async () => {
      root?.render(React.createElement(RouterProvider, { router }));
    });

    await act(async () => {
      getHook().setPage(3);
    });

    const updated = getHook();
    expect(updated.page).toBe(3);
    expect(updated.q).toBe("ape");
    expect(updated.category).toBe("art");

    const searchState = router.state.location.search as Record<string, unknown>;
    expect(searchState.page).toBe(3);
    expect(searchState.q).toBe("ape");
    expect(searchState.category).toBe("art");
  });

  it("setLimit deve atualizar limit e resetar page para 1", async () => {
    const { router, getHook } = setupRouterTest("/?page=4&limit=12");

    await act(async () => {
      root?.render(React.createElement(RouterProvider, { router }));
    });

    await act(async () => {
      getHook().setLimit(48);
    });

    const updated = getHook();
    expect(updated.limit).toBe(48);
    expect(updated.page).toBe(1);

    const searchState = router.state.location.search as Record<string, unknown>;
    expect(searchState.limit).toBe(48);
    expect(searchState.page).toBe(1);
  });

  it("resetFilters deve limpar todos os filtros e retornar para defaults (page 1, limit 12)", async () => {
    const { router, getHook } = setupRouterTest(
      "/?q=dragon&category=art&minPrice=1&maxPrice=10&sortBy=price&sortDirection=desc&page=5&limit=24",
    );

    await act(async () => {
      root?.render(React.createElement(RouterProvider, { router }));
    });

    await act(async () => {
      getHook().resetFilters();
    });

    const updated = getHook();
    expect(updated.q).toBeUndefined();
    expect(updated.category).toBeUndefined();
    expect(updated.minPrice).toBeUndefined();
    expect(updated.maxPrice).toBeUndefined();
    expect(updated.sortBy).toBeUndefined();
    expect(updated.sortDirection).toBeUndefined();
    expect(updated.page).toBe(1);
    expect(updated.limit).toBe(12);

    const searchState = router.state.location.search as Record<string, unknown>;
    expect(searchState.q).toBeUndefined();
    expect(searchState.category).toBeUndefined();
    expect(searchState.minPrice).toBeUndefined();
    expect(searchState.maxPrice).toBeUndefined();
    expect(searchState.sortBy).toBeUndefined();
    expect(searchState.sortDirection).toBeUndefined();
    expect(searchState.page).toBe(1);
    expect(searchState.limit).toBe(12);
  });
});
