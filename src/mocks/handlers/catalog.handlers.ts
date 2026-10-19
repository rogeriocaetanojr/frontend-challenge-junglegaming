/**
 * Handlers REST do MSW para o catálogo de NFTs.
 *
 * Implementa busca textual, filtros combinados (categoria, coleção, raridade, rede,
 * disponibilidade), limites de preço via aritmética pura de ETH (compareEth),
 * ordenação flexível, paginação e agregação de facetas.
 */
import { http, HttpResponse } from "msw";

import type {
  Network,
  Nft,
  NftFacetItem,
  NftFacets,
  NftListResponse,
  NftRarity,
  NftSortOption,
} from "@/contracts/catalog";
import { type ApiErrorBody, isEthString } from "@/contracts/common";
import { compareEth } from "@/lib/money";
import { db, dbHelpers } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";

function parseMultiParam(url: URL, paramName: string): string[] {
  const values = url.searchParams.getAll(paramName);
  const result: string[] = [];
  for (const val of values) {
    for (const item of val.split(",")) {
      const trimmed = item.trim().toLowerCase();
      if (trimmed) {
        result.push(trimmed);
      }
    }
  }
  return result;
}

function formatLabel(value: string): string {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function computeFacets(nfts: Nft[]): NftFacets {
  const collectionCounts = new Map<string, { name: string; count: number }>();
  const categoryCounts = new Map<string, number>();
  const networkCounts = new Map<string, number>();
  const rarityCounts = new Map<string, number>();

  for (const nft of nfts) {
    // Coleções
    const currentColl = collectionCounts.get(nft.collection.id) ?? {
      name: nft.collection.name,
      count: 0,
    };
    currentColl.count += 1;
    collectionCounts.set(nft.collection.id, currentColl);

    // Categorias
    categoryCounts.set(nft.category, (categoryCounts.get(nft.category) ?? 0) + 1);

    // Redes
    networkCounts.set(nft.network, (networkCounts.get(nft.network) ?? 0) + 1);

    // Raridades
    rarityCounts.set(nft.rarity, (rarityCounts.get(nft.rarity) ?? 0) + 1);
  }

  const collections: NftFacetItem[] = Array.from(collectionCounts.entries()).map(
    ([id, data]) => ({
      value: id,
      label: data.name,
      count: data.count,
    }),
  );

  const categories: NftFacetItem[] = Array.from(categoryCounts.entries()).map(
    ([cat, count]) => ({
      value: cat,
      label: formatLabel(cat),
      count,
    }),
  );

  const networks: NftFacetItem[] = Array.from(networkCounts.entries()).map(
    ([net, count]) => ({
      value: net,
      label: formatLabel(net),
      count,
    }),
  );

  const rarities: NftFacetItem[] = Array.from(rarityCounts.entries()).map(
    ([rarity, count]) => ({
      value: rarity,
      label: formatLabel(rarity),
      count,
    }),
  );

  return { collections, categories, networks, rarities };
}

export const catalogHandlers = [
  // Listagem paginada do catálogo de NFTs com filtros e facetas
  http.get("*/api/nfts", async ({ request }) => {
    // Interceptação pelo motor de cenários (latência e falhas controladas)
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const url = new URL(request.url);

    // 1. Extração de parâmetros de consulta
    const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
    const categories = parseMultiParam(url, "category");
    const collections = parseMultiParam(url, "collection");
    const rarities = parseMultiParam(url, "rarity") as NftRarity[];
    const networks = parseMultiParam(url, "network") as Network[];
    const availability = url.searchParams.get("availability") ?? "all";
    const priceMin = url.searchParams.get("priceMin");
    const priceMax = url.searchParams.get("priceMax");
    const sort = (url.searchParams.get("sort") as NftSortOption) ?? "recent";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const pageSize = Math.max(
      1,
      parseInt(
        url.searchParams.get("pageSize") ?? url.searchParams.get("limit") ?? "8",
        10,
      ),
    );

    let filtered = Array.from(db.nfts.values());

    // 2. Filtro textual
    if (q) {
      filtered = filtered.filter(
        (nft) =>
          nft.title.toLowerCase().includes(q) ||
          nft.description.toLowerCase().includes(q) ||
          nft.collection.name.toLowerCase().includes(q),
      );
    }

    // 3. Filtro por categoria
    if (categories.length > 0 && !categories.includes("all")) {
      filtered = filtered.filter((nft) =>
        categories.includes(nft.category.toLowerCase()),
      );
    }

    // 4. Filtro por coleção
    if (collections.length > 0 && !collections.includes("all")) {
      filtered = filtered.filter(
        (nft) =>
          collections.includes(nft.collection.id.toLowerCase()) ||
          collections.includes(nft.collection.name.toLowerCase()),
      );
    }

    // 5. Filtro por raridade
    if (rarities.length > 0) {
      filtered = filtered.filter((nft) => rarities.includes(nft.rarity));
    }

    // 6. Filtro por rede blockchain
    if (networks.length > 0 && !networks.includes("all" as Network)) {
      filtered = filtered.filter((nft) => networks.includes(nft.network));
    }

    // 7. Filtro por disponibilidade de edições
    if (availability === "available") {
      filtered = filtered.filter(
        (nft) => nft.editions.reduce((acc, ed) => acc + ed.available, 0) > 0,
      );
    } else if (availability === "sold_out") {
      filtered = filtered.filter(
        (nft) => nft.editions.reduce((acc, ed) => acc + ed.available, 0) === 0,
      );
    }

    // 8. Filtros de faixa de preço com precisão decimal em ETH
    if (priceMin && isEthString(priceMin)) {
      filtered = filtered.filter((nft) => compareEth(nft.price, priceMin) >= 0);
    }
    if (priceMax && isEthString(priceMax)) {
      filtered = filtered.filter((nft) => compareEth(nft.price, priceMax) <= 0);
    }

    // 9. Agregação de facetas sobre o conjunto filtrado
    const facets = computeFacets(filtered);

    // 10. Ordenação
    switch (sort) {
      case "price_asc":
        filtered.sort((a, b) => compareEth(a.price, b.price));
        break;
      case "price_desc":
        filtered.sort((a, b) => compareEth(b.price, a.price));
        break;
      case "popular":
        filtered.sort((a, b) => {
          if (a.featured !== b.featured) {
            return b.featured ? 1 : -1;
          }
          return b.version - a.version;
        });
        break;
      case "recent":
      default:
        filtered.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        break;
    }

    // 11. Paginação determinística
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

    const response: NftListResponse = {
      items: paginatedItems,
      total,
      page,
      pageSize,
      totalPages,
      facets,
    };

    return HttpResponse.json(response);
  }),

  // Detalhe de um NFT por ID
  http.get("*/api/nfts/:id", async ({ params, request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) {
      return fault;
    }

    const { id } = params;
    const nft = dbHelpers.findNftById(String(id));

    if (!nft) {
      const errorBody: ApiErrorBody = {
        code: "not_found",
        message: `NFT com id '${String(id)}' não encontrado.`,
      };
      return HttpResponse.json(errorBody, { status: 404 });
    }

    return HttpResponse.json(nft);
  }),
];
