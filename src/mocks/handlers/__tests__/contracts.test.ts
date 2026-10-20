/**
 * Suíte Abrangente de Testes de Contrato de API com MSW v3 (msw/node) e Vitest.
 *
 * Valida estritamente contra o servidor configurado em `src/mocks/server.ts`:
 * 1. Catálogo & Paginação: filtros combinados, ordenação por ETH e facetas/páginas.
 * 2. Isolamento de Dados por Usuário: autenticação obrigatória e isolamento de recursos entre usuários.
 * 3. Carrinho & Merge Idempotente: fusão de carrinho guest para usuário logado sem duplicações em chamadas repetidas.
 * 4. Cotação com Precisão Decimal: cálculos exatos em Wei/ETH, cupom e taxa de rede.
 * 5. Idempotência de Pedidos: mesma chave + mesmo payload (200 com Idempotent-Replayed), mesma chave + payload alterado (409 idempotency_conflict).
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { NftListResponse } from "@/contracts/catalog";
import type { Cart, Order, Quote } from "@/contracts/commerce";
import type { ApiErrorBody, IsoDate } from "@/contracts/common";
import type { Session, User } from "@/contracts/identity";
import { asEthString, compareEth } from "@/lib/money";
import { db, resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

const BASE_URL = "http://localhost/api";
const USER_A_TOKEN = "mock-token-user_demo";
const USER_B_TOKEN = "mock-token-user_test_b";

describe("MSW Contract Integration Tests (src/mocks/server.ts)", () => {
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

  // Helper para criar o usuário B e registrar sua sessão em db.sessions
  function setupUserB(): { user: User; session: Session } {
    const user: User = {
      id: "user_test_b" as unknown as User["id"],
      name: "Bob Builder",
      email: "bob@jungle.com",
      createdAt: new Date().toISOString() as IsoDate,
    };

    db.users.set(user.id, {
      ...user,
      passwordHash: "Password123!",
    });

    const session: Session = {
      token: USER_B_TOKEN,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() as IsoDate,
      user,
    };
    db.sessions.set(session.token, session);

    return { user, session };
  }

  describe("1. Catálogo & Paginação (/api/nfts)", () => {
    it("deve filtrar por categoria, raridade e limites de preço em ETH", async () => {
      // Seeds possuem itens com várias categorias e raridades
      const query = new URLSearchParams({
        category: "gaming",
        rarity: "legendary",
        priceMin: "0.1",
        priceMax: "10.0",
        page: "1",
        pageSize: "10",
      });

      const res = await fetch(`${BASE_URL}/nfts?${query.toString()}`);
      expect(res.status).toBe(200);

      const data = (await res.json()) as NftListResponse;
      expect(data.items).toBeDefined();
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(10);
      expect(data.totalPages).toBeGreaterThanOrEqual(1);

      for (const nft of data.items) {
        expect(nft.category.toLowerCase()).toBe("gaming");
        expect(nft.rarity.toLowerCase()).toBe("legendary");
        expect(compareEth(nft.price, asEthString("0.1"))).toBeGreaterThanOrEqual(0);
        expect(compareEth(nft.price, asEthString("10.0"))).toBeLessThanOrEqual(0);
      }
    });

    it("deve ordenar os itens por preço em ETH (price_asc e price_desc)", async () => {
      // Teste de ordenação crescente (price_asc)
      const resAsc = await fetch(`${BASE_URL}/nfts?sort=price_asc&pageSize=12`);
      expect(resAsc.status).toBe(200);
      const dataAsc = (await resAsc.json()) as NftListResponse;
      expect(dataAsc.items.length).toBeGreaterThan(1);

      for (let i = 0; i < dataAsc.items.length - 1; i++) {
        const current = dataAsc.items[i];
        const next = dataAsc.items[i + 1];
        if (current && next) {
          expect(compareEth(current.price, next.price)).toBeLessThanOrEqual(0);
        }
      }

      // Teste de ordenação decrescente (price_desc)
      const resDesc = await fetch(`${BASE_URL}/nfts?sort=price_desc&pageSize=12`);
      expect(resDesc.status).toBe(200);
      const dataDesc = (await resDesc.json()) as NftListResponse;
      expect(dataDesc.items.length).toBeGreaterThan(1);

      for (let i = 0; i < dataDesc.items.length - 1; i++) {
        const current = dataDesc.items[i];
        const next = dataDesc.items[i + 1];
        if (current && next) {
          expect(compareEth(current.price, next.price)).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("deve retornar a estrutura completa de facetas e metadados de paginação", async () => {
      const res = await fetch(`${BASE_URL}/nfts?page=1&pageSize=4`);
      expect(res.status).toBe(200);

      const data = (await res.json()) as NftListResponse;
      expect(data.total).toBe(12);
      expect(data.totalPages).toBe(3);
      expect(data.items).toHaveLength(4);

      // Facetas agregadas
      expect(data.facets).toBeDefined();
      expect(data.facets.categories.length).toBeGreaterThan(0);
      expect(data.facets.rarities.length).toBeGreaterThan(0);
      expect(data.facets.networks.length).toBeGreaterThan(0);
      expect(data.facets.collections.length).toBeGreaterThan(0);
    });
  });

  describe("2. Isolamento de Dados por Usuário", () => {
    it("deve rejeitar com 401 unauthorized acessos sem token a carteiras e perfil", async () => {
      const walletsRes = await fetch(`${BASE_URL}/wallets`);
      expect(walletsRes.status).toBe(401);

      const profileRes = await fetch(`${BASE_URL}/profile`);
      expect(profileRes.status).toBe(401);
    });

    it("não deve permitir que o Usuário B acesse ou modifique carteiras do Usuário A (404/403)", async () => {
      setupUserB();

      // Carteira pertencente exclusivamente ao user_demo
      const walletDemoId = "wallet_demo_eth";

      // Usuário B tenta atualizar carteira do Usuário A
      const putRes = await fetch(`${BASE_URL}/wallets/${walletDemoId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${USER_B_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ label: "Hacked Label" }),
      });

      expect(putRes.status).toBe(404);
      const putError = (await putRes.json()) as ApiErrorBody;
      expect(putError.code).toBe("not_found");

      // Usuário B tenta conectar carteira do Usuário A
      const connectRes = await fetch(`${BASE_URL}/wallets/${walletDemoId}/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${USER_B_TOKEN}` },
      });

      expect(connectRes.status).toBe(404);
    });

    it("deve isolar estritamente o carrinho entre Usuário A e Usuário B", async () => {
      setupUserB();

      // Limpa o carrinho do Usuário A para isolamento determinístico
      await fetch(`${BASE_URL}/cart/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${USER_A_TOKEN}` },
      });

      // Usuário A adiciona item 1 ao seu carrinho
      await fetch(`${BASE_URL}/cart/items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_A_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 1,
        }),
      });

      // Usuário B adiciona item 2 ao seu carrinho
      await fetch(`${BASE_URL}/cart/items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_B_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nftId: "nft-2",
          editionId: "nft-2-ed-1",
          quantity: 2,
        }),
      });

      // Consulta carrinho do Usuário A
      const resCartA = await fetch(`${BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${USER_A_TOKEN}` },
      });
      const cartA = (await resCartA.json()) as Cart;
      expect(cartA.lines).toHaveLength(1);
      expect(cartA.lines[0]?.nftId).toBe("nft-1");

      // Consulta carrinho do Usuário B
      const resCartB = await fetch(`${BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${USER_B_TOKEN}` },
      });
      const cartB = (await resCartB.json()) as Cart;
      expect(cartB.lines).toHaveLength(1);
      expect(cartB.lines[0]?.nftId).toBe("nft-2");
    });
  });

  describe("3. Carrinho & Merge Idempotente (/api/cart/merge)", () => {
    it("deve mesclar carrinho anônimo para usuário logado e ser estritamente idempotente em chamadas repetidas", async () => {
      const guestCartId = "cart_guest_contracts_test";

      // Limpa carrinho do usuário A
      await fetch(`${BASE_URL}/cart/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${USER_A_TOKEN}` },
      });

      // 1. Usuário autenticado já possui 1 unidade no seu carrinho
      await fetch(`${BASE_URL}/cart/items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_A_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 1,
        }),
      });

      // 2. Visitante anônimo adiciona 2 unidades ao carrinho guest
      await fetch(`${BASE_URL}/cart/items`, {
        method: "POST",
        headers: {
          "x-cart-id": guestCartId,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 2,
        }),
      });

      // 3. Primeiro Merge: soma as quantidades (1 + 2 = 3)
      const mergeRes1 = await fetch(`${BASE_URL}/cart/merge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_A_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ guestCartId }),
      });

      expect(mergeRes1.status).toBe(200);
      const mergedCart1 = (await mergeRes1.json()) as Cart;
      const line1 = mergedCart1.lines.find((l) => l.nftId === "nft-1");
      expect(line1?.quantity).toBe(3);

      // 4. Segundo Merge (repetido com mesmo guestCartId): NÃO deve duplicar a quantidade
      const mergeRes2 = await fetch(`${BASE_URL}/cart/merge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_A_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ guestCartId }),
      });

      expect(mergeRes2.status).toBe(200);
      const mergedCart2 = (await mergeRes2.json()) as Cart;
      const line2 = mergedCart2.lines.find((l) => l.nftId === "nft-1");
      expect(line2?.quantity).toBe(3); // Mantém 3, sem duplicações
    });
  });

  describe("4. Cotação com Precisão Decimal (/api/quotes)", () => {
    it("deve calcular a cotação preservando precisão absoluta em Wei/ETH com cupom e taxa de rede", async () => {
      // Prepara carrinho do usuário demo com 1 item (nft-1 a 1.19 ETH)
      await fetch(`${BASE_URL}/cart/clear`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${USER_A_TOKEN}` },
      });

      await fetch(`${BASE_URL}/cart/items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_A_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nftId: "nft-1",
          editionId: "nft-1-ed-1",
          quantity: 1, // Preço da seed: 1.19 ETH
        }),
      });

      // Emite cotação aplicando cupom JUNGLE10 (10% de desconto)
      const res = await fetch(`${BASE_URL}/quotes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_A_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponCode: "JUNGLE10",
        }),
      });

      expect(res.status).toBe(201);
      const quote = (await res.json()) as Quote;

      // Validações de precisão e campos
      expect(quote.quoteId).toBeDefined();
      expect(quote.subtotal).toBe("1.19");
      // Desconto de 10% sobre 1.19 ETH = 0.119 ETH
      expect(quote.discount).toBe("0.119");
      expect(quote.coupon?.code).toBe("JUNGLE10");
      expect(quote.coupon?.status).toBe("applied");

      // Taxa de rede Ethereum = 0.002 ETH
      expect(quote.networkFee).toBe("0.002");

      // Total = 1.19 - 0.119 + 0.002 = 1.073 ETH
      expect(quote.total).toBe("1.073");
    });
  });

  describe("5. Idempotência de Pedidos (/api/orders)", () => {
    it("deve reproduzir o mesmo pedido com header Idempotent-Replayed para requisição idêntica", async () => {
      const idempotencyKey = "contracts-idempotency-key-001";

      // 1. Cria cotação prévia para o pedido
      const quoteRes = await fetch(`${BASE_URL}/quotes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_A_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      expect(quoteRes.status).toBe(201);
      const quote = (await quoteRes.json()) as Quote;

      const orderPayload = {
        quoteId: quote.quoteId,
        walletId: "wallet_demo_eth",
        network: "ethereum",
        collector: {
          name: "Alex Jungle",
          email: "demo@jungle.com",
        },
      };

      // 2. Primeira chamada: cria o pedido com sucesso (201)
      const firstRes = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_A_TOKEN}`,
          "Idempotency-Key": idempotencyKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      expect(firstRes.status).toBe(201);
      expect(firstRes.headers.get("Idempotent-Replayed")).toBeNull();
      const firstOrder = (await firstRes.json()) as Order;
      expect(firstOrder.id).toBeDefined();

      // 3. Segunda chamada (mesma chave e mesmo payload): reproduz a resposta com header Idempotent-Replayed
      const secondRes = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_A_TOKEN}`,
          "Idempotency-Key": idempotencyKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      expect(secondRes.status).toBe(200);
      expect(secondRes.headers.get("Idempotent-Replayed")).toBe("true");
      const secondOrder = (await secondRes.json()) as Order;
      expect(secondOrder.id).toBe(firstOrder.id);
    });

    it("deve retornar 409 idempotency_conflict quando a mesma chave for enviada com payload alterado", async () => {
      const idempotencyKey = "contracts-conflict-key-002";

      // 1. Cria cotação prévia para o pedido
      const quoteRes = await fetch(`${BASE_URL}/quotes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_A_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      expect(quoteRes.status).toBe(201);
      const quote = (await quoteRes.json()) as Quote;

      const originalPayload = {
        quoteId: quote.quoteId,
        walletId: "wallet_demo_eth",
        network: "ethereum",
        collector: {
          name: "Alex Jungle",
          email: "demo@jungle.com",
        },
      };

      // 2. Primeira chamada com payload original
      const firstRes = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_A_TOKEN}`,
          "Idempotency-Key": idempotencyKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(originalPayload),
      });

      expect(firstRes.status).toBe(201);

      // 3. Segunda chamada com a mesma chave, mas alterando o walletId
      const conflictingPayload = {
        ...originalPayload,
        walletId: "wallet_demo_poly",
      };

      const conflictRes = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${USER_A_TOKEN}`,
          "Idempotency-Key": idempotencyKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(conflictingPayload),
      });

      expect(conflictRes.status).toBe(409);
      const error = (await conflictRes.json()) as ApiErrorBody;
      expect(error.code).toBe("idempotency_conflict");
      expect(error.message).toContain(
        "já foi utilizada para uma requisição com payload diferente",
      );
    });
  });
});
