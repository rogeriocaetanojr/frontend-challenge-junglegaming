import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import BigNumber from "bignumber.js";

import { calculateTotalEth, formatUsd } from "@/lib/formatters";
import type { CartItem } from "@/types/cart";

export const DEFAULT_ETH_USD_RATE = 3200;

export interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  getItemCount: () => number;
  getTotalEth: () => string;
  getTotalUsd: (ethRate?: number) => string;
}

/**
 * Store global de gerenciamento do carrinho de compras com persistência local.
 * Implementa integridade atômica para itens 1 de 1 e cálculos de alta precisão via BigNumber.
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        const { items } = get();
        // Não duplica se o NFT já estiver no carrinho (1 de 1)
        if (items.some((existing) => existing.id === item.id)) {
          return;
        }
        set({ items: [...items, { ...item, quantity: 1 }] });
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      isInCart: (id: string) => {
        return get().items.some((item) => item.id === id);
      },

      getItemCount: () => {
        return get().items.length;
      },

      getTotalEth: () => {
        const { items } = get();
        return calculateTotalEth(items.map((item) => ({ price: item.priceEth })));
      },

      getTotalUsd: (ethRate = DEFAULT_ETH_USD_RATE) => {
        const totalEthStr = get().getTotalEth();
        const totalUsdValue = new BigNumber(totalEthStr).multipliedBy(ethRate);
        return formatUsd(totalUsdValue.toString(10));
      },
    }),
    {
      name: "@nft-marketplace:cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
