import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NftItem } from "@/types/nft";

export interface FavoriteItem {
  id: string;
  name: string;
  priceEth: number;
  image: string;
  collectionName?: string;
  creatorName?: string;
  favoritedAt: string;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  addFavorite: (
    nft:
      | NftItem
      | {
          id: string;
          name?: string;
          title?: string;
          priceEth?: number;
          price?: string | number;
          image?: string;
          images?: Array<{ url: string }>;
          collection?: { name?: string };
          creator?: { name?: string };
        },
  ) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (
    nft:
      | NftItem
      | {
          id: string;
          name?: string;
          title?: string;
          priceEth?: number;
          price?: string | number;
          image?: string;
          images?: Array<{ url: string }>;
          collection?: { name?: string };
          creator?: { name?: string };
        },
  ) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [
        // Itens iniciais favoritados padrão para já exibir na lista de interesse
        {
          id: "1",
          name: "Emerald Ape #042",
          priceEth: 1.19,
          image: "/images/nfts/emerald-ape.png",
          collectionName: "Genesis Apes",
          creatorName: "Kurio Studios",
          favoritedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Sage Nomad #009",
          priceEth: 1.69,
          image: "/images/nfts/sage-nomad.png",
          collectionName: "Genesis Apes",
          creatorName: "Nomad Collective",
          favoritedAt: new Date().toISOString(),
        },
      ],

      addFavorite: (nft) => {
        const id = String(nft.id);
        if (get().isFavorite(id)) return;

        const raw = nft as {
          id: string;
          name?: string;
          title?: string;
          priceEth?: number;
          price?: string | number;
          image?: string;
          images?: Array<{ url: string }>;
          collection?: { name?: string };
          creator?: { name?: string };
        };

        const item: FavoriteItem = {
          id,
          name: raw.title || raw.name || `NFT #${id}`,
          priceEth: Number(raw.priceEth ?? raw.price) || 0,
          image: raw.images?.[0]?.url || raw.image || "/images/nfts/emerald-ape.png",
          collectionName: raw.collection?.name || "Genesis Apes",
          creatorName: raw.creator?.name || "Kurio Studios",
          favoritedAt: new Date().toISOString(),
        };

        set((state) => ({
          favorites: [item, ...state.favorites],
        }));
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((item) => item.id !== String(id)),
        }));
      },

      toggleFavorite: (nft) => {
        const id = String(nft.id);
        if (get().isFavorite(id)) {
          get().removeFavorite(id);
        } else {
          get().addFavorite(nft);
        }
      },

      isFavorite: (id) => {
        return get().favorites.some((item) => item.id === String(id));
      },

      clearFavorites: () => {
        set({ favorites: [] });
      },
    }),
    {
      name: "kurio_favorites_storage",
    },
  ),
);
