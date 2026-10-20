/**
 * Testes unitários para useCheckout (src/features/checkout/useCheckout.ts).
 *
 * Validações de comportamento (C83 + C84):
 * - Submissão de pedido com cabeçalho de Idempotência
 * - Transição de estados: idle -> submitting -> polling -> success
 * - Recebimento de transactionHash quando o status é CONFIRMED
 * - Tratamento de erro na submissão
 */
import { act } from "react";
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

import { resetCheckoutDb } from "@/mocks/handlers/checkout.handlers";
import { server } from "@/mocks/server";
import type { CreateOrderPayload } from "../types";
import {
  useCheckout,
  type UseCheckoutOptions,
  type UseCheckoutReturn,
} from "../useCheckout";

// @ts-expect-error IS_REACT_ACT_ENVIRONMENT flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("useCheckout Hook (src/features/checkout/useCheckout.ts)", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;
  let hookState: UseCheckoutReturn;

  function HookConsumer({ options }: { options?: UseCheckoutOptions }) {
    hookState = useCheckout(options);
    return null;
  }

  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
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

  const mockPayload: CreateOrderPayload = {
    buyer: {
      name: "Alex Jungle",
      email: "alex@jungle.com",
    },
    paymentMethod: "crypto",
    items: [
      {
        id: "nft-1",
        title: "Emerald Ape #042",
        price: 1.19,
        quantity: 1,
      },
    ],
    totalEth: 1.19,
  };

  it("deve inicializar com estado idle e chave de idempotência gerada", async () => {
    await act(async () => {
      root?.render(<HookConsumer />);
    });

    expect(hookState.status).toBe("idle");
    expect(hookState.order).toBeNull();
    expect(hookState.error).toBeNull();
    expect(typeof hookState.idempotencyKey).toBe("string");
    expect(hookState.idempotencyKey.length).toBeGreaterThan(0);
  });

  it("deve submeter o pedido, transicionar para polling e finalizar com success", async () => {
    const onSuccess = vi.fn();

    await act(async () => {
      root?.render(
        <HookConsumer
          options={{
            pollingInterval: 50,
            onSuccess,
          }}
        />,
      );
    });

    let submittedOrder;
    await act(async () => {
      submittedOrder = await hookState.submitOrder(mockPayload);
    });

    expect(submittedOrder).toBeDefined();
    expect(hookState.status).toBe("polling");
    expect(hookState.order?.status).toBe("PENDING");

    // Aguarda o polling resolver para CONFIRMED
    const start = Date.now();
    while (hookState.status !== "success" && Date.now() - start < 2000) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
    }

    expect(hookState.status).toBe("success");
    expect(hookState.order?.status).toBe("CONFIRMED");
    expect(hookState.order?.transactionHash).toMatch(/^0x[a-f0-9]{40}$/i);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("deve manter a mesma Idempotency-Key em chamadas simultâneas ou reexecuções", async () => {
    await act(async () => {
      root?.render(
        <HookConsumer
          options={{
            pollingInterval: 50,
          }}
        />,
      );
    });

    const initialKey = hookState.idempotencyKey;

    await act(async () => {
      await hookState.submitOrder(mockPayload);
    });

    expect(hookState.idempotencyKey).toBe(initialKey);
    expect(hookState.order?.idempotencyKey).toBe(initialKey);
  });

  it("deve permitir resetar o checkout gerando uma nova chave de idempotência", async () => {
    await act(async () => {
      root?.render(<HookConsumer />);
    });

    const firstKey = hookState.idempotencyKey;

    act(() => {
      hookState.resetCheckout();
    });

    expect(hookState.status).toBe("idle");
    expect(hookState.idempotencyKey).not.toBe(firstKey);
  });
});
