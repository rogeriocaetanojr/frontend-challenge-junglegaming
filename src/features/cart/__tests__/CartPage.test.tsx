/**
 * Testes unitários e de integração para a página de carrinho CartPage (src/features/cart/CartPage.tsx).
 *
 * Validações de comportamento (C78 a C81):
 * - Renderização de itens contidos na store
 * - Interações de quantidade e remoção de item
 * - Renderização do estado vazio
 * - Cálculo de cotação e exibição no resumo
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { TestRouter } from "@/test/test-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "@/store/cart-store";
import { CartPage } from "../CartPage";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("CartPage (src/features/cart/CartPage.tsx)", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    useCartStore.getState().clearCart();

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

  async function renderCartPage() {
    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <TestRouter>
            <CartPage />
          </TestRouter>
        </QueryClientProvider>,
      );
    });
  }

  it("deve renderizar estado vazio quando não houver itens no carrinho", async () => {
    await renderCartPage();

    expect(container?.textContent).toContain("Seu Carrinho está Vazio");
    expect(container?.textContent).toContain("Explorar Mercado");
  });

  it("deve renderizar os itens do carrinho com título, preço e controles", async () => {
    useCartStore.getState().addItem(
      {
        id: "nft-1",
        title: "Emerald Ape #042",
        price: 1.19,
        image: "/images/nfts/emerald-ape.png",
      },
      2,
    );

    await renderCartPage();

    expect(container?.textContent).toContain("Emerald Ape #042");
    expect(container?.textContent).toContain("ID do token: #0042");
    expect(container?.textContent).toContain("2"); // quantidade
    expect(container?.textContent).toContain("2.38 ETH"); // subtotal linha
  });

  it("deve permitir remover um item através do botão de lixeira", async () => {
    useCartStore.getState().addItem({
      id: "nft-1",
      title: "Emerald Ape #042",
      price: 1.19,
      image: "/images/nfts/emerald-ape.png",
    });

    await renderCartPage();
    expect(container?.textContent).toContain("Emerald Ape #042");

    const deleteBtn = container?.querySelector(
      'button[aria-label="Remover Emerald Ape #042 do carrinho"]',
    ) as HTMLButtonElement | null;

    expect(deleteBtn).not.toBeNull();

    await act(async () => {
      deleteBtn?.click();
    });

    expect(useCartStore.getState().items.length).toBe(0);
    expect(container?.textContent).toContain("Seu Carrinho está Vazio");
  });

  it("deve exibir totais no resumo financeiro CartSummary", async () => {
    useCartStore.getState().addItem({
      id: "nft-1",
      title: "Emerald Ape #042",
      price: 1.19,
      image: "/images/nfts/emerald-ape.png",
    });

    await renderCartPage();

    expect(container?.textContent).toContain("Resumo da carteira");
    expect(container?.textContent).toContain("1.19 ETH");
    expect(container?.textContent).toContain("Conectar e finalizar");
  });
});
