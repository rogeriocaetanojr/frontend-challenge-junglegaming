/**
 * Handlers REST do MSW para a lista de favoritos (isolados por usuário autenticado).
 */
import { http, HttpResponse } from "msw";

import type { ApiErrorBody, IsoDate } from "@/contracts/common";
import { db, dbHelpers, saveFavorites, type DbFavorite, type DbUser } from "@/mocks/db";
import { scenarioEngine } from "@/mocks/scenarios";

export interface FavoriteItemResponse {
  id: string;
  name: string;
  priceEth: number;
  image: string;
  collectionName: string;
  favoritedAt: string;
}

function extractUserFromHeader(request: Request): DbUser | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) return null;

  if (token.startsWith("mock-token-")) {
    const remainder = token.slice("mock-token-".length);
    for (const user of db.users.values()) {
      if (remainder.startsWith(user.id)) return user;
    }
  }

  return dbHelpers.findUserById(token) ?? null;
}

function toResponse(favorite: DbFavorite): FavoriteItemResponse | null {
  const nft = dbHelpers.findNftById(favorite.nftId);
  if (!nft) return null;

  return {
    id: nft.id,
    name: nft.title,
    priceEth: Number(nft.price) || 0,
    image: nft.images[0]?.url || "/images/nfts/emerald-ape.png",
    collectionName: nft.collection.name,
    favoritedAt: favorite.favoritedAt,
  };
}

function listFavorites(userId: string): FavoriteItemResponse[] {
  const favorites = db.favorites.get(userId) ?? [];
  return favorites
    .map(toResponse)
    .filter((item): item is FavoriteItemResponse => item !== null);
}

const unauthorized = () =>
  HttpResponse.json<ApiErrorBody>(
    { code: "unauthorized", message: "Autenticação obrigatória para acessar favoritos." },
    { status: 401 },
  );

export const favoritesHandlers = [
  // 1. Lista os favoritos do usuário autenticado
  http.get("*/api/favorites", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) return fault;

    const user = extractUserFromHeader(request);
    if (!user) return unauthorized();

    return HttpResponse.json<FavoriteItemResponse[]>(listFavorites(user.id), {
      status: 200,
    });
  }),

  // 2. Adiciona um NFT aos favoritos (idempotente)
  http.post("*/api/favorites", async ({ request }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) return fault;

    const user = extractUserFromHeader(request);
    if (!user) return unauthorized();

    let body: { nftId?: string };
    try {
      body = (await request.json()) as { nftId?: string };
    } catch {
      return HttpResponse.json<ApiErrorBody>(
        { code: "validation_error", message: "Corpo JSON inválido." },
        { status: 400 },
      );
    }

    const nftId = body.nftId;
    if (!nftId) {
      return HttpResponse.json<ApiErrorBody>(
        { code: "validation_error", message: "nftId é obrigatório." },
        { status: 400 },
      );
    }

    if (!dbHelpers.findNftById(nftId)) {
      return HttpResponse.json<ApiErrorBody>(
        { code: "not_found", message: `NFT com id '${nftId}' não encontrado.` },
        { status: 404 },
      );
    }

    const favorites = db.favorites.get(user.id) ?? [];
    if (!favorites.some((fav) => fav.nftId === nftId)) {
      favorites.push({ nftId, favoritedAt: new Date().toISOString() as IsoDate });
      db.favorites.set(user.id, favorites);
      saveFavorites();
    }

    return HttpResponse.json<FavoriteItemResponse[]>(listFavorites(user.id), {
      status: 200,
    });
  }),

  // 3. Remove um NFT dos favoritos
  http.delete("*/api/favorites/:nftId", async ({ request, params }) => {
    const fault = await scenarioEngine.executeMiddleware(request.url);
    if (fault) return fault;

    const user = extractUserFromHeader(request);
    if (!user) return unauthorized();

    const nftId = String(params.nftId);
    const favorites = db.favorites.get(user.id) ?? [];
    db.favorites.set(
      user.id,
      favorites.filter((fav) => fav.nftId !== nftId),
    );
    saveFavorites();

    return HttpResponse.json<FavoriteItemResponse[]>(listFavorites(user.id), {
      status: 200,
    });
  }),
];
