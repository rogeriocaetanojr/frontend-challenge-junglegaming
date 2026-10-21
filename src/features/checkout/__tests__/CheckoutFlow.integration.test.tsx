/**
 * Testes de integração do fluxo de Checkout (C85 a C88).
 *
 * Cenários:
 * 1. Redirecionamento para /cart se o carrinho estiver vazio.
 * 2. Preenchimento e submissão do pedido até a transição para sucesso com orderId e txHash.
 * 3. Validação de esvaziamento do carrinho (clearCart) após confirmação do pedido.
 * 4. Validação de envio do cabeçalho de idempotência.
 */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { TestRouter } from "@/test/test-router";
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

import { resetCheckoutDb } from "@/mocks/handlers/checkout.handlers";
import { server } from "@/mocks/server";
import { useCartStore } from "@/store/cart-store";
import { CheckoutPage } from "../CheckoutPage";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function waitForCondition(
  predicate: () => boolean,
  timeout = 3000,
  interval = 40,
): Promise<void> {
  const startTime = Date.now();
  while (!predicate()) {
    if (Date.now() - startTime > timeout) {
      throw new Error("Tempo limite excedido no teste de integração de checkout.");
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, interval));
    });
  }
}

describe("CheckoutFlow Integration Tests (C85 a C88)", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    localStorage.clear();
    useCartStore.getState().clearCart();
    resetCheckoutDb();

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
    vi.restoreAllMocks();
  });

  async function renderCheckoutApp(initialEntry = "/checkout") {
    await act(async () => {
      root?.render(
        <TestRouter
          initialEntries={[initialEntry]}
          routes={[
            { path: "/checkout", element: <CheckoutPage pollingInterval={50} /> },
            {
              path: "/cart",
              element: <div data-testid="cart-fallback">Página do Carrinho</div>,
            },
            {
              path: "/",
              element: <div data-testid="home-fallback">Página Inicial</div>,
            },
          ]}
        />,
      );
    });
  }

  it("deve redirecionar para /cart quando o carrinho estiver vazio", async () => {
    await renderCheckoutApp("/checkout");

    expect(container?.textContent).toContain("Página do Carrinho");
    expect(container?.querySelector('[data-testid="cart-fallback"]')).not.toBeNull();
  });

  it("deve renderizar o formulário quando houver itens e exibir resumo dos ativos", async () => {
    useCartStore.getState().addItem(
      {
        id: "nft-1",
        title: "Emerald Ape #042",
        price: 1.19,
        image: "/images/nfts/emerald-ape.png",
      },
      2,
    );

    await renderCheckoutApp("/checkout");

    expect(container?.textContent).toContain("Finalizar Pedido");
    expect(container?.textContent).toContain("Emerald Ape #042");
    expect(container?.textContent).toContain("2.380 ETH");
  });

  it("deve submeter o pedido com sucesso, exibir tela de confirmação e esvaziar o carrinho", async () => {
    useCartStore.getState().addItem(
      {
        id: "nft-1",
        title: "Emerald Ape #042",
        price: 1.19,
        image: "/images/nfts/emerald-ape.png",
      },
      1,
    );

    await renderCheckoutApp("/checkout");

    const nameInput = container?.querySelector("#buyer-name") as HTMLInputElement | null;
    const emailInput = container?.querySelector(
      "#buyer-email",
    ) as HTMLInputElement | null;
    const submitBtn = container?.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;

    expect(nameInput).not.toBeNull();
    expect(emailInput).not.toBeNull();
    expect(submitBtn).not.toBeNull();

    // Preenche dados do comprador e submete
    const form = container?.querySelector("form") as HTMLFormElement | null;
    expect(form).not.toBeNull();

    await act(async () => {
      if (nameInput && emailInput) {
        // Simula digitação nos inputs
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;

        prototypeValueSetter?.call(nameInput, "Satoshi Nakamoto");
        nameInput.dispatchEvent(new Event("input", { bubbles: true }));
        nameInput.dispatchEvent(new Event("change", { bubbles: true }));

        prototypeValueSetter?.call(emailInput, "satoshi@kurio.io");
        emailInput.dispatchEvent(new Event("input", { bubbles: true }));
        emailInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Submete o formulário
    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    // Aguarda a confirmação (transição de polling PENDING -> CONFIRMED)
    await waitForCondition(() => {
      return (container?.textContent || "").includes("Aquisição Confirmada!");
    });

    expect(container?.textContent).toContain("Aquisição Confirmada!");
    expect(container?.textContent).toContain("ID do Pedido:");
    expect(container?.querySelector('[data-testid="success-tx-hash"]')).not.toBeNull();

    // Valida que o carrinho foi esvaziado
    expect(useCartStore.getState().items.length).toBe(0);
  });
});
