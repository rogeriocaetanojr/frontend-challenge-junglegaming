/**
 * Testes de integração e acessibilidade para NftDetailPage (src/features/nft-details/NftDetailPage.tsx).
 *
 * Commit C75:
 * - Renderização e carregamento com MSW via navegação /nfts/:id
 * - Exibição de título, valor em ETH, imagem e painel de compra
 * - Interações funcionais: incremento/decremento de quantidade e alternância de abas
 * - Acessibilidade básica e integridade semântica
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

import { db, resetDb } from "@/mocks/db";
import { server } from "@/mocks/server";
import { NftDetailPage } from "../NftDetailPage";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function waitForCondition(
  predicate: () => boolean,
  timeout = 3000,
  interval = 50,
): Promise<void> {
  const startTime = Date.now();
  while (!predicate()) {
    if (Date.now() - startTime > timeout) {
      throw new Error("Tempo limite excedido esperando condição no teste de integração.");
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, interval));
    });
  }
}

describe("NftDetailPage Integration & Accessibility (C75)", () => {
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

  function renderNftDetailPage(nftId = "1") {
    return act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/nfts/${nftId}`]}>
            <Routes>
              <Route path="/nfts/:id" element={<NftDetailPage nftId={nftId} />} />
              <Route path="/" element={<div>Mercado Home</div>} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });
  }

  it("deve carregar dados do NFT via MSW e renderizar título, preço em ETH e imagem", async () => {
    await renderNftDetailPage("1");

    await waitForCondition(() => {
      return (container?.textContent || "").includes("Emerald Ape #042");
    });

    // Título e Preço
    expect(container?.textContent).toContain("Emerald Ape #042");
    expect(container?.textContent).toContain("1.19 ETH");

    // Imagem principal carregada
    const mainImg = container?.querySelector(
      'img[alt="Emerald Ape #042"]',
    ) as HTMLImageElement | null;
    expect(mainImg).not.toBeNull();
    expect(mainImg?.src).toContain("emerald-ape.png");

    // Metadados da coleção e ID
    expect(container?.textContent).toContain("Coleção: Genesis Apes");
    expect(container?.textContent).toContain("ID do token: #042");
  });

  it("deve permitir interação no seletor de quantidade (incrementar e decrementar)", async () => {
    await renderNftDetailPage("1");

    await waitForCondition(() => {
      return (container?.textContent || "").includes("Emerald Ape #042");
    });

    const decreaseBtn = container?.querySelector(
      'button[aria-label="Diminuir quantidade"]',
    ) as HTMLButtonElement | null;
    const increaseBtn = container?.querySelector(
      'button[aria-label="Aumentar quantidade"]',
    ) as HTMLButtonElement | null;

    expect(decreaseBtn).not.toBeNull();
    expect(increaseBtn).not.toBeNull();

    // Começa em 1 (com decrementar desabilitado)
    expect(decreaseBtn?.disabled).toBe(true);
    expect(container?.textContent).toContain("1");

    // Incrementa para 2
    await act(async () => {
      increaseBtn?.click();
    });
    expect(container?.textContent).toContain("2");
    expect(decreaseBtn?.disabled).toBe(false);

    // Decrementa de volta para 1
    await act(async () => {
      decreaseBtn?.click();
    });
    expect(container?.textContent).toContain("1");
    expect(decreaseBtn?.disabled).toBe(true);
  });

  it("deve alternar entre as abas técnicas e avaliações com atributos de acessibilidade", async () => {
    await renderNftDetailPage("1");

    await waitForCondition(() => {
      return (container?.textContent || "").includes("Emerald Ape #042");
    });

    const detailsTab = container?.querySelector(
      "#tab-details",
    ) as HTMLButtonElement | null;
    const reviewsTab = container?.querySelector(
      "#tab-reviews",
    ) as HTMLButtonElement | null;

    expect(detailsTab).not.toBeNull();
    expect(reviewsTab).not.toBeNull();

    // Inicialmente na aba de Detalhes
    expect(detailsTab?.getAttribute("aria-selected")).toBe("true");
    expect(reviewsTab?.getAttribute("aria-selected")).toBe("false");
    expect(container?.querySelector("#panel-details")).not.toBeNull();

    // Clica na aba de Avaliações
    await act(async () => {
      reviewsTab?.click();
    });

    expect(detailsTab?.getAttribute("aria-selected")).toBe("false");
    expect(reviewsTab?.getAttribute("aria-selected")).toBe("true");
    expect(container?.querySelector("#panel-reviews")).not.toBeNull();

    // Clica de volta na aba de Detalhes
    await act(async () => {
      detailsTab?.click();
    });

    expect(detailsTab?.getAttribute("aria-selected")).toBe("true");
    expect(reviewsTab?.getAttribute("aria-selected")).toBe("false");
    expect(container?.querySelector("#panel-details")).not.toBeNull();
  });

  it("deve exibir fallback amigável quando o NFT não for localizado no catálogo", async () => {
    // Remove o NFT temporariamente do db em memória
    db.nfts.delete("nft-999" as never);

    await renderNftDetailPage("999");

    await waitForCondition(() => {
      return (container?.textContent || "").includes("NFT Não Encontrado");
    });

    expect(container?.textContent).toContain("NFT Não Encontrado");
    expect(container?.textContent).toContain("Voltar ao Mercado");
  });
});
