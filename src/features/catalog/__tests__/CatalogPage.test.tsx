/**
 * Testes de Integração e Renderização da Página de Catálogo (CatalogPage.tsx).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
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

import { asId, type EthString, type IsoDate } from "@/contracts/common";
import { http } from "@/lib/http";
import { resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";
import { CatalogPage } from "../CatalogPage";
import { parseCatalogSearch } from "../schemas";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function waitFor(condition: () => boolean | void, timeout = 3000, step = 20) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = condition();
      if (res !== false) return;
    } catch {
      // Repete até o timeout
    }
    await act(async () => {
      await new Promise((r) => setTimeout(r, step));
    });
  }
  condition();
}

describe("CatalogPage (src/features/catalog/CatalogPage.tsx)", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;
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
    window.scrollTo = vi.fn();

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
        },
      },
    });
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    container?.remove();
    server.resetHandlers();
    queryClient.clear();
    vi.restoreAllMocks();
  });

  function renderPage(initialUrl = "/") {
    const rootRoute = createRootRoute({
      component: () => React.createElement(Outlet),
    });

    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      validateSearch: (search) => parseCatalogSearch(search),
      component: CatalogPage,
    });

    const routeTree = rootRoute.addChildren([indexRoute]);
    const history = createMemoryHistory({ initialEntries: [initialUrl] });
    const router = createRouter({ routeTree, history });

    return {
      router,
      render: async () => {
        await act(async () => {
          root?.render(
            React.createElement(
              QueryClientProvider,
              { client: queryClient },
              React.createElement(RouterProvider, { router }),
            ),
          );
        });
      },
    };
  }

  it("deve renderizar a estrutura completa da página com busca, filtros, toolbar e itens do MSW", async () => {
    const { render } = renderPage("/");
    await render();

    // Valida elementos estáticos da página
    const pageContainer = container?.querySelector('[data-testid="catalog-page"]');
    expect(pageContainer).not.toBeNull();
    expect(container?.textContent).toContain("Catálogo de NFTs");

    // Valida presença da busca semântica
    const searchInput = container?.querySelector<HTMLInputElement>(
      'input#catalog-search-input, input[type="search"]',
    );
    expect(searchInput).not.toBeNull();

    // Valida presença da toolbar
    const toolbar = container?.querySelector('[data-testid="catalog-toolbar"]');
    expect(toolbar).not.toBeNull();

    // Aguarda o retorno assíncrono dos NFTs do MSW e preenchimento da toolbar
    await waitFor(() => {
      const cards = container?.querySelectorAll("article");
      expect(cards && cards.length > 0).toBe(true);

      const countElement = container?.querySelector(
        '[data-testid="catalog-toolbar-count"]',
      );
      expect(countElement).not.toBeNull();
      expect(countElement?.textContent).toContain("itens encontrados");
    });
  });

  it("deve sincronizar o termo de busca com a rota e disparar consulta filtrada", async () => {
    const { render, router } = renderPage("/");
    await render();

    const input = container?.querySelector<HTMLInputElement>(
      'input#catalog-search-input, input[type="search"]',
    );
    expect(input).not.toBeNull();

    if (input) {
      await act(async () => {
        const prototype = Object.getPrototypeOf(input);
        const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
        descriptor?.set?.call(input, "Cyber");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }

    // Aguarda debounce de 350ms do SearchInput
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });

    await waitFor(() => {
      const searchState = router.state.location.search as Record<string, unknown>;
      expect(searchState.q).toBe("Cyber");
      expect(searchState.page).toBe(1);
    });
  });

  it("deve atualizar a ordenação na rota ao alterar o select da toolbar", async () => {
    const { render, router } = renderPage("/");
    await render();

    const sortSelect = container?.querySelector<HTMLSelectElement>("#catalog-sort");
    expect(sortSelect).not.toBeNull();

    if (sortSelect) {
      await act(async () => {
        sortSelect.value = "price:asc";
        sortSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }

    await waitFor(() => {
      const searchState = router.state.location.search as Record<string, unknown>;
      expect(searchState.sortBy).toBe("price");
      expect(searchState.sortDirection).toBe("asc");
      expect(searchState.page).toBe(1);
    });
  });

  it("deve atualizar a categoria na rota ao selecionar um filtro de categoria", async () => {
    const { render, router } = renderPage("/");
    await render();

    // Encontra o botão de filtro de categoria "Arte"
    await waitFor(() => {
      const categoryPills = container?.querySelectorAll("button[aria-pressed]");
      expect(categoryPills && categoryPills.length > 0).toBe(true);
    });

    const artButton = Array.from(
      container?.querySelectorAll("button[aria-pressed]") ?? [],
    ).find((btn) => btn.textContent?.includes("Arte"));

    expect(artButton).toBeDefined();

    if (artButton) {
      await act(async () => {
        (artButton as HTMLButtonElement).click();
      });
    }

    await waitFor(() => {
      const searchState = router.state.location.search as Record<string, unknown>;
      expect(searchState.category).toBe("art");
      expect(searchState.page).toBe(1);
    });
  });

  it("deve renderizar o estado de erro e disparar retry ao clicar em 'Tentar Novamente'", async () => {
    // Simula falha na chamada HTTP para o catálogo
    vi.spyOn(http, "get").mockRejectedValueOnce(new Error("Serviço indisponível"));

    const { render } = renderPage("/");
    await render();

    await waitFor(() => {
      const alert = container?.querySelector('[role="alert"]');
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toContain("Falha ao carregar catálogo");
    });

    const retryBtn = Array.from(container?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.includes("Tentar novamente"),
    );
    expect(retryBtn).toBeDefined();

    // Clica em retry, chamada subsequente usa o MSW original
    if (retryBtn) {
      await act(async () => {
        retryBtn.click();
      });
    }

    await waitFor(() => {
      const cards = container?.querySelectorAll("article");
      expect(cards && cards.length > 0).toBe(true);
    });
  });

  it("deve renderizar o estado vazio e resetar filtros ao clicar em 'Limpar filtros'", async () => {
    // Simula resposta com 0 itens
    vi.spyOn(http, "get").mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      pageSize: 12,
      totalPages: 0,
      facets: { collections: [], categories: [], networks: [], rarities: [] },
    } as never);

    const { render, router } = renderPage("/?q=inexistente&category=gaming");
    await render();

    await waitFor(() => {
      expect(container?.textContent).toContain("Nenhum NFT encontrado");
    });

    const clearBtn = Array.from(container?.querySelectorAll("button") ?? []).find((b) =>
      b.textContent?.includes("Limpar filtros"),
    );
    expect(clearBtn).toBeDefined();

    if (clearBtn) {
      await act(async () => {
        clearBtn.click();
      });
    }

    await waitFor(() => {
      const searchState = router.state.location.search as Record<string, unknown>;
      expect(searchState.q).toBeUndefined();
      expect(searchState.category).toBeUndefined();
      expect(searchState.page).toBe(1);
    });
  });

  it("deve renderizar controles de paginação quando houver múltiplas páginas e navegar ao clicar", async () => {
    // Simula resposta paginada com totalPages = 3
    vi.spyOn(http, "get").mockImplementation(async (_url, config) => {
      const page = Number((config?.params as Record<string, unknown>)?.page || "1");
      return {
        items: [
          {
            id: asId<"nft">(`nft_page_${page}`),
            title: `NFT da Página ${page}`,
            price: "1.0" as EthString,
            images: [{ url: "/test.jpg", alt: "Test NFT" }],
            collection: { id: "col1", name: "Jungle" },
            category: "art",
            network: "ethereum",
            editions: [],
            featured: false,
            rarity: "common",
            version: 1,
            updatedAt: "2026-10-20T00:00:00.000Z" as IsoDate,
          },
        ],
        total: 36,
        page,
        pageSize: 12,
        totalPages: 3,
        facets: { collections: [], categories: [], networks: [], rarities: [] },
      } as never;
    });

    const { render, router } = renderPage("/");
    await render();

    await waitFor(() => {
      const paginationNav = container?.querySelector(
        '[data-testid="catalog-pagination"]',
      );
      expect(paginationNav).not.toBeNull();
    });

    const page2Button = container?.querySelector<HTMLButtonElement>(
      '[data-testid="pagination-page-2"]',
    );
    expect(page2Button).not.toBeNull();

    if (page2Button) {
      await act(async () => {
        page2Button.click();
      });
    }

    await waitFor(() => {
      const searchState = router.state.location.search as Record<string, unknown>;
      expect(searchState.page).toBe(2);
    });
  });
});
