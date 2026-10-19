/**
 * Testes de integração dos handlers REST de cotação e cupons com MSW.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { Quote } from "@/contracts/commerce";
import type { ApiErrorBody } from "@/contracts/common";
import { resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

const BASE_URL = "http://localhost/api";

describe("Quote Handlers (src/mocks/handlers/quote.handlers.ts)", () => {
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

  it("deve calcular subtotal e total com exatidão decimal usando bigint", async () => {
    // 1. Cria carrinho com itens específicos
    const cartId = "cart_test_math";
    await fetch(`${BASE_URL}/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cart-id": cartId,
      },
      body: JSON.stringify({
        nftId: "nft-1", // Preço 1.19 ETH
        editionId: "nft-1-ed-1",
        quantity: 2, // Total esperado da linha: 2.38 ETH
      }),
    });

    // 2. Solicita a cotação sem cupom
    const quoteRes = await fetch(`${BASE_URL}/quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cart-id": cartId,
      },
      body: JSON.stringify({ cartId }),
    });

    expect(quoteRes.status).toBe(201);

    const quote = (await quoteRes.json()) as Quote;
    expect(quote.subtotal).toBe("2.38");
    expect(quote.discount).toBe("0");
    expect(quote.networkFee).toBe("0.002");
    expect(quote.total).toBe("2.382"); // 2.38 + 0.002
    expect(quote.lines).toHaveLength(1);
    expect(quote.lines[0]?.lineTotal).toBe("2.38");
  });

  it("deve aplicar cupom JUNGLE10 com 10% de desconto corretamente", async () => {
    const cartId = "cart_test_coupon";
    await fetch(`${BASE_URL}/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cart-id": cartId,
      },
      body: JSON.stringify({
        nftId: "nft-1", // 1.19 ETH
        editionId: "nft-1-ed-1",
        quantity: 2, // 2.38 ETH
      }),
    });

    const quoteRes = await fetch(`${BASE_URL}/quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cart-id": cartId,
      },
      body: JSON.stringify({
        cartId,
        couponCode: "JUNGLE10", // 1000 bps = 10%
      }),
    });

    expect(quoteRes.status).toBe(201);

    const quote = (await quoteRes.json()) as Quote;
    expect(quote.coupon?.status).toBe("applied");
    expect(quote.coupon?.code).toBe("JUNGLE10");
    expect(quote.subtotal).toBe("2.38");
    expect(quote.discount).toBe("0.238"); // 10% de 2.38
    expect(quote.networkFee).toBe("0.002");
    // total = (2.38 - 0.238) + 0.002 = 2.142 + 0.002 = 2.144
    expect(quote.total).toBe("2.144");
    expect(quote.issues).toHaveLength(0);
  });

  it("deve sinalizar issue para cupom inválido sem aplicar desconto", async () => {
    const cartId = "cart_test_invalid_coupon";
    await fetch(`${BASE_URL}/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cart-id": cartId,
      },
      body: JSON.stringify({
        nftId: "nft-1",
        editionId: "nft-1-ed-1",
        quantity: 1,
      }),
    });

    const quoteRes = await fetch(`${BASE_URL}/quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cart-id": cartId,
      },
      body: JSON.stringify({
        cartId,
        couponCode: "CODIGO_INEXISTENTE",
      }),
    });

    expect(quoteRes.status).toBe(201);

    const quote = (await quoteRes.json()) as Quote;
    expect(quote.coupon?.status).toBe("invalid");
    expect(quote.discount).toBe("0");
    expect(quote.issues.some((i) => i.type === "coupon_invalid")).toBe(true);
  });

  it("deve sinalizar issue para cupom inativo ou expirado (EXPIRED50)", async () => {
    const cartId = "cart_test_expired_coupon";
    await fetch(`${BASE_URL}/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cart-id": cartId,
      },
      body: JSON.stringify({
        nftId: "nft-1",
        editionId: "nft-1-ed-1",
        quantity: 1,
      }),
    });

    const quoteRes = await fetch(`${BASE_URL}/quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cart-id": cartId,
      },
      body: JSON.stringify({
        cartId,
        couponCode: "EXPIRED50",
      }),
    });

    expect(quoteRes.status).toBe(201);

    const quote = (await quoteRes.json()) as Quote;
    expect(quote.coupon?.status).toBe("expired");
    expect(quote.discount).toBe("0");
    expect(quote.issues.some((i) => i.type === "coupon_expired")).toBe(true);
  });

  it("deve rejeitar com status 400 se o carrinho estiver vazio", async () => {
    const quoteRes = await fetch(`${BASE_URL}/quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cart-id": "carrinho_totalmente_vazio",
      },
      body: JSON.stringify({ cartId: "carrinho_totalmente_vazio" }),
    });

    expect(quoteRes.status).toBe(400);

    const error = (await quoteRes.json()) as { code: string; message: string };
    expect(error.code).toBe("empty_cart");
  });

  it("deve consultar cotação existente por ID e retornar 404 para ID inexistente", async () => {
    // 1. Cria cotação a partir do carrinho demo
    const quoteRes = await fetch(`${BASE_URL}/quotes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer mock-token-user_demo",
      },
      body: JSON.stringify({ cartId: "cart_demo" }),
    });

    expect(quoteRes.status).toBe(201);
    const createdQuote = (await quoteRes.json()) as Quote;

    // 2. Busca por ID
    const getRes = await fetch(`${BASE_URL}/quotes/${createdQuote.quoteId}`);
    expect(getRes.status).toBe(200);

    const fetchedQuote = (await getRes.json()) as Quote;
    expect(fetchedQuote.quoteId).toBe(createdQuote.quoteId);
    expect(new Date(fetchedQuote.expiresAt).getTime()).toBeGreaterThan(Date.now());

    // 3. ID inexistente
    const notFoundRes = await fetch(`${BASE_URL}/quotes/quote-nao-existe`);
    expect(notFoundRes.status).toBe(404);

    const error = (await notFoundRes.json()) as ApiErrorBody;
    expect(error.code).toBe("not_found");
  });
});
