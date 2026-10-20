/**
 * Testes de integração dos handlers REST de pedidos (Order), checkout com MSW e idempotência.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { Order, Quote } from "@/contracts/commerce";
import type { ApiErrorBody, IsoDate } from "@/contracts/common";
import { db, resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

const BASE_URL = "http://localhost/api";

describe("Order Handlers (src/mocks/handlers/orders.ts)", () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    resetDb();
    scenarioEngine.reset();
  });

  afterAll(() => {
    server.close();
  });

  it("deve criar um pedido com sucesso, emitir recibo imutável e deduzir estoque", async () => {
    const authHeaders = {
      Authorization: "Bearer mock-token-user_demo",
      "Content-Type": "application/json",
      "Idempotency-Key": "idemp_create_order_happy",
    };

    // 1. Estoque inicial
    const nftBefore = db.nfts.get("nft-1");
    const initialStock = nftBefore?.editions[0]?.available ?? 0;
    expect(initialStock).toBe(38);

    // 2. Carrinho demo já possui 1 item de nft-1-ed-1 nas seeds. Adiciona mais 1 item (total = 2).
    await fetch(`${BASE_URL}/cart/items`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        nftId: "nft-1",
        editionId: "nft-1-ed-1",
        quantity: 1,
      }),
    });

    // 3. Emite cotação
    const quoteRes = await fetch(`${BASE_URL}/quotes`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ cartId: "cart_demo" }),
    });
    expect(quoteRes.status).toBe(201);
    const quote = (await quoteRes.json()) as Quote;

    // 4. Finaliza a compra criando o pedido
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        quoteId: quote.quoteId,
        walletId: "wallet_demo_eth",
        network: "ethereum",
        collector: {
          name: "Alex Jungle",
          email: "demo@jungle.com",
        },
      }),
    });

    expect(orderRes.status).toBe(201);
    const order = (await orderRes.json()) as Order;

    // Validações do Pedido e Recibo
    expect(order.id).toBeDefined();
    expect(order.userId).toBe("user_demo");
    expect(order.status).toBe("confirmed");
    expect(order.snapshot.total).toBe(quote.total);
    expect(order.snapshot.walletAddress).toBe(
      "0x71C8364437a9C27779976872A42F340a6B233921",
    );
    expect(order.snapshot.txRef.startsWith("0x")).toBe(true);
    expect(order.snapshot.explorerUrl).toContain("etherscan.io/tx/");
    expect(order.snapshot.collector.name).toBe("Alex Jungle");

    // 5. Validação de dedução atômica de estoque (38 - 2 = 36)
    const nftAfter = db.nfts.get("nft-1");
    expect(nftAfter?.editions[0]?.available).toBe(36);

    // 6. Validação de limpeza automática do carrinho após a compra
    const cartRes = await fetch(`${BASE_URL}/cart`, {
      headers: authHeaders,
    });
    const userCart = (await cartRes.json()) as { lines: unknown[] };
    expect(userCart.lines.length).toBe(0);
  });

  describe("Idempotência em POST /api/orders", () => {
    it("deve rejeitar com 400 Bad Request se o cabeçalho Idempotency-Key estiver ausente", async () => {
      const authHeadersWithoutIdempotency = {
        Authorization: "Bearer mock-token-user_demo",
        "Content-Type": "application/json",
      };

      const quoteRes = await fetch(`${BASE_URL}/quotes`, {
        method: "POST",
        headers: authHeadersWithoutIdempotency,
        body: JSON.stringify({ cartId: "cart_demo" }),
      });
      const quote = (await quoteRes.json()) as Quote;

      const orderRes = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: authHeadersWithoutIdempotency,
        body: JSON.stringify({
          quoteId: quote.quoteId,
          walletId: "wallet_demo_eth",
          network: "ethereum",
          collector: { name: "Alex Jungle", email: "demo@jungle.com" },
        }),
      });

      expect(orderRes.status).toBe(400);
      const error = (await orderRes.json()) as ApiErrorBody;
      expect(error.code).toBe("validation_error");
      expect(error.message).toContain("Idempotency-Key");
    });

    it("deve retornar o pedido existente com cabeçalho Idempotent-Replayed: true em reenvio com mesmo payload", async () => {
      const headers = {
        Authorization: "Bearer mock-token-user_demo",
        "Content-Type": "application/json",
        "Idempotency-Key": "unique_idempotency_key_42",
      };

      const quoteRes = await fetch(`${BASE_URL}/quotes`, {
        method: "POST",
        headers,
        body: JSON.stringify({ cartId: "cart_demo" }),
      });
      const quote = (await quoteRes.json()) as Quote;

      const payload = {
        quoteId: quote.quoteId,
        walletId: "wallet_demo_eth",
        network: "ethereum",
        collector: { name: "Alex Jungle", email: "demo@jungle.com" },
      };

      // 1ª Requisição
      const res1 = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      expect(res1.status).toBe(201);
      const order1 = (await res1.json()) as Order;

      // 2ª Requisição (idêntica, mesma chave e mesmo payload)
      const res2 = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      expect(res2.status).toBe(200);
      expect(res2.headers.get("Idempotent-Replayed")).toBe("true");
      const order2 = (await res2.json()) as Order;
      expect(order2.id).toBe(order1.id);
      expect(order2.snapshot.txRef).toBe(order1.snapshot.txRef);
    });

    it("deve rejeitar com 409 idempotency_conflict quando a mesma chave for enviada com payload diferente", async () => {
      const headers = {
        Authorization: "Bearer mock-token-user_demo",
        "Content-Type": "application/json",
        "Idempotency-Key": "reused_key_conflict_test",
      };

      const quoteRes = await fetch(`${BASE_URL}/quotes`, {
        method: "POST",
        headers,
        body: JSON.stringify({ cartId: "cart_demo" }),
      });
      const quote = (await quoteRes.json()) as Quote;

      // 1ª Requisição com carteira A
      const res1 = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          quoteId: quote.quoteId,
          walletId: "wallet_demo_eth",
          network: "ethereum",
          collector: { name: "Alex Jungle", email: "demo@jungle.com" },
        }),
      });
      expect(res1.status).toBe(201);

      // 2ª Requisição com a MESMA chave, mas alterando o e-mail do collector (payload divergente)
      const res2 = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          quoteId: quote.quoteId,
          walletId: "wallet_demo_eth",
          network: "ethereum",
          collector: { name: "Alex Jungle", email: "outro_email@jungle.com" },
        }),
      });

      expect(res2.status).toBe(409);
      const conflictError = (await res2.json()) as ApiErrorBody;
      expect(conflictError.code).toBe("idempotency_conflict");
      expect(conflictError.message).toContain("idempotência");
    });
  });

  it("deve rejeitar com 409 quando a cotação estiver expirada", async () => {
    const authHeaders = {
      Authorization: "Bearer mock-token-user_demo",
      "Content-Type": "application/json",
      "Idempotency-Key": "idemp_expired_quote",
    };

    const quoteRes = await fetch(`${BASE_URL}/quotes`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ cartId: "cart_demo" }),
    });
    const quote = (await quoteRes.json()) as Quote;

    // Força expiração no banco em memória
    const storedQuote = db.quotes.get(quote.quoteId);
    if (storedQuote) {
      storedQuote.expiresAt = new Date(Date.now() - 5000).toISOString() as IsoDate;
    }

    // Tenta finalizar compra
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        quoteId: quote.quoteId,
        walletId: "wallet_demo_eth",
        network: "ethereum",
        collector: { name: "Alex Jungle", email: "demo@jungle.com" },
      }),
    });

    expect(orderRes.status).toBe(409);
    const error = (await orderRes.json()) as { code: string; message: string };
    expect(error.code).toBe("quote_expired");
  });

  it("deve rejeitar com 400 quando a carteira informada for inexistente", async () => {
    const authHeaders = {
      Authorization: "Bearer mock-token-user_demo",
      "Content-Type": "application/json",
      "Idempotency-Key": "idemp_invalid_wallet",
    };

    const quoteRes = await fetch(`${BASE_URL}/quotes`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ cartId: "cart_demo" }),
    });
    const quote = (await quoteRes.json()) as Quote;

    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        quoteId: quote.quoteId,
        walletId: "carteira_fantasma_999",
        network: "ethereum",
        collector: { name: "Alex Jungle", email: "demo@jungle.com" },
      }),
    });

    expect(orderRes.status).toBe(400);
    const error = (await orderRes.json()) as { code: string; message: string };
    expect(error.code).toBe("invalid_wallet");
  });

  it("deve rejeitar com 401 unauthorized quando tentar criar pedido sem autenticação", async () => {
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "idemp_unauth",
      },
      body: JSON.stringify({
        quoteId: "qualquer",
        walletId: "qualquer",
        network: "ethereum",
        collector: { name: "Anônimo", email: "anon@jungle.com" },
      }),
    });

    expect(orderRes.status).toBe(401);
  });

  it("deve listar pedidos do usuário com suporte a filtro por status e detalhe por ID", async () => {
    const authHeaders = {
      Authorization: "Bearer mock-token-user_demo",
      "Content-Type": "application/json",
      "Idempotency-Key": "idemp_list_orders_test",
    };

    // 1. Gera cotação e pedido
    const quoteRes = await fetch(`${BASE_URL}/quotes`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ cartId: "cart_demo" }),
    });
    const quote = (await quoteRes.json()) as Quote;

    const createRes = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        quoteId: quote.quoteId,
        walletId: "wallet_demo_eth",
        network: "ethereum",
        collector: { name: "Alex Jungle", email: "demo@jungle.com" },
      }),
    });
    const createdOrder = (await createRes.json()) as Order;

    // 2. Listagem de todos os pedidos do usuário
    const listRes = await fetch(`${BASE_URL}/orders`, {
      headers: authHeaders,
    });
    expect(listRes.status).toBe(200);
    const orders = (await listRes.json()) as Order[];
    expect(orders.some((o) => o.id === createdOrder.id)).toBe(true);

    // 3. Listagem com filtro ?status=confirmed
    const confirmedRes = await fetch(`${BASE_URL}/orders?status=confirmed`, {
      headers: authHeaders,
    });
    expect(confirmedRes.status).toBe(200);
    const confirmedOrders = (await confirmedRes.json()) as Order[];
    expect(confirmedOrders.every((o) => o.status === "confirmed")).toBe(true);

    // 4. Listagem com filtro ?status=pending
    const pendingRes = await fetch(`${BASE_URL}/orders?status=pending`, {
      headers: authHeaders,
    });
    expect(pendingRes.status).toBe(200);
    const pendingOrders = (await pendingRes.json()) as Order[];
    expect(pendingOrders.every((o) => o.status === "pending")).toBe(true);

    // 5. Consulta de pedido por ID
    const getRes = await fetch(`${BASE_URL}/orders/${createdOrder.id}`);
    expect(getRes.status).toBe(200);
    const fetchedOrder = (await getRes.json()) as Order;
    expect(fetchedOrder.id).toBe(createdOrder.id);

    // 6. ID inexistente
    const notFoundRes = await fetch(`${BASE_URL}/orders/order-inexistente`);
    expect(notFoundRes.status).toBe(404);
    const notFoundError = (await notFoundRes.json()) as ApiErrorBody;
    expect(notFoundError.code).toBe("not_found");
  });
});
