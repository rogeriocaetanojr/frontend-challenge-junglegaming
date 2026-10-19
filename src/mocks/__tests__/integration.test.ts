/**
 * Suíte de testes de integração ponta a ponta dos handlers REST e cenários de falha (MSW v3).
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { NftListResponse } from "@/contracts/catalog";
import type { Cart, Order, Quote } from "@/contracts/commerce";
import type { ApiErrorBody } from "@/contracts/common";
import type { Session } from "@/contracts/identity";
import { db, resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

const BASE_URL = "http://localhost/api";

describe("MSW End-to-End Integration Tests (src/mocks/__tests__/integration.test.ts)", () => {
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

  describe("Fluxo Feliz Completo de Comércio", () => {
    it("deve executar o ciclo completo: catálogo -> login -> carrinho -> cotação com cupom -> checkout com recibo e dedução de estoque", async () => {
      // 1. Consulta catálogo de NFTs via GET /api/nfts
      const catalogRes = await fetch(`${BASE_URL}/nfts`);
      expect(catalogRes.status).toBe(200);
      const catalogData = (await catalogRes.json()) as NftListResponse;
      expect(catalogData.items.length).toBeGreaterThan(0);

      const targetNft = catalogData.items[0]!;
      const targetEdition = targetNft.editions[0]!;
      const initialStock = targetEdition.available;
      expect(initialStock).toBeGreaterThan(0);

      // 2. Realiza login do usuário demo via POST /api/auth/login
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@jungle.com",
          password: "Password123!",
        }),
      });
      expect(loginRes.status).toBe(200);
      const session = (await loginRes.json()) as Session;
      expect(session.token).toBeDefined();

      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      };

      // 3. Adiciona item do NFT consultado ao carrinho via POST /api/cart/items
      const addToCartRes = await fetch(`${BASE_URL}/cart/items`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          nftId: targetNft.id,
          editionId: targetEdition.id,
          quantity: 1,
        }),
      });
      expect(addToCartRes.status).toBe(200);
      const cart = (await addToCartRes.json()) as Cart;
      expect(cart.lines.some((line) => line.nftId === targetNft.id)).toBe(true);

      // 4. Gera cotação com cupom 'JUNGLE10' via POST /api/quotes
      const quoteRes = await fetch(`${BASE_URL}/quotes`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          cartId: cart.id,
          couponCode: "JUNGLE10",
        }),
      });
      expect(quoteRes.status).toBe(201);
      const quote = (await quoteRes.json()) as Quote;
      expect(quote.coupon?.code).toBe("JUNGLE10");
      expect(quote.coupon?.status).toBe("applied");
      expect(parseFloat(quote.discount)).toBeGreaterThan(0);

      // 5. Finaliza pedido via POST /api/orders
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

      // 6. Validações do pedido, recibo imutável (snapshot) e dedução de estoque
      expect(order.status).toBe("confirmed");
      expect(order.snapshot).toBeDefined();
      expect(order.snapshot.txRef).toMatch(/^0x[a-f0-9]{64}$/);
      expect(order.snapshot.explorerUrl).toContain(order.snapshot.txRef);
      expect(order.snapshot.walletAddress).toBeDefined();
      expect(order.snapshot.lines.length).toBeGreaterThan(0);

      // Valida dedução em db.nfts
      const purchasedQuantity =
        quote.lines.find((l) => l.editionId === targetEdition.id)?.quantity ?? 1;
      const nftAfter = db.nfts.get(targetNft.id);
      const editionAfter = nftAfter?.editions.find((e) => e.id === targetEdition.id);
      expect(editionAfter?.available).toBe(initialStock - purchasedQuantity);
    });
  });

  describe("Validação do Cenário 'checkout_conflict'", () => {
    it("deve rejeitar POST /api/orders com status 409 e código conflict_price_changed", async () => {
      scenarioEngine.setScenario("checkout_conflict");

      const res = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token-user_demo",
        },
        body: JSON.stringify({
          quoteId: "quote_demo_active",
          walletId: "wallet_demo_eth",
          network: "ethereum",
          collector: {
            name: "Alex Jungle",
            email: "demo@jungle.com",
          },
        }),
      });

      expect(res.status).toBe(409);
      const body = (await res.json()) as ApiErrorBody;
      expect(body.code).toBe("conflict_price_changed");
      expect(body.message).toContain("alterado");
    });
  });

  describe("Validação do Cenário 'auth_expired'", () => {
    it("deve rejeitar GET /api/auth/me com status 401 e código session_expired", async () => {
      scenarioEngine.setScenario("auth_expired");

      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: "Bearer mock-token-user_demo",
        },
      });

      expect(res.status).toBe(401);
      const body = (await res.json()) as ApiErrorBody;
      expect(body.code).toBe("session_expired");
      expect(body.message).toContain("expirou");
    });
  });

  describe("Validação de Estoque Concorrente", () => {
    it("deve rejeitar POST /api/cart/items com status 409 e código conflict_availability quando exceder estoque", async () => {
      const res = await fetch(`${BASE_URL}/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token-user_demo",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 99999, // Quantidade que excede a disponibilidade
        }),
      });

      expect(res.status).toBe(409);
      const body = (await res.json()) as ApiErrorBody;
      expect(body.code).toBe("conflict_availability");
      expect(body.message).toContain("estoque");
    });
  });
});
