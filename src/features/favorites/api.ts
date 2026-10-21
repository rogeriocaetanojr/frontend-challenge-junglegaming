/**
 * Camada de dados de favoritos (API /api/favorites) com TanStack Query.
 *
 * Mutação otimista: atualiza o cache imediatamente em `onMutate`, faz rollback do
 * snapshot anterior em `onError` e revalida em `onSettled`.
 */
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getSession } from "@/lib/auth/session-store";
import { http } from "@/lib/http";
import { queryKeys } from "@/lib/query/keys";
import { useAuthStore } from "@/store/auth-store";

export interface FavoriteItem {
  id: string;
  name: string;
  priceEth: number;
  image: string;
  collectionName: string;
  favoritedAt: string;
}

/** Formato mínimo aceito para favoritar, compatível com NFT de catálogo ou detalhe. */
export interface FavoritableNft {
  id: string;
  title?: string;
  name?: string;
  priceEth?: number;
  price?: string | number;
  image?: string;
  images?: Array<{ url: string }>;
  collection?: { name?: string };
}

function useFavoritesUserId(): string | null {
  const storeUserId = useAuthStore((state) => state.user?.id);
  return storeUserId ?? getSession()?.userId ?? null;
}

function favoritesQueryOptions(userId: string | null) {
  return queryOptions({
    queryKey: userId
      ? queryKeys.user(userId).favorites()
      : (["favorites", "anonymous"] as const),
    queryFn: () => http.get<FavoriteItem[]>("/favorites"),
    enabled: Boolean(userId),
  });
}

export function useFavorites() {
  const queryClient = useQueryClient();
  const userId = useFavoritesUserId();
  const options = favoritesQueryOptions(userId);
  const key = options.queryKey;

  const favoritesQuery = useQuery(options);
  const favorites = favoritesQuery.data ?? [];

  const setFavorites = (data: FavoriteItem[]) => queryClient.setQueryData(key, data);

  const addMutation = useMutation({
    mutationFn: (nft: FavoritableNft) =>
      http.post<FavoriteItem[]>("/favorites", { nftId: nft.id }),
    onMutate: async (nft) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FavoriteItem[]>(key) ?? [];

      const optimisticItem: FavoriteItem = {
        id: String(nft.id),
        name: nft.title || nft.name || `NFT #${nft.id}`,
        priceEth: Number(nft.priceEth ?? nft.price) || 0,
        image: nft.images?.[0]?.url || nft.image || "/images/nfts/emerald-ape.png",
        collectionName: nft.collection?.name || "Coleção Exclusiva",
        favoritedAt: new Date().toISOString(),
      };

      if (!previous.some((item) => item.id === optimisticItem.id)) {
        queryClient.setQueryData<FavoriteItem[]>(key, [optimisticItem, ...previous]);
      }

      return { previous };
    },
    onError: (_error, _nft, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: setFavorites,
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const removeMutation = useMutation({
    mutationFn: (nftId: string) => http.delete<FavoriteItem[]>(`/favorites/${nftId}`),
    onMutate: async (nftId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FavoriteItem[]>(key) ?? [];
      queryClient.setQueryData<FavoriteItem[]>(
        key,
        previous.filter((item) => item.id !== nftId),
      );
      return { previous };
    },
    onError: (_error, _nftId, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: setFavorites,
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const isFavorite = (id: string) => favorites.some((item) => item.id === String(id));

  const toggleFavorite = (nft: FavoritableNft) => {
    const id = String(nft.id);
    if (isFavorite(id)) {
      removeMutation.mutate(id);
    } else {
      addMutation.mutate(nft);
    }
  };

  const clearFavorites = () => {
    for (const item of favorites) removeMutation.mutate(item.id);
  };

  return {
    favorites,
    isLoading: favoritesQuery.isLoading,
    isFavorite,
    toggleFavorite,
    removeFavorite: (id: string) => removeMutation.mutate(id),
    clearFavorites,
  };
}
