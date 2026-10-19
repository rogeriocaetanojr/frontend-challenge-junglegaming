/**
 * Testes de integração dos handlers REST do catálogo de NFTs com MSW.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import type { Nft, NftListResponse } from "@/contracts/catalog";
import { type ApiErrorBody, asEthString } from "@/contracts/common";
import { compareEth } from "@/lib/money";
import { resetDb } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

const BASE_URL = "http://localhost/api/nfts";

describe("Catalog Handlers (src/mocks/handlers/catalog.handlers.ts)", () => {
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

  it("deve retornar listagem inicial paginada com 8 itens de 12 e facetas agregadas", async () => {
    const res = await fetch(BASE_URL);
    expect(res.status).toBe(200);

    const data = (await res.json()) as NftListResponse;
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(8);
    expect(data.total).toBe(12);
    expect(data.totalPages).toBe(2);
    expect(data.items).toHaveLength(8);

    // Facetas
    expect(data.facets.categories.length).toBeGreaterThan(0);
    expect(data.facets.collections.length).toBeGreaterThan(0);
    expect(data.facets.networks.length).toBeGreaterThan(0);
    expect(data.facets.rarities.length).toBeGreaterThan(0);
  });

  it("deve filtrar por busca textual (q) de forma case-insensitive", async () => {
    const res = await fetch(`${BASE_URL}?q=emerald`);
    const data = (await res.json()) as NftListResponse;

    expect(data.total).toBe(2);
    expect(
      data.items.every(
        (nft) =>
          nft.title.toLowerCase().includes("emerald") ||
          nft.description.toLowerCase().includes("emerald"),
      ),
    ).toBe(true);
  });

  it("deve filtrar por múltiplas categorias combinadas", async () => {
    const res = await fetch(`${BASE_URL}?category=gaming,music`);
    const data = (await res.json()) as NftListResponse;

    expect(data.total).toBe(3); // Golden Bear #207 (gaming), Golden Signal #140 (music), Golden Signal #160 (music)
    expect(data.items.every((nft) => ["gaming", "music"].includes(nft.category))).toBe(
      true,
    );
  });

  it("deve filtrar por raridade e rede blockchain", async () => {
    const res = await fetch(`${BASE_URL}?rarity=legendary&network=ethereum`);
    const data = (await res.json()) as NftListResponse;

    expect(data.total).toBe(2); // Emerald Ape #042 e Ivory Baron #888
    expect(
      data.items.every((nft) => nft.rarity === "legendary" && nft.network === "ethereum"),
    ).toBe(true);
  });

  it("deve filtrar por faixa de preço em ETH usando aritmética precisa", async () => {
    const res = await fetch(`${BASE_URL}?priceMin=1.20&priceMax=1.70`);
    const data = (await res.json()) as NftListResponse;

    expect(data.total).toBeGreaterThan(0);
    expect(
      data.items.every(
        (nft) =>
          compareEth(nft.price, asEthString("1.20")) >= 0 &&
          compareEth(nft.price, asEthString("1.70")) <= 0,
      ),
    ).toBe(true);
  });

  it("deve ordenar os itens por preço crescente (price_asc) e decrescente (price_desc)", async () => {
    // 1. Preço crescente
    const resAsc = await fetch(`${BASE_URL}?sort=price_asc&pageSize=12`);
    const dataAsc = (await resAsc.json()) as NftListResponse;

    for (let i = 0; i < dataAsc.items.length - 1; i++) {
      const current = dataAsc.items[i]!;
      const next = dataAsc.items[i + 1]!;
      expect(compareEth(current.price, next.price)).toBeLessThanOrEqual(0);
    }

    // 2. Preço decrescente
    const resDesc = await fetch(`${BASE_URL}?sort=price_desc&pageSize=12`);
    const dataDesc = (await resDesc.json()) as NftListResponse;

    for (let i = 0; i < dataDesc.items.length - 1; i++) {
      const current = dataDesc.items[i]!;
      const next = dataDesc.items[i + 1]!;
      expect(compareEth(current.price, next.price)).toBeGreaterThanOrEqual(0);
    }
  });

  it("deve paginar os resultados corretamente na página 2", async () => {
    const res = await fetch(`${BASE_URL}?page=2&pageSize=4`);
    const data = (await res.json()) as NftListResponse;

    expect(data.page).toBe(2);
    expect(data.pageSize).toBe(4);
    expect(data.total).toBe(12);
    expect(data.totalPages).toBe(3);
    expect(data.items).toHaveLength(4);
  });

  it("deve retornar um NFT por ID existente", async () => {
    const res = await fetch(`${BASE_URL}/nft-1`);
    expect(res.status).toBe(200);

    const nft = (await res.json()) as Nft;
    expect(nft.id).toBe("nft-1");
    expect(nft.title).toBe("Emerald Ape #042");
    expect(nft.price).toBe("1.19");
  });

  it("deve retornar status 404 e ApiErrorBody para ID inexistente", async () => {
    const res = await fetch(`${BASE_URL}/nft-nao-existe`);
    expect(res.status).toBe(404);

    const error = (await res.json()) as ApiErrorBody;
    expect(error.code).toBe("not_found");
    expect(error.message).toContain("não encontrado");
  });

  it("deve filtrar por disponibilidade de edições", async () => {
    // Todos os 12 NFTs das seeds têm estoque disponível
    const resAvail = await fetch(`${BASE_URL}?availability=available`);
    const dataAvail = (await resAvail.json()) as NftListResponse;
    expect(dataAvail.total).toBe(12);

    // Quando esgotado
    const resSold = await fetch(`${BASE_URL}?availability=sold_out`);
    const dataSold = (await resSold.json()) as NftListResponse;
    expect(dataSold.total).toBe(0);
  });

  it("deve ordenar itens por popularidade priorizando itens em destaque (featured)", async () => {
    const res = await fetch(`${BASE_URL}?sort=popular&pageSize=12`);
    const data = (await res.json()) as NftListResponse;

    let seenNonFeatured = false;
    for (const nft of data.items) {
      if (!nft.featured) {
        seenNonFeatured = true;
      }
      if (seenNonFeatured) {
        // Uma vez que vimos um não featured, não podemos ver outro featured depois
        expect(nft.featured).toBe(false);
      }
    }
  });

  it("deve interceptar requisições através do scenarioEngine quando ativado", async () => {
    scenarioEngine.setFaultRate(1); // Força 100% de taxa de falha transitória

    const res = await fetch(BASE_URL);
    expect(res.status).toBe(503);

    const error = (await res.json()) as ApiErrorBody;
    expect(error.code).toBe("transient_failure");
  });
});
