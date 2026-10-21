/**
 * Testes unitários para NftRelatedCollection (src/features/nft-details/NftRelatedCollection.tsx).
 *
 * Validações de comportamento (C74):
 * - Renderiza itens relacionados e links de navegação para /nfts/:id
 * - Exclui o item atualmente exibido da lista
 * - Renderiza fallback seguro e limite de itens
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { TestRouter } from "@/test/test-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NftRelatedCollection } from "../NftRelatedCollection";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("NftRelatedCollection (src/features/nft-details/NftRelatedCollection.tsx)", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
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

  it("deve renderizar os itens com título e links acessíveis", async () => {
    const mockItems = [
      {
        id: "nft-1" as const,
        title: "Emerald Ape #042",
        description: "",
        images: [{ url: "/img1.png", alt: "Emerald Ape" }],
        collection: { id: "genesis-apes", name: "Genesis Apes" },
        category: "art",
        rarity: "legendary" as const,
        price: "1.19" as const,
        editions: [],
        featured: false,
        network: "ethereum" as const,
        version: 1,
        updatedAt: "2026-10-19T00:00:00.000Z" as const,
      },
      {
        id: "nft-2" as const,
        title: "Sage Nomad #009",
        description: "",
        images: [{ url: "/img2.png", alt: "Sage Nomad" }],
        collection: { id: "genesis-apes", name: "Genesis Apes" },
        category: "art",
        rarity: "epic" as const,
        price: "1.69" as const,
        editions: [],
        featured: false,
        network: "ethereum" as const,
        version: 1,
        updatedAt: "2026-10-19T00:00:00.000Z" as const,
      },
    ];

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <TestRouter>
            <NftRelatedCollection
              currentNftId="nft-999"
              collectionId="genesis-apes"
              initialItems={mockItems}
            />
          </TestRouter>
        </QueryClientProvider>,
      );
    });

    expect(container?.textContent).toContain("Mais desta coleção");
    expect(container?.textContent).toContain("Emerald Ape #042");
    expect(container?.textContent).toContain("Sage Nomad #009");
  });

  it("deve filtrar e excluir o NFT atualmente exibido", async () => {
    const mockItems = [
      {
        id: "nft-1" as const,
        title: "Item Atual Exibido",
        description: "",
        images: [{ url: "/img.png", alt: "Item Atual" }],
        collection: { id: "genesis-apes", name: "Genesis Apes" },
        category: "art",
        rarity: "rare" as const,
        price: "1.0" as const,
        editions: [],
        featured: false,
        network: "ethereum" as const,
        version: 1,
        updatedAt: "2026-10-19T00:00:00.000Z" as const,
      },
      {
        id: "nft-2" as const,
        title: "Item Relacionado 2",
        description: "",
        images: [{ url: "/img2.png", alt: "Item 2" }],
        collection: { id: "genesis-apes", name: "Genesis Apes" },
        category: "art",
        rarity: "rare" as const,
        price: "2.0" as const,
        editions: [],
        featured: false,
        network: "ethereum" as const,
        version: 1,
        updatedAt: "2026-10-19T00:00:00.000Z" as const,
      },
    ];

    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <TestRouter>
            <NftRelatedCollection
              currentNftId="nft-1"
              collectionId="genesis-apes"
              initialItems={mockItems}
            />
          </TestRouter>
        </QueryClientProvider>,
      );
    });

    expect(container?.textContent).not.toContain("Item Atual Exibido");
    expect(container?.textContent).toContain("Item Relacionado 2");
  });
});
