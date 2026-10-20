/**
 * Testes unitários para NftCard e NftCardSkeleton (src/features/catalog/).
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
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Nft } from "@/contracts/catalog";
import { asId, type EthString, type IsoDate } from "@/contracts/common";
import { FALLBACK_NFT_IMAGE, NftCard } from "../NftCard";
import { NftCardSkeleton } from "../NftCardSkeleton";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockNft: Nft = {
  id: asId<"nft">("nft_cyber_ape_1"),
  title: "Cyber Jungle Ape #001",
  description: "Exclusivo NFT de teste para validação de catálogo.",
  images: [
    {
      url: "https://assets.example.com/nfts/cyber-ape-1.png",
      alt: "Cyber Ape #001 em estilo cyberpunk com visor neon",
    },
  ],
  collection: {
    id: "col_jungle_primates",
    name: "Jungle Primates Club",
  },
  category: "gaming",
  rarity: "legendary",
  price: "2.5" as EthString,
  editions: [
    {
      id: asId<"edition">("ed_1"),
      label: "Prime Edition",
      total: 10,
      available: 3,
      price: "2.5" as EthString,
    },
  ],
  featured: true,
  network: "ethereum",
  version: 1,
  updatedAt: "2026-10-20T00:00:00.000Z" as IsoDate,
};

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
    component: () => <div>Detalhe do NFT</div>,
  });

  const routeTree = rootRoute.addChildren([indexRoute, nftDetailRoute]);
  const history = createMemoryHistory({ initialEntries: ["/"] });
  const router = createRouter({ routeTree, history });

  return <RouterProvider router={router} />;
}

describe("Componentes de Catálogo (src/features/catalog/)", () => {
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
  });

  describe("NftCard", () => {
    it("deve renderizar o card completo com título semântico, coleção, raridade e preço formatado", async () => {
      await act(async () => {
        root?.render(renderWithRouter(<NftCard nft={mockNft} />));
      });

      // Título semântico em <h3>
      const heading = container?.querySelector("h3");
      expect(heading).not.toBeNull();
      expect(heading?.textContent).toContain("Cyber Jungle Ape #001");

      // Coleção
      expect(container?.textContent).toContain("Jungle Primates Club");

      // Badge de raridade e categoria
      expect(container?.textContent).toContain("legendary");
      expect(container?.textContent).toContain("gaming");

      // Preço formatado com utilitário monetário institucional (formatEth)
      expect(container?.textContent).toContain("2.5 ETH");

      // Imagem com atributo alt descritivo
      const img = container?.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(
        "https://assets.example.com/nfts/cyber-ape-1.png",
      );
      expect(img?.getAttribute("alt")).toBe(
        "Cyber Ape #001 em estilo cyberpunk com visor neon",
      );

      // Link de navegação direcionado para a rota /nfts/$id
      const links = container?.querySelectorAll("a");
      const titleLink = Array.from(links || []).find((a) =>
        a.textContent?.includes("Cyber Jungle Ape #001"),
      );
      expect(titleLink).toBeDefined();
      expect(titleLink?.getAttribute("href")).toBe("/nfts/nft_cyber_ape_1");
    });

    it("deve aplicar imagem de fallback seguro quando o carregamento da imagem original falhar (onError)", async () => {
      await act(async () => {
        root?.render(renderWithRouter(<NftCard nft={mockNft} />));
      });

      const img = container?.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe(
        "https://assets.example.com/nfts/cyber-ape-1.png",
      );

      // Simula falha de carregamento da imagem
      await act(async () => {
        img?.dispatchEvent(new Event("error"));
      });

      // A imagem deve ter sido substituída pelo fallback seguro
      expect(img?.getAttribute("src")).toBe(FALLBACK_NFT_IMAGE);
    });

    it("deve formatar preços sem valor definido como '0 ETH'", async () => {
      const nftZeroPrice: Nft = {
        ...mockNft,
        price: "" as EthString,
      };

      await act(async () => {
        root?.render(renderWithRouter(<NftCard nft={nftZeroPrice} />));
      });

      expect(container?.textContent).toContain("0 ETH");
    });

    it("deve renderizar botão de compra opcional e acionar callback com o NFT correto", async () => {
      let clickedNft: Nft | null = null;
      const handleAddToCart = (nft: Nft) => {
        clickedNft = nft;
      };

      await act(async () => {
        root?.render(
          renderWithRouter(<NftCard nft={mockNft} onAddToCart={handleAddToCart} />),
        );
      });

      const buyButton = container?.querySelector(
        'button[aria-label="Adicionar Cyber Jungle Ape #001 ao carrinho"]',
      ) as HTMLButtonElement;

      expect(buyButton).not.toBeNull();

      await act(async () => {
        buyButton.click();
      });

      expect(clickedNft).toEqual(mockNft);
    });
  });

  describe("NftCardSkeleton", () => {
    it("deve renderizar skeleton acessível com aria-busy='true' e nós decorativos com aria-hidden='true'", async () => {
      await act(async () => {
        root?.render(<NftCardSkeleton />);
      });

      const article = container?.querySelector("article");
      expect(article).not.toBeNull();
      expect(article?.getAttribute("aria-busy")).toBe("true");

      // Valida nós decorativos marcados com aria-hidden
      const hiddenNodes = container?.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenNodes?.length).toBeGreaterThan(0);

      // Valida descrição acessível para leitores de tela
      const srOnly = container?.querySelector(".sr-only");
      expect(srOnly).not.toBeNull();
      expect(srOnly?.textContent).toContain("Carregando informações do NFT...");
    });
  });
});
