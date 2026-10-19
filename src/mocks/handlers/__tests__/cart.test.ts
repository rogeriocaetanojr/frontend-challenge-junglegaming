/**
 * Testes de integração dos handlers REST de carrinho com MSW.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { Cart } from "@/contracts/commerce";
import type { ApiErrorBody } from "@/contracts/common";
import { resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

const BASE_URL = "http://localhost/api/cart";

describe("Cart Handlers (src/mocks/handlers/cart.handlers.ts)", () => {
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

  describe("GET /api/cart", () => {
    it("deve inicializar carrinho vazio para visitante anônimo (guest)", async () => {
      const res = await fetch(BASE_URL, {
        headers: { "x-cart-id": "guest_session_123" },
      });

      expect(res.status).toBe(200);

      const cart = (await res.json()) as Cart;
      expect(cart.id).toBe("guest_session_123");
      expect(cart.owner.kind).toBe("guest");
      expect(cart.lines).toHaveLength(0);
      expect(cart.version).toBe(1);
    });

    it("deve carregar o carrinho vinculado ao usuário autenticado", async () => {
      const res = await fetch(BASE_URL, {
        headers: { Authorization: "Bearer mock-token-user_demo" },
      });

      expect(res.status).toBe(200);

      const cart = (await res.json()) as Cart;
      expect(cart.owner.kind).toBe("user");
      expect(cart.owner.id).toBe("user_demo");
      expect(cart.lines.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("POST /api/cart/items", () => {
    it("deve adicionar item ao carrinho e incrementar a versão", async () => {
      const initialRes = await fetch(BASE_URL, {
        headers: { "x-cart-id": "guest_cart_add" },
      });
      const initialCart = (await initialRes.json()) as Cart;
      const initialVersion = initialCart.version;

      const addRes = await fetch(`${BASE_URL}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cart-id": "guest_cart_add",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 2,
        }),
      });

      expect(addRes.status).toBe(200);

      const updatedCart = (await addRes.json()) as Cart;
      expect(updatedCart.version).toBe(initialVersion + 1);
      expect(updatedCart.lines).toHaveLength(1);
      expect(updatedCart.lines[0]?.quantity).toBe(2);
      expect(updatedCart.lines[0]?.nftId).toBe("nft-1");
      expect(updatedCart.lines[0]?.editionId).toBe("nft-1-ed-1");
    });

    it("deve rejeitar com 409 conflict_availability quando a quantidade exceder o estoque", async () => {
      const res = await fetch(`${BASE_URL}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cart-id": "guest_cart_stock",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 9999, // Estoque da seed é 38
        }),
      });

      expect(res.status).toBe(409);

      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("conflict_availability");
      expect(error.message).toContain("excede o estoque disponível");
    });

    it("deve retornar 404 quando o NFT ou a edição não existirem", async () => {
      const res = await fetch(`${BASE_URL}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cart-id": "guest_cart_404",
        },
        body: JSON.stringify({
          nftId: "nft-inexistente",
          editionId: "ed-inexistente",
          quantity: 1,
        }),
      });

      expect(res.status).toBe(404);

      const error = (await res.json()) as ApiErrorBody;
      expect(error.code).toBe("not_found");
    });
  });

  describe("PATCH /api/cart/items", () => {
    it("deve atualizar a quantidade de um item existente", async () => {
      // 1. Adiciona item inicial
      await fetch(`${BASE_URL}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cart-id": "guest_cart_patch",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 2,
        }),
      });

      // 2. Altera a quantidade para 5
      const patchRes = await fetch(`${BASE_URL}/items`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-cart-id": "guest_cart_patch",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 5,
        }),
      });

      expect(patchRes.status).toBe(200);

      const cart = (await patchRes.json()) as Cart;
      expect(cart.lines[0]?.quantity).toBe(5);
    });

    it("deve remover a linha se a quantidade for atualizada para 0", async () => {
      // 1. Adiciona item inicial
      await fetch(`${BASE_URL}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cart-id": "guest_cart_zero",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 1,
        }),
      });

      // 2. Atualiza com quantity 0
      const patchRes = await fetch(`${BASE_URL}/items`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-cart-id": "guest_cart_zero",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 0,
        }),
      });

      expect(patchRes.status).toBe(200);

      const cart = (await patchRes.json()) as Cart;
      expect(cart.lines).toHaveLength(0);
    });
  });

  describe("DELETE /api/cart/items e DELETE /api/cart/clear", () => {
    it("deve remover item específico do carrinho", async () => {
      // 1. Popula 2 itens
      await fetch(`${BASE_URL}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cart-id": "guest_cart_del",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 1,
        }),
      });
      await fetch(`${BASE_URL}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cart-id": "guest_cart_del",
        },
        body: JSON.stringify({
          nftId: "nft-2",
          editionId: "nft-2-ed-1",
          quantity: 1,
        }),
      });

      // 2. Remove nft-1
      const delRes = await fetch(`${BASE_URL}/items?nftId=nft-1&editionId=nft-1-ed-1`, {
        method: "DELETE",
        headers: { "x-cart-id": "guest_cart_del" },
      });

      expect(delRes.status).toBe(200);

      const cart = (await delRes.json()) as Cart;
      expect(cart.lines).toHaveLength(1);
      expect(cart.lines[0]?.nftId).toBe("nft-2");
    });

    it("deve limpar completamente o carrinho e incrementar a versão", async () => {
      // 1. Popula item
      await fetch(`${BASE_URL}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cart-id": "guest_cart_clear",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 3,
        }),
      });

      // 2. Limpa
      const clearRes = await fetch(`${BASE_URL}/clear`, {
        method: "DELETE",
        headers: { "x-cart-id": "guest_cart_clear" },
      });

      expect(clearRes.status).toBe(200);

      const cart = (await clearRes.json()) as Cart;
      expect(cart.lines).toHaveLength(0);
      expect(cart.version).toBeGreaterThan(1);
    });
  });
});
