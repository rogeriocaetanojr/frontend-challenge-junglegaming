import { delay, http, HttpResponse } from "msw";

import { MOCK_NFTS } from "../data/nfts";
import type { NftItem, PaginatedResponse } from "@/types/nft";

export const nftHandlers = [
  http.get("/api/nfts", async ({ request }) => {
    // Simula atraso realista de resposta de rede
    await delay(300);

    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase().trim() || "";
    const category = url.searchParams.get("category") || "";
    const minPrice = parseFloat(url.searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(url.searchParams.get("maxPrice") || "Infinity");
    const sortBy = url.searchParams.get("sortBy") || "recent";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "8", 10));

    let filtered = [...MOCK_NFTS];

    // Filtro por texto (nome, descrição ou coleção)
    if (search) {
      filtered = filtered.filter(
        (nft) =>
          nft.name.toLowerCase().includes(search) ||
          nft.description.toLowerCase().includes(search) ||
          nft.collection.name.toLowerCase().includes(search),
      );
    }

    // Filtro por categoria
    if (category && category !== "all") {
      filtered = filtered.filter((nft) => nft.category === category);
    }

    // Filtro por faixa de preço em ETH
    if (minPrice > 0) {
      filtered = filtered.filter((nft) => nft.priceEth >= minPrice);
    }
    if (!isNaN(maxPrice) && maxPrice < Infinity) {
      filtered = filtered.filter((nft) => nft.priceEth <= maxPrice);
    }

    // Ordenação flexível
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.priceEth - b.priceEth);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.priceEth - a.priceEth);
        break;
      case "popular":
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case "recent":
      default:
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    // Paginação
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedItems = filtered.slice(offset, offset + limit);

    const response: PaginatedResponse<NftItem> = {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages,
    };

    return HttpResponse.json(response);
  }),

  http.get("/api/nfts/:id", async ({ params }) => {
    await delay(200);
    const { id } = params;

    const nft = MOCK_NFTS.find((item) => item.id === String(id));

    if (!nft) {
      return HttpResponse.json({ message: "NFT não encontrado" }, { status: 404 });
    }

    return HttpResponse.json(nft);
  }),
];
