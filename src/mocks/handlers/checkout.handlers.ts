/**
 * Handlers REST do MSW para o fluxo de checkout direto:
 * - Validação e reprodução por Idempotency-Key
 * - POST /api/checkout/orders
 * - GET /api/checkout/orders/:id com transição dinâmica PENDING -> CONFIRMED
 */
import { http, HttpResponse } from "msw";

import type {
  CheckoutOrderResponse,
  CreateOrderPayload,
} from "@/features/checkout/types";
import { scenarioEngine } from "@/mocks/scenarios";

// Armazenamento em memória de pedidos de checkout e histórico de idempotência
const checkoutOrdersDb = new Map<string, CheckoutOrderResponse>();
const idempotencyKeyMap = new Map<string, CheckoutOrderResponse>();
const pollCountMap = new Map<string, number>();

export function resetCheckoutDb() {
  checkoutOrdersDb.clear();
  idempotencyKeyMap.clear();
  pollCountMap.clear();
}

export const checkoutHandlers = [
  // 1. Criação idempotente de pedido de checkout
  http.post("*/api/checkout/orders", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    // Valida o cabeçalho Idempotency-Key
    const idempotencyKey =
      request.headers.get("Idempotency-Key") ||
      request.headers.get("idempotency-key") ||
      "";

    if (!idempotencyKey.trim()) {
      return HttpResponse.json(
        {
          code: "missing_idempotency_key",
          message:
            "O cabeçalho 'Idempotency-Key' é obrigatório para processar o checkout.",
        },
        { status: 400 },
      );
    }

    // Se já foi processada, retorna o pedido existente sem recriar
    const existingOrder = idempotencyKeyMap.get(idempotencyKey);
    if (existingOrder) {
      return HttpResponse.json<CheckoutOrderResponse>(existingOrder, {
        status: 200,
        headers: {
          "Idempotent-Replayed": "true",
        },
      });
    }

    let payload: Partial<CreateOrderPayload>;
    try {
      payload = (await request.json()) as Partial<CreateOrderPayload>;
    } catch {
      return HttpResponse.json(
        { code: "invalid_json", message: "Corpo da requisição JSON inválido." },
        { status: 400 },
      );
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    const newOrder: CheckoutOrderResponse = {
      orderId,
      status: "PENDING",
      idempotencyKey,
      createdAt,
      items: payload.items || [],
      totalEth: payload.totalEth || "0",
      paymentMethod: payload.paymentMethod || "crypto",
    };

    checkoutOrdersDb.set(orderId, newOrder);
    idempotencyKeyMap.set(idempotencyKey, newOrder);
    pollCountMap.set(orderId, 0);

    return HttpResponse.json<CheckoutOrderResponse>(newOrder, { status: 201 });
  }),

  // 2. Consulta de estado do pedido com simulação de confirmação na blockchain
  http.get("*/api/checkout/orders/:id", async ({ params, request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const orderId = String(params.id || "");
    const order = checkoutOrdersDb.get(orderId);

    if (!order) {
      return HttpResponse.json(
        {
          code: "order_not_found",
          message: `Pedido com ID '${orderId}' não foi localizado.`,
        },
        { status: 404 },
      );
    }

    // Simula transição de estado após 1 ou 2 consultas de polling
    const currentPolls = (pollCountMap.get(orderId) || 0) + 1;
    pollCountMap.set(orderId, currentPolls);

    if (currentPolls >= 1 && order.status === "PENDING") {
      order.status = "CONFIRMED";
      order.transactionHash = `0x${Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("")}`;
    }

    return HttpResponse.json<CheckoutOrderResponse>(order, { status: 200 });
  }),
];

export default checkoutHandlers;
