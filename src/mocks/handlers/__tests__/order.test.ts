/**
 * Testes de integração dos handlers REST de pedidos (Order) e checkout com MSW.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { Cart, Order, Quote } from "@/contracts/commerce";
import type { ApiErrorBody, IsoDate } from "@/contracts/common";
import { db, resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

const BASE_URL = "http://localhost/api";

describe("Order Handlers (src/mocks/handlers/order.handlers.ts)", () => {
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
    const cart = (await cartRes.json()) as Cart;
    expect(cart.lines).toHaveLength(0);
  });

  it("deve rejeitar com 409 quando a cotação estiver expirada", async () => {
    const authHeaders = {
      Authorization: "Bearer mock-token-user_demo",
      "Content-Type": "application/json",
    };

    // Cria cotação
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: "qualquer",
        walletId: "qualquer",
        network: "ethereum",
        collector: { name: "Anônimo", email: "anon@jungle.com" },
      }),
    });

    expect(orderRes.status).toBe(401);
  });

  it("deve listar pedidos do usuário e consultar pedido por ID", async () => {
    const authHeaders = {
      Authorization: "Bearer mock-token-user_demo",
      "Content-Type": "application/json",
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

    // 2. Listagem de pedidos
    const listRes = await fetch(`${BASE_URL}/orders`, {
      headers: authHeaders,
    });
    expect(listRes.status).toBe(200);
    const orders = (await listRes.json()) as Order[];
    expect(orders.some((o) => o.id === createdOrder.id)).toBe(true);

    // 3. Consulta de pedido por ID
    const getRes = await fetch(`${BASE_URL}/orders/${createdOrder.id}`);
    expect(getRes.status).toBe(200);
    const fetchedOrder = (await getRes.json()) as Order;
    expect(fetchedOrder.id).toBe(createdOrder.id);

    // 4. ID inexistente
    const notFoundRes = await fetch(`${BASE_URL}/orders/order-inexistente`);
    expect(notFoundRes.status).toBe(404);
    const notFoundError = (await notFoundRes.json()) as ApiErrorBody;
    expect(notFoundError.code).toBe("not_found");
  });
});
