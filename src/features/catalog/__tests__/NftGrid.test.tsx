/**
 * Testes unitários para o NftGrid (src/features/catalog/NftGrid.tsx).
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Nft } from "@/contracts/catalog";
import { asId, type EthString, type IsoDate } from "@/contracts/common";
import { NftGrid } from "../NftGrid";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockNfts: Nft[] = [
  {
    id: asId<"nft">("nft_1"),
    title: "Apex Predator Ape #001",
    description: "Item lendário da coleção Jungle.",
    images: [{ url: "/images/nft-1.png", alt: "Apex Ape" }],
    collection: { id: "col_apes", name: "Jungle Primates" },
    category: "art",
    rarity: "legendary",
    price: "1.5" as EthString,
    editions: [],
    featured: true,
    network: "ethereum",
    version: 1,
    updatedAt: "2026-10-20T00:00:00.000Z" as IsoDate,
  },
  {
    id: asId<"nft">("nft_2"),
    title: "Cyber Panther #042",
    description: "Item épico da coleção Cyber.",
    images: [{ url: "/images/nft-2.png", alt: "Cyber Panther" }],
    collection: { id: "col_panthers", name: "Cyber Felines" },
    category: "gaming",
    rarity: "epic",
    price: "0.85" as EthString,
    editions: [],
    featured: false,
    network: "polygon",
    version: 1,
    updatedAt: "2026-10-20T00:00:00.000Z" as IsoDate,
  },
];

function renderWithRouter(component: React.ReactNode) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <>{component}</>,
  });

  const nftDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/nfts/$id",
    component: () => <div>Detalhe</div>,
  });

  const routeTree = rootRoute.addChildren([indexRoute, nftDetailRoute]);
  const history = createMemoryHistory({ initialEntries: ["/"] });
  const router = createRouter({ routeTree, history });

  return <RouterProvider router={router} />;
}

describe("NftGrid (src/features/catalog/NftGrid.tsx)", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
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

  describe("Estado 1: Carregamento (Loading)", () => {
    it("deve renderizar o número padrão de 8 skeletons com aria-busy='true'", async () => {
      await act(async () => {
        root?.render(<NftGrid isLoading={true} />);
      });

      const section = container?.querySelector("section");
      expect(section).not.toBeNull();
      expect(section?.getAttribute("aria-busy")).toBe("true");
      expect(section?.getAttribute("aria-label")).toBe("Carregando catálogo de NFTs");

      // Cada skeleton é renderizado como um <article aria-busy="true">
      const skeletons = container?.querySelectorAll('article[aria-busy="true"]');
      expect(skeletons?.length).toBe(8);
    });

    it("deve permitir customizar a quantidade de skeletons via skeletonCount", async () => {
      await act(async () => {
        root?.render(<NftGrid isLoading={true} skeletonCount={4} />);
      });

      const skeletons = container?.querySelectorAll('article[aria-busy="true"]');
      expect(skeletons?.length).toBe(4);
    });
  });

  describe("Estado 2: Erro", () => {
    it("deve renderizar container acessível com role='alert' e mensagem do erro", async () => {
      const error = new Error("Falha de rede ao consultar nós da blockchain");

      await act(async () => {
        root?.render(<NftGrid error={error} />);
      });

      const alert = container?.querySelector('[role="alert"]');
      expect(alert).not.toBeNull();
      expect(alert?.textContent).toContain("Falha ao carregar catálogo");
      expect(alert?.textContent).toContain(
        "Falha de rede ao consultar nós da blockchain",
      );
    });

    it("deve acionar o callback onRetry ao clicar no botão 'Tentar novamente'", async () => {
      const onRetryMock = vi.fn();
      const error = new Error("Timeout na requisição");

      await act(async () => {
        root?.render(<NftGrid error={error} onRetry={onRetryMock} />);
      });

      const retryBtn = Array.from(container?.querySelectorAll("button") || []).find(
        (btn) => btn.textContent?.includes("Tentar novamente"),
      );

      expect(retryBtn).toBeDefined();

      await act(async () => {
        retryBtn?.click();
      });

      expect(onRetryMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Estado 3: Vazio", () => {
    it("deve exibir mensagem descritiva quando a lista de itens estiver vazia", async () => {
      await act(async () => {
        root?.render(<NftGrid items={[]} isLoading={false} />);
      });

      expect(container?.textContent).toContain("Nenhum NFT encontrado");
      expect(container?.textContent).toContain(
        "Nenhum NFT encontrado para os filtros selecionados",
      );
    });

    it("deve acionar onClearFilters ao clicar no botão 'Limpar filtros'", async () => {
      const onClearFiltersMock = vi.fn();

      await act(async () => {
        root?.render(
          <NftGrid items={[]} isLoading={false} onClearFilters={onClearFiltersMock} />,
        );
      });

      const clearBtn = Array.from(container?.querySelectorAll("button") || []).find(
        (btn) => btn.textContent?.includes("Limpar filtros"),
      );

      expect(clearBtn).toBeDefined();

      await act(async () => {
        clearBtn?.click();
      });

      expect(onClearFiltersMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Estado 4: Com Dados", () => {
    it("deve renderizar a grade de cards com aria-busy='false' e dados dos NFTs", async () => {
      await act(async () => {
        root?.render(renderWithRouter(<NftGrid items={mockNfts} />));
      });

      const section = container?.querySelector("section");
      expect(section).not.toBeNull();
      expect(section?.getAttribute("aria-busy")).toBe("false");
      expect(section?.getAttribute("aria-label")).toBe("Grade do catálogo de NFTs");

      // Valida renderização dos cards individuais
      expect(container?.textContent).toContain("Apex Predator Ape #001");
      expect(container?.textContent).toContain("1.5 ETH");
      expect(container?.textContent).toContain("Cyber Panther #042");
      expect(container?.textContent).toContain("0.85 ETH");

      const headings = container?.querySelectorAll("h3");
      expect(headings?.length).toBe(2);
    });

    it("deve repassar callback onAddToCart para os cards de NFT", async () => {
      let addedNft: Nft | null = null;
      const onAddToCartMock = (nft: Nft) => {
        addedNft = nft;
      };

      await act(async () => {
        root?.render(
          renderWithRouter(<NftGrid items={mockNfts} onAddToCart={onAddToCartMock} />),
        );
      });

      const buyButtons = container?.querySelectorAll("button");
      expect(buyButtons?.length).toBeGreaterThan(0);

      await act(async () => {
        (buyButtons?.[0] as HTMLButtonElement).click();
      });

      expect(addedNft).toEqual(mockNfts[0]);
    });
  });
});
