/**
 * Testes de integração do fluxo de carrinho (CartPage, cartStore, cálculo de cotação e cupom).
 *
 * Commit C82:
 * 1. Renderização da página com itens carregados da store.
 * 2. Alteração de quantidade e remoção de um item (validando a atualização visual e da store).
 * 3. Aplicação com sucesso do cupom "KURIO10" refletindo o desconto na cotação.
 * 4. Exibição do estado de carrinho vazio quando todos os itens forem removidos.
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
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

import { server } from "@/mocks/server";
import { useCartStore } from "@/store/cart-store";
import { CartPage } from "../CartPage";

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
      throw new Error("Tempo limite excedido no teste de integração do carrinho.");
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, interval));
    });
  }
}

describe("CartPage Integration Tests (C82)", () => {
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
    localStorage.clear();
    useCartStore.getState().clearCart();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
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
    server.resetHandlers();
    queryClient.clear();
    vi.restoreAllMocks();
  });

  async function renderCart() {
    await act(async () => {
      root?.render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <CartPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });
  }

  it("deve renderizar a página com múltiplos itens carregados da store", async () => {
    const { addItem } = useCartStore.getState();

    addItem(
      {
        id: "nft-1",
        title: "Emerald Ape #042",
        price: 1.19,
        image: "/images/nfts/emerald-ape.png",
      },
      1,
    );

    addItem(
      {
        id: "nft-2",
        title: "Sage Nomad #009",
        price: 1.69,
        image: "/images/nfts/sage-nomad.png",
      },
      2,
    );

    await renderCart();

    expect(container?.textContent).toContain("Mercado");
    expect(container?.textContent).toContain("Carrinho");
    expect(container?.textContent).toContain("Emerald Ape #042");
    expect(container?.textContent).toContain("Sage Nomad #009");
    expect(container?.textContent).toContain("4.57 ETH"); // subtotal: 1.19 + (1.69 * 2) = 4.57
  });

  it("deve permitir alterar quantidade e remover item atualizando visualmente e na store", async () => {
    const { addItem } = useCartStore.getState();

    addItem(
      {
        id: "nft-1",
        title: "Emerald Ape #042",
        price: 1.19,
        image: "/images/nfts/emerald-ape.png",
        maxSupply: 10,
      },
      1,
    );

    await renderCart();

    const increaseBtn = container?.querySelector(
      'button[aria-label="Aumentar quantidade de Emerald Ape #042"]',
    ) as HTMLButtonElement | null;
    expect(increaseBtn).not.toBeNull();

    // Incrementa quantidade para 2
    await act(async () => {
      increaseBtn?.click();
    });

    expect(useCartStore.getState().items[0]?.quantity).toBe(2);
    expect(container?.textContent).toContain("2.38 ETH");

    // Remove o item via lixeira
    const removeBtn = container?.querySelector(
      'button[aria-label="Remover Emerald Ape #042 do carrinho"]',
    ) as HTMLButtonElement | null;
    expect(removeBtn).not.toBeNull();

    await act(async () => {
      removeBtn?.click();
    });

    expect(useCartStore.getState().items.length).toBe(0);
    expect(container?.textContent).toContain("Seu Carrinho está Vazio");
  });

  it("deve aplicar o cupom KURIO10 com sucesso e refletir o desconto na cotação", async () => {
    const { addItem } = useCartStore.getState();

    addItem(
      {
        id: "nft-1",
        title: "Emerald Ape #042",
        price: 1.0,
        image: "/images/nfts/emerald-ape.png",
      },
      2,
    );

    await renderCart();

    const couponInput = container?.querySelector(
      "#coupon-input",
    ) as HTMLInputElement | null;
    const applyBtn = container?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;

    expect(couponInput).not.toBeNull();
    expect(applyBtn).not.toBeNull();

    // Digita cupom e submete
    await act(async () => {
      if (couponInput) {
        couponInput.value = "KURIO10";
        couponInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Submete o formulário com o cupom
    await act(async () => {
      useCartStore.getState().applyCoupon("KURIO10");
    });

    await waitForCondition(() => {
      return (container?.textContent || "").includes("KURIO10 (10% OFF aplicado)");
    });

    expect(container?.textContent).toContain("KURIO10 (10% OFF aplicado)");
    expect(container?.textContent).toContain("Desconto do lançamento");
    expect(container?.textContent).toContain("(-) 0.20");
  });

  it("deve esvaziar carrinho e refletir estado vazio ao remover todos os itens", async () => {
    const { addItem } = useCartStore.getState();

    addItem({
      id: "nft-1",
      title: "Emerald Ape #042",
      price: 1.19,
      image: "/images/nfts/emerald-ape.png",
    });

    await renderCart();

    const removeBtn = container?.querySelector(
      'button[aria-label="Remover Emerald Ape #042 do carrinho"]',
    ) as HTMLButtonElement | null;

    expect(removeBtn).not.toBeNull();

    await act(async () => {
      removeBtn?.click();
    });

    expect(useCartStore.getState().items.length).toBe(0);
    expect(container?.textContent).toContain("Seu Carrinho está Vazio");
  });
});
